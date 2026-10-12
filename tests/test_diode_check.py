import json

import pytest

from kicad_parts_manager.diode_check import evaluate, make_deck, validate_roles
from kicad_parts_manager.model_library import ModelLibrary
from kicad_parts_manager.validation.runner import find_ngspice

MODEL = {"type": "D", "pins": ["A", "K"], "name": "SAFE"}
PINS = [{"number": "1", "name": "~"}, {"number": "2", "name": "~"}]
ROLES = {"A": "2", "K": "1"}


def test_diode_stimulus_uses_symbol_roles_independently_of_model_mapping():
    deck = make_deck(MODEL, ".model SAFE D(IS=1e-9)", ["1", "2"], ROLES)
    assert "Rlimit drive symbol_2 1k" in deck and "Vreturn symbol_1 0 0" in deck
    assert "Ddut symbol_1 symbol_2 SAFE" in deck
    assert "dc Vstim -1 1 1" in deck
    with pytest.raises(ValueError):
        validate_roles(MODEL, PINS, {"A": "2", "K": "2"})
    with pytest.raises(ValueError):
        validate_roles(
            MODEL,
            [{"number": "1", "name": "K"}, {"number": "2", "name": "A"}],
            {"A": "1", "K": "2"},
        )
    with pytest.raises(ValueError):
        validate_roles({"type": "X", "pins": ["1", "2"]}, PINS, ROLES)


@pytest.mark.parametrize(
    "forward,reverse,passes",
    [
        (0.0004, -1e-9, True),
        (-1e-9, -0.0004, False),
        (0.001, -0.001, False),
        (1e-9, -1e-12, False),
    ],
)
def test_direction_result_requires_conduction_and_rectification(
    forward, reverse, passes
):
    result = evaluate(
        0,
        f"No. of Data Rows : 3\n0 -1.000000e+00 {reverse:.8e}\n1 0.000000e+00 0.000000e+00\n2 1.000000e+00 {forward:.8e}\n",
    )
    assert result["calculated"] and result["ok"] is passes
    assert (
        result["conditions"]["temperature"] == 25
        and result["conditions"]["resistance"] == 1000
    )
    assert not evaluate(1, "No. of Data Rows : 3")["calculated"]
    assert not evaluate(0, "No. of Data Rows : 3\nunknown parameter ignored")[
        "calculated"
    ]


@pytest.mark.skipif(not find_ngspice(), reason="ngspice not installed")
def test_real_ngspice_detects_swapped_unnamed_symbol_pins_and_keeps_scope_limited(
    tmp_path,
):
    library = ModelLibrary(tmp_path / "models")
    library.upload("diode.lib", ".model SAFE D (IS=1e-9 N=1.8 RS=1)")
    model_id = library.search("SAFE")["candidates"][0]["id"]
    with pytest.raises(ValueError, match="bestätigen"):
        library.test_diode(model_id, "Diode:SAFE", ["2", "1"], PINS, ROLES, False)
    bad = library.test_diode(model_id, "Diode:SAFE", ["1", "2"], PINS, ROLES, True)
    assert (
        bad["calculated"]
        and not bad["ok"]
        and not bad["forward_pass"]
        and not bad["reverse_pass"]
    )
    with pytest.raises(ValueError, match="bestätigten"):
        library.assign(
            "Diode:SAFE", model_id, ["1", "2"], symbol_info=PINS, diode_roles=ROLES
        )
    good = library.test_diode(model_id, "Diode:SAFE", ["2", "1"], PINS, ROLES, True)
    assert good["ok"] and good["calculated"] and good["forward_current"] > 1e-6
    assignment = library.assign(
        "Diode:SAFE",
        model_id,
        ["2", "1"],
        symbol_info=PINS,
        biases=[0.65, 0],
        diode_roles=ROLES,
    )
    assert assignment["status"] == "UNVERIFIED" and assignment["passed"] == []
    assert assignment["check"]["diode_function"]["ok"]
    assert (
        library.assign(
            "Diode:OTHER", model_id, ["2", "1"], symbol_info=PINS, diode_roles=ROLES
        )["check"]
        is None
    )
    assert (
        library.assign("Diode:SAFE", model_id, ["2", "1"], symbol_info=PINS)["check"]
        is None
    )
    assert (
        "symbol_2"
        in (library.root / "checks" / model_id / "diode-direction.cir").read_text()
    )


def test_function_check_ignores_browser_claimed_report(tmp_path):
    library = ModelLibrary(tmp_path)
    library.upload("diode.lib", ".model SAFE D (IS=1e-9)")
    id_ = library.search("SAFE")["candidates"][0]["id"]
    model = library.assign(
        "Diode:SAFE",
        id_,
        ["2", "1"],
        report={"ok": True, "diode_function": {"ok": True}},
        symbol_info=PINS,
        diode_roles=ROLES,
    )
    assert model["check"] is None and model["passed"] == []


def test_saved_direction_evidence_is_invalidated_when_suite_changes(
    tmp_path, monkeypatch
):
    from kicad_parts_manager.diode_check import SUITE

    library = ModelLibrary(tmp_path)
    library.upload("diode.lib", ".model SAFE D (IS=1e-9)")
    id_ = library.search("SAFE")["candidates"][0]["id"]
    (library.root / "checks" / id_).mkdir(parents=True)
    monkeypatch.setattr(
        "kicad_parts_manager.diode_check.run_check",
        lambda *args: {"ok": True, "calculated": True, "suite": SUITE},
    )
    library.test_diode(id_, "Diode:SAFE", ["2", "1"], PINS, ROLES, True)
    assert library.assign(
        "Diode:SAFE", id_, ["2", "1"], symbol_info=PINS, diode_roles=ROLES
    )["check"]["diode_function"]["ok"]
    monkeypatch.setattr("kicad_parts_manager.diode_check.SUITE", "diode-direction-future")
    result = library.assigned("Diode:SAFE")["check"]["diode_function"]
    assert result["stale"] and not result["ok"]
    assert (
        library.assign(
            "Diode:SAFE", id_, ["2", "1"], symbol_info=PINS, diode_roles=ROLES
        )["check"]
        is None
    )


@pytest.mark.skipif(not find_ngspice(), reason="ngspice not installed")
def test_http_direction_check_uses_library_symbol_pins_and_rejects_wrong_assignment(
    tmp_path,
):
    import threading
    from functools import partial
    from http.server import ThreadingHTTPServer
    from urllib.error import HTTPError
    from urllib.request import Request, urlopen

    from sqlalchemy import create_engine

    from kicad_parts_manager.browser import Handler

    database = create_engine("sqlite://")
    library = ModelLibrary(tmp_path / "models")
    library.upload("diode.lib", ".model SAFE D (IS=1e-9 N=1.8 RS=1)")
    id_ = library.search("SAFE")["candidates"][0]["id"]
    source = tmp_path / "symbols.kicad_sym"
    source.write_text(
        '(kicad_symbol_lib (symbol "SAFE" (symbol "SAFE_1_1" (pin passive line (name "~") (number "1")) (pin passive line (name "~") (number "2")))))'
    )
    row = {"id": "SYM-SAFE", "symbol": "Diode:SAFE", "source_file": str(source)}
    server = ThreadingHTTPServer(
        ("127.0.0.1", 0),
        partial(
            Handler, database=database, inventory={"components": [row]}, models=library
        ),
    )
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = f"http://127.0.0.1:{server.server_port}"

    def post(route, payload):
        return urlopen(
            Request(
                base + route,
                json.dumps(payload).encode(),
                headers={"Content-Type": "application/json", "Origin": base},
            )
        )

    payload = {
        "component_id": row["id"],
        "model_id": id_,
        "pins": ["1", "2"],
        "roles": ROLES,
        "confirmed": True,
    }
    try:
        with urlopen(base + "/api/models/pins?component=SYM-SAFE") as response:
            snapshot = json.load(response)
        assert snapshot["symbol_sha256"] and len(snapshot["pins"]) == 2
        payload["symbol_sha256"] = snapshot["symbol_sha256"]
        assert snapshot["symbol_reference"] == row["symbol"]
        with pytest.raises(HTTPError) as error:
            post("/api/models/test-diode", dict(payload, symbol_reference="Diode:Other"))
        assert error.value.code == 400
        payload["symbol_reference"] = snapshot["symbol_reference"]
        with post("/api/models/test-diode", payload) as response:
            bad = json.load(response)
        assert bad["calculated"] and not bad["ok"]
        with pytest.raises(HTTPError) as error:
            post("/api/models/assign", dict(payload, diode_roles=ROLES))
        assert error.value.code == 400
        payload["pins"] = ["2", "1"]
        with post("/api/models/test-diode", payload) as response:
            assert json.load(response)["ok"]
        with post("/api/models/assign", dict(payload, diode_roles=ROLES)) as response:
            assigned = json.load(response)
        assert (
            assigned["status"] == "UNVERIFIED"
            and assigned["passed"] == []
            and assigned["check"]["diode_function"]["ok"]
        )
        assert assigned["symbol_status"] == "found" and assigned["symbol_source_sha256"]
        source.write_text(
            source.read_text().replace("passive line", "passive inverted", 1)
        )
        from kicad_parts_manager.simulation_evidence import refresh_simulation_files

        changed = {"models": [assigned]}
        refresh_simulation_files([changed])
        assert changed["models"][0]["symbol_status"] == "changed"
        assert changed["models"][0]["check"]["stale"]
        with pytest.raises(HTTPError) as error:
            post("/api/models/test-diode", payload)
        assert error.value.code == 400
        # Pin names/numbers stay equal; the old drawing confirmation still expires.
        payload.pop("symbol_sha256")
        with post("/api/models/assign", dict(payload, diode_roles=ROLES)) as response:
            assert json.load(response)["check"] is None
        with urlopen(base + "/diode-panel.js") as response:
            assert response.status == 200
    finally:
        server.shutdown()
        server.server_close()
        thread.join()
        database.dispose()


def test_semantic_pin_identifiers_are_independent_role_evidence():
    from kicad_parts_manager.model_library import check_pin_mapping
    pins=[{"number":"A","name":"~"},{"number":"K","name":"~"}]
    assert validate_roles(MODEL,pins,{"A":"A","K":"K"})=={"A":"A","K":"K"}
    assert check_pin_mapping(MODEL,["A","K"],pins)["status"]=="checked"
    assert check_pin_mapping(MODEL,["K","A"],pins)["status"]=="conflict"
    with pytest.raises(ValueError):validate_roles(MODEL,pins,{"A":"K","K":"A"})
    assert check_pin_mapping(MODEL,["1","2"],PINS)["status"]=="unknown"


def test_explicit_names_take_precedence_over_pin_identifiers():
    from kicad_parts_manager.model_library import symbol_pin_role
    assert symbol_pin_role({"number":"A","name":"K"},{"A":"A","K":"K"})=="K"
    assert symbol_pin_role({"number":"A","name":"OTHER"},{"A":"A","K":"K"}) is None
