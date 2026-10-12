from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    Enum,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from enum import StrEnum


class Status(StrEnum):
    DISCOVERED = "DISCOVERED"
    IMPORTED = "IMPORTED"
    UNVERIFIED = "UNVERIFIED"
    TESTED = "TESTED"
    REVIEWED = "REVIEWED"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    INCOMPATIBLE = "INCOMPATIBLE"
    DEPRECATED = "DEPRECATED"


class Compatibility(StrEnum):
    NATIVE_NGSPICE = "NATIVE_NGSPICE"
    PSPICE = "PSPICE"
    LTSPICE = "LTSPICE"
    CONVERTED_PSPICE = "CONVERTED_PSPICE"
    CONVERTED_LTSPICE = "CONVERTED_LTSPICE"
    UNKNOWN = "UNKNOWN"


class ModelClass(StrEnum):
    SIMPLE = "SIMPLE"
    DC = "DC"
    TRANSIENT = "TRANSIENT"
    SWITCHING = "SWITCHING"
    ELECTROTHERMAL = "ELECTROTHERMAL"


def now():
    return datetime.now(timezone.utc).isoformat()


class Base(DeclarativeBase):
    pass


class Sequence(Base):
    __tablename__ = "id_sequences"
    name: Mapped[str] = mapped_column(primary_key=True)
    value: Mapped[int] = mapped_column(default=0)


class Manufacturer(Base):
    __tablename__ = "manufacturers"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)


class Category(Base):
    __tablename__ = "categories"
    id: Mapped[int] = mapped_column(primary_key=True)
    path: Mapped[str] = mapped_column(unique=True)
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"))


class Component(Base):
    __tablename__ = "components"
    __table_args__ = (UniqueConstraint("manufacturer_id", "mpn"),)
    id: Mapped[str] = mapped_column(primary_key=True)
    manufacturer_id: Mapped[int | None] = mapped_column(ForeignKey("manufacturers.id"))
    mpn: Mapped[str]
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    description: Mapped[str] = mapped_column(default="")
    generic: Mapped[bool] = mapped_column(default=False)
    lifecycle: Mapped[str] = mapped_column(default="UNKNOWN")
    quality_status: Mapped[Status] = mapped_column(
        Enum(Status), default=Status.DISCOVERED
    )
    created_at: Mapped[str] = mapped_column(default=now)
    updated_at: Mapped[str] = mapped_column(default=now, onupdate=now)


class Source(Base):
    __tablename__ = "sources"
    id: Mapped[int] = mapped_column(primary_key=True)
    manufacturer_id: Mapped[int | None] = mapped_column(ForeignKey("manufacturers.id"))
    kind: Mapped[str]
    url: Mapped[str]
    version: Mapped[str | None]
    download_date: Mapped[str | None]
    license_info: Mapped[str]
    sha256: Mapped[str | None]


class Document(Base):
    __tablename__ = "documents"
    id: Mapped[int] = mapped_column(primary_key=True)
    component_id: Mapped[str] = mapped_column(ForeignKey("components.id"))
    source_id: Mapped[int] = mapped_column(ForeignKey("sources.id"))
    kind: Mapped[str]
    file_path: Mapped[str | None]
    sha256: Mapped[str | None]


class ParameterDefinition(Base):
    __tablename__ = "parameter_definitions"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(unique=True)
    si_unit: Mapped[str]


class Parameter(Base):
    __tablename__ = "parameters"
    id: Mapped[int] = mapped_column(primary_key=True)
    component_id: Mapped[str] = mapped_column(ForeignKey("components.id"))
    definition_id: Mapped[int] = mapped_column(ForeignKey("parameter_definitions.id"))
    value_si: Mapped[float]
    display_value: Mapped[str | None]
    display_unit: Mapped[str | None]
    source: Mapped[str | None]
    conditions: Mapped[dict] = mapped_column(JSON, default=dict)


class EdaMapping(Base):
    __tablename__ = "eda_mapping"
    component_id: Mapped[str] = mapped_column(
        ForeignKey("components.id"), primary_key=True
    )
    kicad_symbol: Mapped[str]
    kicad_footprint: Mapped[str | None]
    kicad_3d_model: Mapped[str | None]
    symbol_source: Mapped[str] = mapped_column(default="KiCad standard")
    footprint_source: Mapped[str | None]
    model3d_source: Mapped[str | None]


class SimulationModel(Base):
    __tablename__ = "simulation_models"
    id: Mapped[str] = mapped_column(primary_key=True)
    component_id: Mapped[str] = mapped_column(ForeignKey("components.id"))
    simulator: Mapped[str] = mapped_column(default="ngspice")
    model_format: Mapped[str] = mapped_column(default="SPICE")
    model_type: Mapped[str]
    model_name: Mapped[str]
    source_id: Mapped[int] = mapped_column(ForeignKey("sources.id"))
    source_url: Mapped[str]
    manufacturer_model: Mapped[bool] = mapped_column(default=False)
    model_file: Mapped[str]
    sha256: Mapped[str]
    model_class: Mapped[ModelClass] = mapped_column(
        Enum(ModelClass), default=ModelClass.DC
    )
    compatibility: Mapped[Compatibility] = mapped_column(
        Enum(Compatibility), default=Compatibility.NATIVE_NGSPICE
    )
    status: Mapped[Status] = mapped_column(Enum(Status), default=Status.IMPORTED)
    created_at: Mapped[str] = mapped_column(default=now)
    tested_at: Mapped[str | None]


class PreferredModel(Base):
    __tablename__ = "preferred_models"
    component_id: Mapped[str] = mapped_column(
        ForeignKey("components.id"), primary_key=True
    )
    purpose: Mapped[str] = mapped_column(primary_key=True)
    simulation_model_id: Mapped[str] = mapped_column(ForeignKey("simulation_models.id"))


class PinMap(Base):
    __tablename__ = "simulation_pin_map"
    simulation_model_id: Mapped[str] = mapped_column(
        ForeignKey("simulation_models.id"), primary_key=True
    )
    symbol_pin: Mapped[str] = mapped_column(primary_key=True)
    symbol_pin_name: Mapped[str]
    model_pin: Mapped[int]
    model_pin_name: Mapped[str]
    verified: Mapped[bool] = mapped_column(default=False)
    __table_args__ = (UniqueConstraint("simulation_model_id", "model_pin"),)


class ValidationRun(Base):
    __tablename__ = "validation_runs"
    id: Mapped[int] = mapped_column(primary_key=True)
    simulation_model_id: Mapped[str] = mapped_column(ForeignKey("simulation_models.id"))
    ngspice_version: Mapped[str]
    timestamp: Mapped[str] = mapped_column(default=now)
    platform: Mapped[str]
    test_suite_version: Mapped[str]
    result: Mapped[str]
    log_file: Mapped[str]
    model_sha256: Mapped[str]


class ValidationResult(Base):
    __tablename__ = "validation_results"
    id: Mapped[int] = mapped_column(primary_key=True)
    validation_run_id: Mapped[int] = mapped_column(ForeignKey("validation_runs.id"))
    test_name: Mapped[str]
    status: Mapped[str]
    measured_value: Mapped[float | None]
    expected_min: Mapped[float | None]
    expected_max: Mapped[float | None]
    deviation: Mapped[float | None]
    log: Mapped[str] = mapped_column(Text)


class Review(Base):
    __tablename__ = "model_reviews"
    id: Mapped[int] = mapped_column(primary_key=True)
    simulation_model_id: Mapped[str] = mapped_column(ForeignKey("simulation_models.id"))
    reviewer: Mapped[str]
    reason: Mapped[str]
    timestamp: Mapped[str] = mapped_column(default=now)


class SpecMosfet(Base):
    __tablename__ = "spec_mosfet"
    component_id: Mapped[str] = mapped_column(
        ForeignKey("components.id"), primary_key=True
    )
    channel: Mapped[str]
    vds_max: Mapped[float | None] = mapped_column(Float)
    vgs_max: Mapped[float | None] = mapped_column(Float)
    id_cont: Mapped[float | None] = mapped_column(Float)
    id_pulse: Mapped[float | None] = mapped_column(Float)
    rds_on: Mapped[float | None] = mapped_column(Float)
    rds_on_vgs: Mapped[float | None] = mapped_column(Float)
    rds_on_temp: Mapped[float | None] = mapped_column(Float)
    vgs_th_min: Mapped[float | None] = mapped_column(Float)
    vgs_th_typ: Mapped[float | None] = mapped_column(Float)
    vgs_th_max: Mapped[float | None] = mapped_column(Float)
    qg: Mapped[float | None] = mapped_column(Float)
    qgd: Mapped[float | None] = mapped_column(Float)
    ciss: Mapped[float | None] = mapped_column(Float)
    coss: Mapped[float | None] = mapped_column(Float)
    crss: Mapped[float | None] = mapped_column(Float)
    pd_max: Mapped[float | None] = mapped_column(Float)
    tj_max: Mapped[float | None] = mapped_column(Float)
    aec_q101: Mapped[bool | None] = mapped_column(Boolean)


class SpecDiode(Base):
    __tablename__ = "spec_diode"
    component_id: Mapped[str] = mapped_column(
        ForeignKey("components.id"), primary_key=True
    )
    diode_type: Mapped[str]
    vr_max: Mapped[float | None] = mapped_column(Float)
    if_avg: Mapped[float | None] = mapped_column(Float)
    if_peak: Mapped[float | None] = mapped_column(Float)
    vf_typ: Mapped[float | None] = mapped_column(Float)
    vf_test_current: Mapped[float | None] = mapped_column(Float)
    trr: Mapped[float | None] = mapped_column(Float)
    cj: Mapped[float | None] = mapped_column(Float)
    pd_max: Mapped[float | None] = mapped_column(Float)
    tj_max: Mapped[float | None] = mapped_column(Float)
    aec_q101: Mapped[bool | None] = mapped_column(Boolean)
