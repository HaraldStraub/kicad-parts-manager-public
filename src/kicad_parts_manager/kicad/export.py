from sqlalchemy import select
from kicad_parts_manager.database.models import (
    Component,
    Category,
    Parameter,
    ParameterDefinition,
)


def passive_spice(
    session, component_id: str, node1: str = "1", node2: str = "0"
) -> str:
    """Export a generic intrinsic R/C/L instance in SI."""
    import re

    if not all(re.fullmatch(r"[A-Za-z0-9_]+", n) for n in (node1, node2)):
        raise ValueError("Invalid node")
    row = session.execute(
        select(Component, Category.path, Parameter.value_si)
        .join(Category)
        .join(Parameter, Parameter.component_id == Component.id)
        .join(ParameterDefinition, ParameterDefinition.id == Parameter.definition_id)
        .where(
            Component.id == component_id,
            Component.generic.is_(True),
            ParameterDefinition.name.in_(["resistance", "capacitance", "inductance"]),
        )
    ).one()
    component, path, value = row
    prefix = {
        "passive/resistor": "R",
        "passive/capacitor": "C",
        "passive/inductor": "L",
    }[path]
    return f"{prefix}{component.id.replace('-', '_')} {node1} {node2} {value:g}"
