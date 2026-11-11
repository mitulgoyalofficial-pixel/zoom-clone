# =============================================================================
# File: app/database_connection.py
# Purpose: Sets up the connection between the app and the database.
#          Locally this is a SQLite file; when deployed on Vercel (serverless, where a local
#          file cannot be shared between requests) it is a Postgres database chosen by the
#          DATABASE_URL environment variable. The rest of the code does not care which.
# Contains:
#   - normalize_database_url(): makes a hosting provider's URL usable by SQLAlchemy
#   - create_database_engine(): builds the engine with settings suited to SQLite or Postgres
#   - engine: the single connection point to the database
#   - SessionLocal: factory that creates a new DB session (one unit of work)
#   - Base: parent class for every ORM model (database_models.py), so SQLAlchemy can
#           find all tables and create them with Base.metadata.create_all()
#   - get_db_session(): FastAPI dependency giving each request its own session
# =============================================================================

import os

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


# Purpose: Turn the URL a hosting provider gives us into one SQLAlchemy understands.
# Input:   raw_url - e.g. "postgres://user:pass@host/db?sslmode=require" (Neon, Heroku style),
#          "postgresql://..." or "sqlite:///./zoom.db"
# Output:  the same URL, with Postgres URLs naming the psycopg 3 driver we install
#          ("postgresql+psycopg://..."); anything else is returned unchanged.
# How it works: SQLAlchemy reads a plain "postgresql://" URL as the older psycopg2 driver,
#   which is not installed, so the driver is named explicitly.
def normalize_database_url(raw_url: str) -> str:
    for prefix in ("postgres://", "postgresql://"):
        if raw_url.startswith(prefix):
            return "postgresql+psycopg://" + raw_url[len(prefix):]
    return raw_url


# Purpose: Create the engine, with the right settings for the kind of database.
# Input:   database_url - already normalized
# Output:  a SQLAlchemy Engine
def create_database_engine(database_url: str) -> Engine:
    if database_url.startswith("sqlite"):
        # check_same_thread=False: FastAPI runs sync endpoints in a thread pool; safe
        # because every request gets its own session (see get_db_session).
        return create_engine(database_url, connect_args={"check_same_thread": False})

    return create_engine(
        database_url,
        # Checks a pooled connection is still alive before using it: serverless databases close idle ones.
        pool_pre_ping=True,
        # Every serverless instance has its own pool, so keep it small (many instances x pool size = many connections).
        pool_size=2,
        max_overflow=0,
        pool_recycle=300,
        # Neon's connection pooler (PgBouncer) does not support server-side prepared statements,
        # which psycopg 3 would otherwise start using after a few repeated queries.
        connect_args={"prepare_threshold": None},
    )


# Read from env so production can point at Postgres; the default is a local SQLite file.
DATABASE_URL = normalize_database_url(os.getenv("DATABASE_URL", "sqlite:///./zoom.db"))
IS_SQLITE = DATABASE_URL.startswith("sqlite")

engine = create_database_engine(DATABASE_URL)


# Purpose: Turn on foreign key enforcement in SQLite.
# Input:   dbapi_connection - the raw SQLite connection just opened
#          connection_record - SQLAlchemy bookkeeping object (unused)
# Output:  None
# How it works: SQLite ignores FOREIGN KEY and ON DELETE CASCADE unless
#   "PRAGMA foreign_keys=ON" is run per connection, so we run it here.
#   Postgres always enforces foreign keys, so this is registered for SQLite only.
def enable_sqlite_foreign_keys(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


if IS_SQLITE:
    event.listen(engine, "connect", enable_sqlite_foreign_keys)


# autoflush=False: SQL is only sent on explicit flush/commit, so the order of
# statements is predictable and easy to explain.
SessionLocal = sessionmaker(bind=engine, autoflush=False)


# Purpose: Parent class for all ORM models.
# How it works: every class that inherits from Base is registered in
#   Base.metadata, which is what create_all() uses to build the tables.
class Base(DeclarativeBase):
    pass


# Purpose: Provide one database session per HTTP request.
# Input:   none (FastAPI calls it via Depends(get_db_session))
# Output:  yields a Session object to the endpoint
# How it works: opens a session, hands it to the endpoint with `yield`,
#   and always closes it in `finally`, even if the endpoint raised an error.
def get_db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
