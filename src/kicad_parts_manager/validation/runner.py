from pathlib import Path
import hashlib, os, platform, re, shutil, subprocess
from sqlalchemy import select
from sqlalchemy.orm import Session
from kicad_parts_manager.database.models import *

SUITE_VERSION = "1.1"
MOSFET_BACKLOG = (
    "operating_point",
    "output_characteristic",
    "transfer_characteristic",
    "body_diode",
    "transient",
    "switching",
    "temperature",
    "avalanche",
)


def find_ngspice(executable: str = "ngspice") -> str | None:
    """Prefer the console executable on Windows; allow an explicit override."""
    requested = (
        os.environ.get("KICAD_PARTS_MANAGER_NGSPICE") if executable == "ngspice" else executable
    )
    if requested:
        return shutil.which(requested)
    console = shutil.which("ngspice_con")
    if console:
        return console
    portable = (
        Path(__file__).resolve().parents[3] / "tools/vendor/Spice64/bin/ngspice_con.exe"
    )
    if os.name == "nt" and portable.is_file():
        return str(portable)
    return shutil.which(executable)


def deck(model: SimulationModel, dc: bool = True) -> str:
    path = model.model_file
    if any(c in path for c in ('"', "\n", "\r")):
        raise ValueError("Unsafe model path")
    if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", model.model_name):
        raise ValueError("Unsafe model name")
    devices = {
        "D": f"V1 a 0 0.65\nD1 a 0 {model.model_name}",
        "M": f"V1 d 0 1\nVg g 0 5\nM1 d g 0 0 {model.model_name} W=10u L=1u",
        "Q": f"V1 c 0 2\nVb b 0 0.7\nQ1 c b 0 {model.model_name}",
    }
    if model.model_type not in devices:
        raise ValueError("Unsupported reference topology")
    return (
        f'Reference validation\n.include "{path}"\n{devices[model.model_type]}\n.control\n'
        + (
            f"dc V1 0.1 {0.7 if model.model_type == 'D' else 1} 0.1\nlet check_current = -i(V1)\nprint check_current\n"
            if dc
            else "op\nprint v(a)\n"
            if model.model_type == "D"
            else "op\nprint v(d)\n"
            if model.model_type == "M"
            else "op\nprint v(c)\n"
        )
        + "quit\n.endc\n.end\n"
    )


def validate(
    session: "Session", model_id: str, output: Path, executable: str = "ngspice"
) -> ValidationRun:
    binary = find_ngspice(executable)
    if not binary:
        raise RuntimeError("ngspice not installed or not on PATH")
    model = session.get(SimulationModel, model_id)
    if not model:
        raise ValueError("Unknown model")
    if model.status in {Status.REJECTED, Status.INCOMPATIBLE, Status.DEPRECATED}:
        raise ValueError("Inactive model cannot be validated")
    if model.manufacturer_model:
        from kicad_parts_manager.validation.pilot import validate_pilot
        return validate_pilot(session, model_id, output, executable)
    if (
        model.simulator != "ngspice"
        or model.compatibility != Compatibility.NATIVE_NGSPICE
    ):
        raise ValueError("Only native ngspice in V1")
    actual = hashlib.sha256(Path(model.model_file).read_bytes()).hexdigest()
    if actual != model.sha256:
        raise ValueError("Model hash changed; reimport required")
    version = subprocess.run(
        [binary, "--version"], capture_output=True, text=True, timeout=10
    ).stdout.strip()
    run = ValidationRun(
        simulation_model_id=model_id,
        ngspice_version=version,
        platform=platform.platform(),
        test_suite_version=SUITE_VERSION,
        result="FAIL",
        log_file="",
        model_sha256=actual,
    )
    session.add(run)
    session.flush()
    folder = output / str(run.id)
    folder.mkdir(parents=True, exist_ok=True)
    run.log_file = str(folder.resolve())
    for name, is_dc in [("model_load", False), ("dc_current", True)]:
        net = folder / (name + ".cir")
        log = folder / (name + ".log")
        net.write_text(deck(model, is_dc))
        try:
            proc = subprocess.run(
                [binary, "-b", str(net.resolve())],
                capture_output=True,
                text=True,
                timeout=30,
            )
            message = proc.stdout + "\n" + proc.stderr
            okay = proc.returncode == 0 and not re.search(
                r"(?im)^\s*(error|fatal)|unknown subckt|could not find", message
            )
        except subprocess.TimeoutExpired:
            message = "ngspice timeout"
            okay = False
        if not is_dc:
            okay = okay and bool(re.search(r"v\([acd]\)\s*=\s*[-+0-9.eE]+", message))
        measured = None
        if is_dc:
            values = [
                float(x)
                for x in re.findall(
                    r"(?m)^\s*\d+\s+[-+0-9.eE]+\s+([-+0-9.eE]+)\s*$", message
                )
            ]
            measured = max(values) if values else None
            okay = okay and measured is not None and 1e-9 <= measured <= 100
        log.write_text(message, encoding="utf-8")
        session.add(
            ValidationResult(
                validation_run_id=run.id,
                test_name=name,
                status="PASS" if okay else "FAIL",
                measured_value=measured,
                expected_min=1e-9 if is_dc else None,
                expected_max=100 if is_dc else None,
                log=message,
            )
        )
    session.flush()
    results = list(
        session.scalars(
            select(ValidationResult).where(ValidationResult.validation_run_id == run.id)
        )
    )
    run.result = "PASS" if all(x.status == "PASS" for x in results) else "FAIL"
    model.status = Status.TESTED if run.result == "PASS" else Status.IMPORTED
    model.tested_at = now()
    session.commit()
    return run
