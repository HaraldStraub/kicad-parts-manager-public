from sqlalchemy import create_engine, event, Engine
from sqlalchemy.dialects.sqlite import insert
from sqlalchemy.orm import Session
from .models import Sequence


def engine(url: str | None = None) -> "Engine":
    if url is None:
        from pathlib import Path
        from kicad_parts_manager.compatibility import main_database
        url = "sqlite:///" + str(main_database(Path.cwd()))
    e = create_engine(url)

    @event.listens_for(e, "connect")
    def configure(conn, record):
        conn.execute("PRAGMA foreign_keys=ON")
        conn.execute("PRAGMA busy_timeout=5000")

    return e


def allocate_id(session: Session, kind: str) -> str:
    if kind not in {"CMP", "SIM"}:
        raise ValueError("Invalid ID kind")
    value = session.execute(
        insert(Sequence)
        .values(name=kind, value=1)
        .on_conflict_do_update(
            index_elements=[Sequence.name], set_={"value": Sequence.value + 1}
        )
        .returning(Sequence.value)
    ).scalar_one()
    return f"{kind}-{value:08d}" if kind == "CMP" else f"{kind}-{value:06d}"
