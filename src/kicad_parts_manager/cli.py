import argparse, json
from pathlib import Path
from alembic import command
from alembic.config import Config
from sqlalchemy.orm import Session
from kicad_parts_manager.compatibility import main_database
from kicad_parts_manager.database.session import engine
from kicad_parts_manager.importers.seed import seed
from kicad_parts_manager.search.service import SearchQuery, search
from kicad_parts_manager.validation.runner import validate
from kicad_parts_manager.validation.review import approve


def main() -> None:
    parser = argparse.ArgumentParser(
        description="kicad-parts-manager; run from repository root"
    )
    parser.add_argument("--db", default=str(main_database(Path.cwd())))
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("init")
    sub.add_parser("seed")
    p = sub.add_parser("export-passive")
    p.add_argument("component_id")
    s = sub.add_parser("search")
    s.add_argument("--query", default="{}", help="JSON SearchQuery, all quantities SI")
    v = sub.add_parser("validate")
    v.add_argument("model_id")
    v.add_argument("--ngspice", default="ngspice")
    a = sub.add_parser("approve")
    a.add_argument("model_id")
    a.add_argument("--reviewer", required=True)
    a.add_argument("--reason", required=True)
    a.add_argument("--pins-confirmed", action="store_true")
    a.add_argument("--plausible", action="store_true")
    args = parser.parse_args()
    url = "sqlite:///" + args.db
    if args.command == "init":
        Path(args.db).parent.mkdir(parents=True, exist_ok=True)
        config = Config("alembic.ini")
        config.set_main_option("sqlalchemy.url", url)
        command.upgrade(config, "head")
        return
    with Session(engine(url)) as session:
        if args.command == "seed":
            seed(session, Path.cwd())
        elif args.command == "export-passive":
            from kicad_parts_manager.kicad.export import passive_spice

            print(passive_spice(session, args.component_id))
        elif args.command == "search":
            rows = search(session, SearchQuery.model_validate_json(args.query))
            print(
                json.dumps(
                    [
                        {"id": c.id, "mpn": c.mpn, "description": c.description}
                        for c in rows
                    ],
                    indent=2,
                )
            )
        elif args.command == "validate":
            run = validate(session, args.model_id, Path("test_results"), args.ngspice)
            print(f"{run.id}: {run.result}")
            if run.result != "PASS":
                raise SystemExit(1)
        else:
            approve(
                session,
                args.model_id,
                args.reviewer,
                args.reason,
                pins_confirmed=args.pins_confirmed,
                plausible=args.plausible,
            )


if __name__ == "__main__":
    main()
