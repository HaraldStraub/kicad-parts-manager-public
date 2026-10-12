"""Read-only diagnostics for the local catalog window."""

import json
import os
import platform
import re
import shutil
import subprocess
from importlib.metadata import PackageNotFoundError, version
from pathlib import Path

from kicad_parts_manager.manufacturer_parameters import ManufacturerParameters
from kicad_parts_manager.validation.runner import find_ngspice


def find_kicad_cli():
    executable = shutil.which("kicad-cli")
    if executable:
        return executable
    if os.name != "nt":
        return None
    root = Path(os.environ.get("ProgramFiles", "C:/Program Files")) / "KiCad"
    candidates = list(root.glob("*/bin/kicad-cli.exe"))
    return (
        str(
            max(
                candidates,
                key=lambda p: tuple(
                    int(n) for n in re.findall(r"\d+", p.parents[1].name)
                ),
            )
        )
        if candidates
        else None
    )


def program_version(name, executable):
    if not executable:
        return {
            "available": False,
            "version": None,
            "path": None,
            "reason": "Programm nicht gefunden",
        }
    try:
        result = subprocess.run(
            [str(executable), "--version"],
            capture_output=True,
            text=True,
            errors="replace",
            timeout=4,
            check=False,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
        )
        output = result.stdout + "\n" + result.stderr
        expression = (
            r"ngspice\s*[-:]?\s*(\d[\w.-]*)"
            if name == "ngspice"
            else r"(?m)^\s*(\d+\.\d+(?:\.\d+)?[\w.+-]*)"
        )
        match = re.search(expression, output, re.IGNORECASE)
        if result.returncode == 0 and match:
            return {
                "available": True,
                "version": match[1],
                "path": str(executable),
                "reason": "",
            }
        return {
            "available": True,
            "version": None,
            "path": str(executable),
            "reason": "Version konnte nicht ermittelt werden",
        }
    except (OSError, subprocess.TimeoutExpired):
        return {
            "available": True,
            "version": None,
            "path": str(executable),
            "reason": "Versionsabfrage fehlgeschlagen oder Zeitlimit erreicht",
        }


def about_data(database, inventory=None, manual=None, models=None):
    try:
        application_version = version("kicad-parts-manager")
    except PackageNotFoundError:
        application_version = "nicht installiert"
    pack = ManufacturerParameters()
    result = {
        "application_version": application_version,
        "python_version": platform.python_version(),
        "kicad": program_version("KiCad", find_kicad_cli()),
        "ngspice": program_version("ngspice", find_ngspice()),
        "manufacturer_pack": {
            "version": pack.data["version"],
            "records": len(pack.records),
            "parameters": sum(len(r["values"]) for r in pack.records.values()),
        },
        "inventory": {
            "scanned_at": (inventory or {}).get("scanned_at"),
            "counts": (inventory or {}).get("counts", {}),
        },
        "local_data": {
            "components": 0,
            "parameters": 0,
            "manufacturer_parameters": 0,
            "updated_at": None,
        },
        "models": {"indexed": 0, "assigned": 0},
        "paths": {
            "database": str(database.url),
            "manual": str(manual.path.resolve()) if manual else None,
        },
    }
    if manual:
        with manual.connect() as connection:
            rows = connection.execute("SELECT data FROM overrides").fetchall()
        local = [json.loads(row[0]) for row in rows]
        result["local_data"] = {
            "components": len(local),
            "parameters": sum(len(r.get("values", {})) for r in local),
            "manufacturer_parameters": sum(
                bool(v.get("source_details", {}).get("candidate_id"))
                for r in local
                for v in r.get("values", {}).values()
            ),
            "updated_at": max((r.get("updated_at", "") for r in local), default=None),
        }
    if models:
        with models.connect() as connection:
            result["models"] = {
                "indexed": connection.execute("SELECT COUNT(*) FROM models").fetchone()[
                    0
                ],
                "assigned": connection.execute(
                    "SELECT COUNT(*) FROM assignments"
                ).fetchone()[0],
            }
        result["paths"]["models"] = str(models.root.resolve())
    return result
