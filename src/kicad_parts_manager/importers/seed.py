from pathlib import Path
from hashlib import sha256
from sqlalchemy import select
from sqlalchemy.orm import Session
from kicad_parts_manager.database.models import *
from kicad_parts_manager.database.session import allocate_id


def seed(session: Session, root: Path) -> None:
    if session.scalar(select(Component.id).limit(1)):
        return
    maker = Manufacturer(name="Reference fixtures (not manufacturer data)")
    session.add(maker)
    session.flush()
    source = Source(
        kind="self-authored reference",
        url="urn:kicad_parts_manager:reference:v1",
        license_info="CC0-1.0; self-authored illustrative models",
        version="1",
    )
    session.add(source)
    session.flush()
    rows = [
        ("Generic:R", "passive/resistor", "Device:R", "R", None),
        ("Generic:C", "passive/capacitor", "Device:C", "C", None),
        ("Generic:L", "passive/inductor", "Device:L", "L", None),
        (
            "REF-DIODE",
            "semiconductor/diode/standard",
            "Device:D",
            "D",
            "diode/reference.lib",
        ),
        (
            "REF-SCHOTTKY",
            "semiconductor/diode/schottky",
            "Device:D_Schottky",
            "D",
            "diode/schottky.lib",
        ),
        (
            "REF-ZENER",
            "semiconductor/diode/zener",
            "Device:D_Zener",
            "D",
            "diode/zener.lib",
        ),
        (
            "REF-NMOS",
            "semiconductor/transistor/mosfet/n_channel",
            "Transistor_FET:Q_NMOS_GDS",
            "M",
            "mosfet/reference.lib",
        ),
        (
            "REF-NPN",
            "semiconductor/transistor/bjt/npn",
            "Transistor_BJT:Q_NPN_BCE",
            "Q",
            "bjt/reference.lib",
        ),
    ]
    cats = {}
    for mpn, path, symbol, typ, file in rows:
        parent = None
        for i in range(1, len(path.split("/")) + 1):
            sub = "/".join(path.split("/")[:i])
            if sub not in cats:
                cat = Category(path=sub, parent_id=parent)
                session.add(cat)
                session.flush()
                cats[sub] = cat.id
            parent = cats[sub]
        cid = allocate_id(session, "CMP")
        session.add(
            Component(
                id=cid,
                manufacturer_id=maker.id,
                mpn=mpn,
                category_id=cats[path],
                generic=file is None,
                description="Illustrative reference; not for production selection",
                quality_status=Status.IMPORTED,
            )
        )
        session.flush()
        session.add(EdaMapping(component_id=cid, kicad_symbol=symbol))
        if typ == "M":
            session.add(
                SpecMosfet(
                    component_id=cid,
                    channel="N",
                    vds_max=100,
                    rds_on=0.004,
                    id_cont=20,
                    aec_q101=False,
                )
            )
        if typ == "D":
            session.add(
                SpecDiode(
                    component_id=cid,
                    diode_type=path.split("/")[-1],
                    vr_max=50,
                    if_avg=1,
                    aec_q101=False,
                )
            )
        if file:
            mid = allocate_id(session, "SIM")
            model_path = root / "models" / file
            session.add(
                SimulationModel(
                    id=mid,
                    component_id=cid,
                    model_type=typ,
                    model_name={"D": "REFD", "M": "REFNMOS", "Q": "REFNPN"}[typ],
                    source_id=source.id,
                    source_url=source.url,
                    model_file=str(model_path.resolve()),
                    sha256=sha256(model_path.read_bytes()).hexdigest(),
                )
            )
            session.flush()
            session.add(
                PreferredModel(component_id=cid, purpose="dc", simulation_model_id=mid)
            )
            pins = {
                "D": [(1, "K", 2, "K"), (2, "A", 1, "A")],
                "M": [(1, "G", 2, "G"), (2, "D", 1, "D"), (3, "S", 3, "S")],
                "Q": [(1, "B", 2, "B"), (2, "C", 1, "C"), (3, "E", 3, "E")],
            }[typ]
            for pin, name, modelpin, modelname in pins:
                session.add(
                    PinMap(
                        simulation_model_id=mid,
                        symbol_pin=str(pin),
                        symbol_pin_name=name,
                        model_pin=modelpin,
                        model_pin_name=modelname,
                    )
                )
        else:
            definition = ParameterDefinition(
                name={"R": "resistance", "C": "capacitance", "L": "inductance"}[typ],
                si_unit={"R": "ohm", "C": "F", "L": "H"}[typ],
            )
            session.add(definition)
            session.flush()
            session.add(
                Parameter(
                    component_id=cid,
                    definition_id=definition.id,
                    value_si={"R": 1000, "C": 1e-6, "L": 1e-3}[typ],
                    conditions={},
                )
            )
    session.commit()
