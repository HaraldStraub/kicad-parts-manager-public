from pathlib import Path
from hashlib import sha256
from sqlalchemy import select
from sqlalchemy.orm import Session
from kicad_parts_manager.validation.runner import SUITE_VERSION
from kicad_parts_manager.database.models import *


def approve(
    session: Session,
    model_id: str,
    reviewer: str,
    reason: str,
    *,
    pins_confirmed: bool,
    plausible: bool,
) -> None:
    if (
        not reviewer.strip()
        or not reason.strip()
        or not pins_confirmed
        or not plausible
    ):
        raise ValueError(
            "Manual reviewer, reason, pin confirmation and plausibility required"
        )
    model = session.get(SimulationModel, model_id)
    if not model or model.status not in {Status.TESTED, Status.REVIEWED}:
        raise ValueError("Model must be TESTED or REVIEWED")
    source = session.get(Source, model.source_id)
    if not source or not source.url or not source.license_info.strip():
        raise ValueError("Documented source and license required")
    if (
        model.simulator != "ngspice"
        or model.compatibility != Compatibility.NATIVE_NGSPICE
    ):
        raise ValueError("V1 requires native ngspice")
    if sha256(Path(model.model_file).read_bytes()).hexdigest() != model.sha256:
        raise ValueError("Model changed")
    run = session.scalar(
        select(ValidationRun)
        .where(ValidationRun.simulation_model_id == model_id)
        .order_by(ValidationRun.id.desc())
    )
    if (
        not run
        or run.result != "PASS"
        or run.model_sha256 != model.sha256
        or run.test_suite_version != SUITE_VERSION
    ):
        raise ValueError("Current successful validation required")
    results = {
        x.test_name: x.status
        for x in session.scalars(
            select(ValidationResult).where(ValidationResult.validation_run_id == run.id)
        )
    }
    if any(results.get(x) != "PASS" for x in ("model_load", "dc_current")):
        raise ValueError("Mandatory tests missing")
    pins = list(
        session.scalars(select(PinMap).where(PinMap.simulation_model_id == model_id))
    )
    expected = {"D": 2, "M": 3, "Q": 3}.get(model.model_type)
    if not expected or sorted(p.model_pin for p in pins) != list(
        range(1, expected + 1)
    ):
        raise ValueError("Incomplete pin map")
    for pin in pins:
        pin.verified = True
    session.add(Review(simulation_model_id=model_id, reviewer=reviewer, reason=reason))
    model.status = Status.VERIFIED
    session.commit()
