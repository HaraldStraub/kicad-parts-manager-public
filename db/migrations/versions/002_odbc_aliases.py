"""Expose simulation columns without dots for SQLite ODBC metadata."""

from pathlib import Path
from alembic import op

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def replace_views(filename):
    for name in ("diode", "mosfet", "bjt", "passive"):
        op.execute(f"DROP VIEW IF EXISTS kicad_{name}")
    sql = (Path(__file__).parents[1] / filename).read_text(encoding="utf-8")
    for statement in sql.split(";"):
        if statement.strip():
            op.execute(statement)


def upgrade():
    replace_views("views_002.sql")


def downgrade():
    replace_views("views_001.sql")
