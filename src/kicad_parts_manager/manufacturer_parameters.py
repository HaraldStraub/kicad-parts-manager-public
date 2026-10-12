"""Source-bound, reviewable manufacturer facts; never a simulation qualification."""

import copy
import hashlib
import json
import math
import re
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from kicad_parts_manager.manual_data import component_key, fields_for
from kicad_parts_manager.api_errors import ApiError

DATA = Path(__file__).with_name("data") / "manufacturer-parameters.json"


def validate_record(item):
    """Reject malformed future packs before any catalog import can write values."""
    aliases = item.get("symbol_aliases", [])
    if (
        not isinstance(aliases, list)
        or any(not isinstance(a, str) or not re.fullmatch(r"[^:\s]+:[^:\s]+", a) for a in aliases)
        or len(set(aliases)) != len(aliases)
        or (aliases and (not isinstance(item.get("symbol_alias_review"), str) or not item["symbol_alias_review"].strip()))
    ):
        raise ValueError("Ungeprüfte Symbolreferenz-Zuordnung: " + item["id"])
    definitions = {
        f["key"]: f for f in fields_for({"category": item.get("category", "")})
    }
    if not set(item["values"]).issubset(definitions):
        raise ValueError(
            "Herstellerdaten enthalten unbekannte Parameter: " + item["id"]
        )
    kinds = {
        "unspecified",
        "nominal",
        "typical",
        "minimum",
        "maximum",
        "absolute_maximum",
    }
    for key, entry in item["values"].items():
        label = item["id"] + "/" + key
        definition = definitions[key]
        if not isinstance(entry, dict):
            # Validation failures share the API's user-facing ValueError path.
            raise ValueError("Ungültiger Hersteller-Kennwert: " + label)  # noqa: TRY004
        value = entry.get("value")
        if definition.get("type") == "text":
            valid = isinstance(value, str) and 0 < len(value) <= 1000
        else:
            valid = (
                not isinstance(value, bool)
                and isinstance(value, (int, float))
                and math.isfinite(value)
            )
        if not valid or entry.get("kind") not in kinds:
            raise ValueError("Ungültiger Wert oder Kennwertart: " + label)
        if (
            not isinstance(entry.get("page"), str)
            or not entry["page"]
            or not isinstance(entry.get("conditions"), str)
        ):
            raise ValueError("Quellseite oder Messbedingungen fehlen: " + label)
        allowed = {c["key"]: c for c in definition.get("conditions", [])}
        measured = entry.get("conditions_data", {})
        if not isinstance(measured, dict) or not set(measured).issubset(allowed):
            raise ValueError("Unbekannte Messbedingung: " + label)
        for name, current in measured.items():
            condition = allowed[name]
            if condition.get("type") == "text":
                valid = isinstance(current, str) and (
                    not condition.get("options") or current in condition["options"]
                )
            else:
                valid = (
                    not isinstance(current, bool)
                    and isinstance(current, (int, float))
                    and math.isfinite(current)
                )
            if not valid:
                raise ValueError("Ungültige Messbedingung: " + label + "/" + name)
    source = item["source"]
    if any(
        not isinstance(source.get(k), str) or not source[k]
        for k in ("document", "revision", "accessed_on", "review_method")
    ):
        raise ValueError("Unvollständiger Quellennachweis: " + item["id"])
    if source.get("sha256") and not re.fullmatch("[0-9a-f]{64}", source["sha256"]):
        raise ValueError("Ungültiger PDF-Hash: " + item["id"])


def normalize_mpn(value):
    # Suffixes and selection groups are significant. No fuzzy identity matching.
    return str(value or "").strip().casefold()


def document_identity(url):
    parsed = urlsplit(str(url or ""))
    host = (parsed.hostname or "").lower().removeprefix("www.")
    path = parsed.path.casefold()
    if host == "vishay.com" and path == "/doc":
        # The document number lives in the query, not in the path.
        # Distinct PDFs at this endpoint must never compare as one source.
        return host + path + "?" + parsed.query.removesuffix("=")
    if host == "diodes.com" and not parsed.username and not parsed.password:
        # DS18010 is the same reviewed family PDF under the new download name.
        if path in ("/assets/datasheets/ds18010.pdf", "/datasheet/download/mmsz5221b.pdf"):
            return "diodes.com:ds18010"
    if host == "ti.com" and not parsed.username and not parsed.password:
        # Only the reviewed document and TI's own legacy forwarding endpoint.
        reviewed = {
            "/lit/ds/symlink/tl431.pdf": "tl431",
            "/lit/gpn/tl431": "tl431",
            "/lit/ds/symlink/ne555.pdf": "ne555",
            "/lit/gpn/ne555": "ne555",
            "/lit/ds/symlink/lm358.pdf": "lm358",
            "/lit/gpn/lm358": "lm358",
            "/lit/ds/symlink/tl071.pdf": "tl071",
            "/lit/gpn/tl071a": "tl071",

        }
        if path in reviewed:
            return "ti.com:" + reviewed[path]
        if path == "/general/docs/suppproductinfo.tsp":
            target = parse_qs(parsed.query).get("gotoUrl", [""])[0]
            nested = urlsplit(target)
            if (
                (nested.hostname or "").lower().removeprefix("www.") == "ti.com"
                and nested.path.casefold() in reviewed
                and not nested.username
                and not nested.password
            ):
                return "ti.com:" + reviewed[nested.path.casefold()]
    if host == "st.com" and not parsed.username and not parsed.password:
        for document, canonical in [("cd00000444", "l78"), ("cd00000455", "lm317")]:
            legacy = re.fullmatch(r"/content/ccc/resource/technical/document/datasheet/(?:[a-z0-9]+/)+" + document + r"(?:\.pdf)?/files/" + document + r"\.pdf/jcr:content/translations/en\." + document + r"\.pdf", path)
            if path == "/resource/en/datasheet/" + canonical + ".pdf" or legacy:
                return "st.com:" + canonical
    if host in ("onsemi.com", "aosmd.com") and path.endswith(".pdf"):
        return host + ":" + path.rsplit("/", 1)[-1]
    return host + path


def package_matches(footprint, record):
    name = str(footprint or "").split(":")[-1]
    if record["package"] == "TO-92":
        return (
            re.fullmatch(
                r"TO-92(?:-3)?(?:_[A-Za-z][A-Za-z0-9_-]*)?", name, re.IGNORECASE
            )
            is not None
        )
    if record["package"] == "SOIC-8":
        return (
            re.fullmatch(
                r"SOIC-8(?:_(?:3\.9x4\.9mm_P1\.27mm|W3\.9mm)(?:_[A-Za-z][A-Za-z0-9_-]*)?)?",
                name,
                re.IGNORECASE,
            )
            is not None
        )
    if record["package"] == "PDIP-14":
        return re.fullmatch(r"P?DIP-14(?:_W7\.62mm(?:_[A-Za-z][A-Za-z0-9_-]*)?)?", name, re.IGNORECASE) is not None
    if record["package"] == "TO-220":
        return re.fullmatch(r"TO-220-3(?:_[A-Za-z][A-Za-z0-9_-]*)?", name, re.IGNORECASE) is not None
    if record["package"] == "PDIP-8":
        return (
            re.fullmatch(
                r"P?DIP-8(?:_W7\.62mm(?:_[A-Za-z][A-Za-z0-9_-]*)?)?",
                name,
                re.IGNORECASE,
            )
            is not None
        )
    if record["package"] in ("SOT-23", "SOT-323", "SOT-363"):
        # A longer pin-count suffix is a different package, not an alias.
        number = record["package"].split("-")[-1]
        pins = 6 if number == "363" else 3
        return (
            re.fullmatch(
                r"SOT-?"
                + number
                + r"(?:-"
                + str(pins)
                + r")?(?:_[A-Za-z][A-Za-z0-9_-]*)?",
                name,
                re.IGNORECASE,
            )
            is not None
        )
    return any(
        re.search(
            r"(?<![A-Za-z0-9])" + re.escape(alias) + r"(?![A-Za-z0-9])",
            name,
            re.IGNORECASE,
        )
        for alias in record["package_aliases"]
    )


class ManufacturerParameters:
    def __init__(self, path=DATA):
        self.path = Path(path)
        raw = self.path.read_bytes()
        self.fingerprint = hashlib.sha256(raw).hexdigest()
        self.data = json.loads(raw)
        if self.data.get("schema_version") != 1:
            raise ValueError("Unbekannte Herstellerdaten-Version.")
        self.records = {}
        for item in self.data["components"]:
            if item["id"] in self.records:
                raise ValueError("Doppelte Herstellerdaten-ID.")
            source = item["source"]
            url = urlsplit(source["url"])
            if (
                url.scheme != "https"
                or not url.hostname
                or url.username
                or url.password
            ):
                raise ValueError("Ungültige Herstellerquelle.")
            if not item["values"] or not item["mpn"] or not item["publisher"]:
                raise ValueError("Unvollständige Herstellerdaten.")
            validate_record(item)
            self.records[item["id"]] = item

    def summary(self):
        return {
            "version": self.data["version"],
            "reviewed_on": self.data["reviewed_on"],
            "components": [
                {k: v for k, v in record.items() if k != "values"}
                | {"parameter_count": len(record["values"])}
                for record in self.records.values()
            ],
        }

    def matches(self, component):
        if component.get("kind") not in (
            "library",
            "manufacturer",
        ) or not component.get("symbol"):
            return []
        category = component.get("category", "")
        polarity = next(
            (
                value
                for segment, value in [
                    ("n_channel", "N"),
                    ("p_channel", "P"),
                    ("npn", "NPN"),
                    ("pnp", "PNP"),
                ]
                if segment in category.split("/")
            ),
            None,
        )
        return [
            r
            for r in self.records.values()
            if (normalize_mpn(r["mpn"]) == normalize_mpn(component.get("name"))
                or component.get("symbol") in r.get("symbol_aliases", []))
            and (category == r["category"] or category.startswith(r["category"] + "/"))
            and (not polarity or not r.get("polarity") or r["polarity"] == polarity)
        ]

    def preview(self, component, manual, candidate_id):
        record = self.records.get(candidate_id)
        if not record or record not in self.matches(component):
            raise ValueError(
                "Herstellerdaten passen nicht zur exakten MPN und Kategorie."
            )
        override = manual.get(component_key(component))
        current = manual.apply(component, override)
        definitions = {f["key"]: f for f in fields_for(component)}
        source = record["source"]
        publisher = record["publisher"]
        manufacturer = current.get("manufacturer", "")
        warnings = []
        if manufacturer and manufacturer.casefold() != publisher.casefold():
            warnings.append(
                "Der vorhandene Hersteller unterscheidet sich vom Datenpaket."
            )
        if document_identity(current.get("datasheet", "")) != document_identity(
            source["url"]
        ):
            warnings.append(
                "Das vorhandene Datenblatt unterscheidet sich von der Herstellerquelle. Variante prüfen."
            )
        if not manufacturer:
            warnings.append(
                "Im Katalog ist kein Hersteller angegeben. Hersteller und genaue Variante prüfen."
            )
        footprint = current.get("footprint", "")
        if not package_matches(footprint, record):
            warnings.append(
                "Gehäuse konnte nicht sicher zugeordnet werden. Footprint und Datenblatt prüfen."
            )
        fields = []
        for key, value in record["values"].items():
            definition = definitions.get(key)
            before = current.get("values", {}).get(key)
            if key in override.get("values", {}):
                state = "protected"
            elif not definition:
                state = "unsupported"
            elif before is None or before == "":
                state = "new"
            elif before == value["value"]:
                state = "same"
            else:
                state = "different"
            fields.append(
                {
                    "key": key,
                    "definition": definition,
                    "before": before,
                    "after": value,
                    "state": state,
                }
            )
        material = {
            "component": current,
            "candidate": record,
            "revision": override["revision"],
            "package_fingerprint": self.fingerprint,
        }
        token = hashlib.sha256(
            json.dumps(
                material, sort_keys=True, ensure_ascii=False, allow_nan=False
            ).encode()
        ).hexdigest()
        return {
            "candidate": copy.deepcopy(record),
            "fields": fields,
            "revision": override["revision"],
            "token": token,
            "warnings": warnings,
            "current_datasheet": current.get("datasheet", ""),
            "current_manufacturer": manufacturer,
            "manufacturer_protected": bool(override.get("manufacturer")),
            "datasheet_protected": bool(override.get("datasheet")),
        }

    def apply(self, component, manual, request):
        preview = self.preview(component, manual, request.get("candidate_id"))
        if request.get("confirm_identity") is not True:
            raise ValueError(
                "Hersteller, genaue MPN und Gehäuse vor Übernahme bestätigen."
            )
        if (
            request.get("preview_token") != preview["token"]
            or type(request.get("revision")) is not int
            or request["revision"] != preview["revision"]
        ):
            raise ApiError('stale_data',"Die Vorschau ist veraltet. Herstellerdaten erneut öffnen.")
        keys = request.get("keys")
        replace = request.get("replace_catalog_keys", [])
        if (
            not isinstance(keys, list)
            or not keys
            or not all(isinstance(k, str) for k in keys)
            or len(keys) != len(set(keys))
        ):
            raise ValueError("Mindestens einen Kennwert auswählen.")
        if (
            not isinstance(replace, list)
            or not all(isinstance(k, str) for k in replace)
            or not set(replace).issubset(keys)
        ):
            raise ValueError("Ungültige Auswahl für vorhandene Katalogwerte.")
        by_key = {f["key"]: f for f in preview["fields"]}
        record = preview["candidate"]
        values = {}
        if (
            preview["current_manufacturer"]
            and preview["current_manufacturer"].casefold()
            != record["publisher"].casefold()
            and request.get("use_manufacturer") is not True
        ):
            raise ValueError(
                "Abweichenden Hersteller ausdrücklich übernehmen, bevor seine Kennwerte gespeichert werden."
            )
        for key in keys:
            field = by_key.get(key)
            if not field or field["state"] in ("protected", "unsupported"):
                raise ValueError("Vorhandene lokale Ergänzungen bleiben geschützt.")
            if field["state"] in ("different", "same") and key not in replace:
                raise ValueError(
                    "Vorhandenen Katalogwert ausdrücklich zur Quellen- oder Wertänderung auswählen."
                )
            entry = copy.deepcopy(field["after"])
            page = str(entry.pop("page"))
            source = record["source"]
            entry["source"] = (
                f"{record['publisher']} · {source['document']} · {source['revision']} · Seite {page} · {source['url']}"
            )
            entry["source_details"] = {
                "publisher": record["publisher"],
                "mpn": record["mpn"],
                "package": record["package"],
                "document": source["document"],
                "revision": source["revision"],
                "page": page,
                "url": source["url"],
                "accessed_on": source["accessed_on"],
                "candidate_id": record["id"],
            }
            if source.get("sha256"):
                entry["source_details"]["sha256"] = source["sha256"]
            values[key] = entry
        payload = {"revision": preview["revision"], "values": values}
        if request.get("use_datasheet") is True:
            if preview["datasheet_protected"]:
                raise ValueError("Der lokal gepflegte Datenblattlink bleibt geschützt.")
            payload.update(
                datasheet=record["source"]["url"],
                datasheet_source=record["publisher"]
                + " · "
                + record["source"]["document"],
            )
        if request.get("use_manufacturer") is True:
            if preview["manufacturer_protected"]:
                raise ValueError("Der lokal gepflegte Hersteller bleibt geschützt.")
            payload.update(
                manufacturer=record["publisher"],
                manufacturer_source=record["source"]["url"],
            )
        result = manual.save(component, payload)
        return {
            "override": result,
            "component": manual.apply(component, result),
            "imported": len(values),
        }
