from pydantic import BaseModel, Field, model_validator
from sqlalchemy import select, exists
from sqlalchemy.orm import Session
from kicad_parts_manager.database.models import *


class Bounds(BaseModel):
    min: float | None = None
    max: float | None = None

    @model_validator(mode="after")
    def ordered(self):
        if self.min is not None and self.max is not None and self.min > self.max:
            raise ValueError("min exceeds max")
        return self


class SearchQuery(BaseModel):
    category: str | None = None
    manufacturer: str | None = None
    mpn: str | None = None
    numeric: dict[str, Bounds] = Field(default_factory=dict)
    boolean: dict[str, bool] = Field(default_factory=dict)
    simulation_status: Status | None = None
    simulator: str = "ngspice"
    tested_test: str | None = None


def search(session: Session, query: SearchQuery) -> list[Component]:
    stmt = (
        select(Component)
        .join(Category)
        .outerjoin(Manufacturer)
        .outerjoin(SpecMosfet)
        .outerjoin(SpecDiode)
    )
    if query.category:
        stmt = stmt.where(
            (Category.path == query.category)
            | Category.path.startswith(query.category + "/")
        )
    if query.manufacturer:
        stmt = stmt.where(Manufacturer.name == query.manufacturer)
    if query.mpn:
        stmt = stmt.where(Component.mpn.contains(query.mpn, autoescape=True))
    columns = {
        c.name: getattr(t, c.name)
        for t in (SpecMosfet, SpecDiode)
        for c in t.__table__.columns
        if c.name != "component_id"
    }
    for name, bounds in query.numeric.items():
        if name in columns and isinstance(
            columns[name].property.columns[0].type, Float
        ):
            col = columns[name]
            if bounds.min is not None:
                stmt = stmt.where(col >= bounds.min)
            if bounds.max is not None:
                stmt = stmt.where(col <= bounds.max)
        else:
            condition = [
                Parameter.component_id == Component.id,
                Parameter.definition_id == ParameterDefinition.id,
                ParameterDefinition.name == name,
            ]
            if bounds.min is not None:
                condition.append(Parameter.value_si >= bounds.min)
            if bounds.max is not None:
                condition.append(Parameter.value_si <= bounds.max)
            stmt = stmt.where(exists().where(*condition))
    for name, value in query.boolean.items():
        if name != "aec_q101":
            raise ValueError(f"Unsupported boolean: {name}")
        stmt = stmt.where(
            (SpecMosfet.aec_q101 == value) | (SpecDiode.aec_q101 == value)
        )
    if query.simulation_status or query.tested_test:
        conditions = [
            SimulationModel.component_id == Component.id,
            SimulationModel.simulator == query.simulator,
        ]
        if query.simulation_status:
            conditions.append(SimulationModel.status == query.simulation_status)
        if query.tested_test:
            latest = (
                select(ValidationRun.id)
                .where(ValidationRun.simulation_model_id == SimulationModel.id)
                .order_by(ValidationRun.id.desc())
                .limit(1)
                .correlate(SimulationModel)
                .scalar_subquery()
            )
            conditions.append(
                exists().where(
                    ValidationResult.validation_run_id == latest,
                    ValidationResult.test_name == query.tested_test,
                    ValidationResult.status == "PASS",
                )
            )
        stmt = stmt.where(exists().where(*conditions))
    return list(session.scalars(stmt.order_by(Component.id)))
