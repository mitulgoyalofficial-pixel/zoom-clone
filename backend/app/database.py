# =============================================================================
# File: app/database.py
# Purpose: Sets up the connection between the app and the SQLite database.
# Contains:
#   - engine: the single connection point to the database file
#   - SessionLocal: factory that creates a new DB session (one unit of work)
#   - Base: parent class for every ORM model (models.py), so SQLAlchemy can
#           find all tables and create them with Base.metadata.create_all()
#   - get_db_session(): FastAPI dependency giving each request its own session
# =============================================================================

import os

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# Read from env so production can point elsewhere; default is a local file.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./zoom.db")

# check_same_thread=False: FastAPI runs sync endpoints in a thread pool; safe
# because every request gets its own session (see get_db_session).
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


# Purpose: Turn on foreign key enforcement in SQLite.
# Input:   dbapi_connection - the raw SQLite connection just opened
#          connection_record - SQLAlchemy bookkeeping object (unused)
# Output:  None
# How it works: SQLAlchemy calls this on every new connection ("connect"
#   event). SQLite ignores FOREIGN KEY and ON DELETE CASCADE unless
#   "PRAGMA foreign_keys=ON" is run per connection, so we run it here.
@event.listens_for(engine, "connect")
def enable_sqlite_foreign_keys(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


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
