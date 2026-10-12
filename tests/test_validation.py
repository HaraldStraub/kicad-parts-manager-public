from pathlib import Path
from types import SimpleNamespace
from hashlib import sha256
import subprocess
import pytest
from sqlalchemy import select, text
from kicad_parts_manager.database.models import *
from kicad_parts_manager.validation.runner import validate, deck
from kicad_parts_manager.validation.review import approve
from kicad_parts_manager.search.service import search, SearchQuery
from kicad_parts_manager.kicad.export import passive_spice
from test_core import db


@pytest.fixture
def fake_ngspice(monkeypatch):
    monkeypatch.setattr(
        "kicad_parts_manager.validation.runner.shutil.which", lambda _: "ngspice"
    )

    def run(args, **kwargs):
        if "--version" in args:
            return SimpleNamespace(returncode=0, stdout="ngspice-test", stderr="")
        is_dc = "dc_current" in args[-1]
        return SimpleNamespace(
            returncode=0,
            stdout="Index v-sweep check_current\n0 1.0e-1 1.0e-3\n1 1.0e+0 1.0e-2\n"
            if is_dc
            else "v(a) = 0.65",
            stderr="",
        )

    monkeypatch.setattr("kicad_parts_manager.validation.runner.subprocess.run", run)
    return run


def test_persist_review_and_export(db, tmp_path, fake_ngspice):
    run = validate(db, "SIM-000001", tmp_path)
    assert run.result == "PASS"
    assert len(list(db.scalars(select(ValidationResult)))) == 2
    assert db.get(SimulationModel, "SIM-000001").status == Status.TESTED
    assert search(
        db, SearchQuery(simulation_status=Status.TESTED, tested_test="dc_current")
    )
    assert not search(db, SearchQuery(tested_test="switching"))
    approve(
        db,
        "SIM-000001",
        "human",
        "Pins and DC reviewed",
        pins_confirmed=True,
        plausible=True,
    )
    row = (
        db.execute(text('SELECT * FROM kicad_diode WHERE id="CMP-00000004"'))
        .mappings()
        .one()
    )
    assert row["Sim.Pins"] == "2=1 1=2"
    assert row["Sim.Name"] == "REFD"
    assert db.scalar(select(Review.reviewer)) == "human"
    # Rerunning invalidates approval, including a successful rerun.
    validate(db, "SIM-000001", tmp_path)
    assert db.get(SimulationModel, "SIM-000001").status == Status.TESTED
    assert (
        db.execute(
            text('SELECT "Sim.Library" FROM kicad_diode WHERE id="CMP-00000004"')
        ).scalar()
        is None
    )


@pytest.mark.parametrize("mode", ["error", "timeout", "no_current", "nonzero"])
def test_failures_persist(db, tmp_path, fake_ngspice, monkeypatch, mode):
    def run(args, **kwargs):
        if "--version" in args:
            return SimpleNamespace(returncode=0, stdout="ngspice-test", stderr="")
        if mode == "timeout":
            raise subprocess.TimeoutExpired(args, 30)
        return SimpleNamespace(
            returncode=1 if mode == "nonzero" else 0,
            stdout="Error: unknown model" if mode == "error" else "no data",
            stderr="",
        )

    monkeypatch.setattr("kicad_parts_manager.validation.runner.subprocess.run", run)
    result = validate(db, "SIM-000001", tmp_path)
    assert result.result == "FAIL"
    assert db.get(SimulationModel, "SIM-000001").status != Status.VERIFIED
    assert list(tmp_path.rglob("*.log"))
    with pytest.raises(ValueError):
        approve(
            db, "SIM-000001", "human", "reason", pins_confirmed=True, plausible=True
        )


def test_hash_guard(db, tmp_path, fake_ngspice):
    model = db.get(SimulationModel, "SIM-000001")
    file = tmp_path / "changed.lib"
    file.write_text(".model other D")
    model.model_file = str(file)
    with pytest.raises(ValueError, match="hash"):
        validate(db, model.id, tmp_path)


def test_review_requires_all_checks(db, tmp_path, fake_ngspice):
    validate(db, "SIM-000001", tmp_path)
    with pytest.raises(ValueError):
        approve(
            db, "SIM-000001", "human", "reason", pins_confirmed=False, plausible=True
        )
    source = db.get(Source, 1)
    source.license_info = ""
    with pytest.raises(ValueError):
        approve(
            db, "SIM-000001", "human", "reason", pins_confirmed=True, plausible=True
        )


def test_passive_export(db):
    assert passive_spice(db, "CMP-00000001") == "RCMP_00000001 1 0 1000"
    assert passive_spice(db, "CMP-00000002").endswith("1e-06")
    assert passive_spice(db, "CMP-00000003").endswith("0.001")
    assert db.execute(
        text('SELECT "Sim.Params" FROM kicad_passive')
    ).scalars().all() == ["r=1000.0", "c=1.0e-06", "l=0.001"]
    # Windows SQLite ODBC strips prefixes before dots from column metadata.
    assert db.execute(
        text('SELECT sim_params, sim_device, sim_type, sim_pins FROM kicad_passive')
    ).all() == [
        ("r=1000.0", "R", "R", "1=1 2=2"),
        ("c=1.0e-06", "C", "C", "1=1 2=2"),
        ("l=0.001", "L", "L", "1=1 2=2"),
    ]


def test_netlist_topology(db):
    for model in db.scalars(select(SimulationModel)):
        net = deck(model)
        assert '.include "' in net and "dc V1" in net
        assert model.model_name in net


def test_explicit_executable_override(monkeypatch):
    from kicad_parts_manager.validation.runner import find_ngspice

    monkeypatch.setenv("KICAD_PARTS_MANAGER_NGSPICE", "environment.exe")
    monkeypatch.setattr("kicad_parts_manager.validation.runner.shutil.which", lambda name: name)
    assert find_ngspice() == "environment.exe"
    assert find_ngspice("explicit.exe") == "explicit.exe"


def test_missing_explicit_executable_does_not_fallback(monkeypatch):
    from kicad_parts_manager.validation.runner import find_ngspice

    monkeypatch.setattr("kicad_parts_manager.validation.runner.shutil.which", lambda _: None)
    assert find_ngspice("missing.exe") is None


def test_obsolete_suite_cannot_be_approved(db, tmp_path, fake_ngspice):
    run = validate(db, "SIM-000001", tmp_path)
    run.test_suite_version = "1.0"
    db.flush()
    with pytest.raises(ValueError, match="Current successful validation"):
        approve(
            db, "SIM-000001", "human", "reason", pins_confirmed=True, plausible=True
        )
