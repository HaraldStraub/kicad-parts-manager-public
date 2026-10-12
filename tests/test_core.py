from pathlib import Path
import pytest
from sqlalchemy import text, select
from sqlalchemy.orm import Session
from alembic.config import Config
from alembic import command
from kicad_parts_manager.database.session import engine, allocate_id
from kicad_parts_manager.database.models import *
from kicad_parts_manager.importers.seed import seed
from kicad_parts_manager.search.service import *
from kicad_parts_manager.validation.review import approve

ROOT = Path(__file__).parents[1]


@pytest.fixture
def db(tmp_path):
    path = tmp_path / "test.sqlite"
    cfg = Config(str(ROOT / "alembic.ini"))
    cfg.set_main_option("script_location", str(ROOT / "db/migrations"))
    cfg.set_main_option("sqlalchemy.url", "sqlite:///" + str(path))
    command.upgrade(cfg, "head")
    with Session(engine("sqlite:///" + str(path))) as s:
        seed(s, ROOT)
        yield s


def test_seed_idempotent(db):
    seed(db, ROOT)
    assert len(search(db, SearchQuery())) == 8
    assert len(list(db.scalars(select(SimulationModel)))) == 5


def test_si_search(db):
    rows = search(
        db,
        SearchQuery(
            category="semiconductor/transistor/mosfet",
            numeric={"vds_max": Bounds(min=80), "rds_on": Bounds(max=0.005)},
            boolean={"aec_q101": False},
        ),
    )
    assert [x.mpn for x in rows] == ["REF-NMOS"]
    assert search(db, SearchQuery(boolean={"aec_q101": True})) == []
    assert (
        search(db, SearchQuery(numeric={"resistance": Bounds(min=999, max=1001)}))[
            0
        ].mpn
        == "Generic:R"
    )


def test_ids(db):
    a = allocate_id(db, "CMP")
    b = allocate_id(db, "CMP")
    assert a != b
    db.commit()
    assert allocate_id(db, "CMP") != b


def test_fk(db):
    from sqlalchemy.exc import IntegrityError

    with pytest.raises(IntegrityError):
        db.add(EdaMapping(component_id="missing", kicad_symbol="Device:R"))
        db.flush()
    db.rollback()


def test_unverified_view(db):
    row = db.execute(text("SELECT * FROM kicad_mosfet")).mappings().one()
    assert row["simulation_model"] is None
    assert row["Sim.Library"] is None


def test_manual_gate(db):
    with pytest.raises(ValueError):
        approve(
            db, "SIM-000001", "reviewer", "reason", pins_confirmed=True, plausible=True
        )


def test_query_validation():
    with pytest.raises(ValueError):
        Bounds(min=2, max=1)


def test_native_passives(db):
    assert len(search(db, SearchQuery(category="passive"))) == 3
