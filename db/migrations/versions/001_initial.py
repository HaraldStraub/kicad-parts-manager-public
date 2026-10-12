import importlib.util
from pathlib import Path
from alembic import op

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def schema():
    spec = importlib.util.spec_from_file_location(
        "schema001", Path(__file__).parents[1] / "schema_001.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.Base.metadata


def upgrade():
    schema().create_all(op.get_bind())
    sql = (Path(__file__).parents[1] / "views_001.sql").read_text()
    for stmt in sql.split(";"):
        if stmt.strip():
            op.execute(stmt)


def downgrade():
    for name in ("diode", "mosfet", "bjt", "passive"):
        op.execute(f"DROP VIEW IF EXISTS kicad_{name}")
    schema().drop_all(op.get_bind())
