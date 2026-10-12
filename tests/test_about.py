import subprocess
from types import SimpleNamespace

from kicad_parts_manager import about
from kicad_parts_manager.database.session import engine
from kicad_parts_manager.manual_data import ManualData


def test_program_version_handles_missing_failed_and_timeout_without_running_shell(
    monkeypatch,
):
    assert about.program_version("KiCad", None)["available"] is False
    calls = []

    def execute(command, **options):
        calls.append((command, options))
        return SimpleNamespace(
            returncode=0,
            stdout="** ngspice-47 : Circuit level simulation program\n",
            stderr="",
        )

    monkeypatch.setattr(about.subprocess, "run", execute)
    assert (
        about.program_version("ngspice", "C:/Spice/bin/ngspice_con.exe")["version"]
        == "47"
    )
    assert (
        calls[0][0] == ["C:/Spice/bin/ngspice_con.exe", "--version"]
        and "shell" not in calls[0][1]
    )
    monkeypatch.setattr(
        about.subprocess,
        "run",
        lambda *a, **kw: SimpleNamespace(
            returncode=0, stdout="10.0.6-release\n", stderr=""
        ),
    )
    assert about.program_version("KiCad", "kicad-cli")["version"] == "10.0.6-release"

    def timeout(*a, **kw):
        raise subprocess.TimeoutExpired(a[0], kw["timeout"])

    monkeypatch.setattr(about.subprocess, "run", timeout)
    assert about.program_version("KiCad", "kicad-cli")["version"] is None


def test_about_summarizes_actual_local_data_without_writes(tmp_path, monkeypatch):
    monkeypatch.setattr(about, "find_kicad_cli", lambda: None)
    monkeypatch.setattr(about, "find_ngspice", lambda: None)
    monkeypatch.setattr(
        about,
        "ManufacturerParameters",
        lambda: SimpleNamespace(
            data={"version": "test-pack"}, records={"one": {"values": {"rating": 100}}}
        ),
    )
    store = ManualData(tmp_path / "manual.sqlite")
    row = {
        "id": "SYM-1",
        "symbol": "Diode:1N914",
        "category": "semiconductor/diode",
        "kind": "library",
        "values": {},
    }
    store.save(
        row,
        {
            "revision": 0,
            "values": {
                "vrrm": {
                    "value": 100,
                    "source": "Manufacturer PDF",
                    "source_details": {"candidate_id": "test"},
                }
            },
        },
    )
    before = store.path.read_bytes()
    database = engine("sqlite://")
    data = about.about_data(
        database,
        {
            "scanned_at": "2026-10-05T06:00:00Z",
            "counts": {"symbols": 12, "footprints": 20},
        },
        store,
    )
    assert (
        data["local_data"]["components"] == 1 and data["local_data"]["parameters"] == 1
    )
    assert (
        data["local_data"]["manufacturer_parameters"] == 1
        and data["local_data"]["updated_at"]
    )
    assert data["manufacturer_pack"] == {
        "version": "test-pack",
        "records": 1,
        "parameters": 1,
    }
    assert data["inventory"]["counts"] == {"symbols": 12, "footprints": 20}
    assert store.path.read_bytes() == before
    assert data["kicad"]["available"] is False
    database.dispose()
