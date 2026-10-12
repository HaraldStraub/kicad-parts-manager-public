from alembic import context
from kicad_parts_manager.database.session import engine
from kicad_parts_manager.database.models import Base

config = context.config
from pathlib import Path
from kicad_parts_manager.compatibility import main_database
if config.get_main_option("sqlalchemy.url") == "sqlite:///db/kicad-parts-manager.sqlite":
    config.set_main_option("sqlalchemy.url", "sqlite:///" + str(main_database(Path.cwd())))
if context.is_offline_mode():
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=Base.metadata,
        literal_binds=True,
    )
    with context.begin_transaction():
        context.run_migrations()
else:
    with engine(config.get_main_option("sqlalchemy.url")).connect() as conn:
        context.configure(connection=conn, target_metadata=Base.metadata)
        with context.begin_transaction():
            context.run_migrations()
