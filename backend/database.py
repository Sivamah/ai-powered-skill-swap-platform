import os
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import event
from sqlalchemy.engine import Engine

# In Vercel, the local filesystem is read-only except for /tmp.
# Also support DATABASE_URL for Vercel serverless Postgres.
database_url = os.getenv("DATABASE_URL")
if os.getenv("VERCEL"):
    sqlite_file_name = os.getenv("DATABASE_PATH", "/tmp/database.db")
else:
    sqlite_file_name = os.getenv("DATABASE_PATH", "database.db")

sqlite_url = f"sqlite:///{sqlite_file_name}"

# Use postgres if passed, otherwise fallback to sqlite
if database_url:
    engine = create_engine(database_url, echo=False)
else:
    connect_args = {"check_same_thread": False}
    engine = create_engine(
        sqlite_url,
        connect_args=connect_args,
        echo=False,  # Set to True only for SQL debugging
    )


@event.listens_for(Engine, "connect")
def _set_sqlite_pragma(dbapi_conn, _connection_record):
    """Enable WAL mode and foreign keys for every new SQLite connection."""
    try:
        if type(dbapi_conn).__name__ == "Connection":
            cursor = dbapi_conn.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.close()
    except Exception:
        pass


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
