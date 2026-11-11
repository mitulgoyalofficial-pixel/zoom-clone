# =============================================================================
# File: tests/test_database_connection_and_health.py
# Purpose: Tests for the database switch (SQLite locally, Postgres when deployed) and the health
#          check. No Postgres server is needed: the schema is only COMPILED for the Postgres dialect,
#          which catches SQL that Postgres would not accept.
# Run (from backend/):  venv\Scripts\python -m pytest tests -v
# =============================================================================

import pytest
from sqlalchemy.dialects import postgresql
from sqlalchemy.schema import CreateIndex, CreateTable

from app.database_connection import Base, create_database_engine, normalize_database_url
from app.database_models import Meeting, Participant, User


# --- normalize_database_url --------------------------------------------------

@pytest.mark.parametrize(
    "raw_url, expected_url",
    [
        ("postgres://user:pass@host/db?sslmode=require", "postgresql+psycopg://user:pass@host/db?sslmode=require"),
        ("postgresql://user:pass@host/db", "postgresql+psycopg://user:pass@host/db"),
        ("postgresql+psycopg://user:pass@host/db", "postgresql+psycopg://user:pass@host/db"),
        ("sqlite:///./zoom.db", "sqlite:///./zoom.db"),
        ("sqlite://", "sqlite://"),
    ],
)
def test_database_urls_are_adapted_for_the_driver_we_install(raw_url, expected_url):
    assert normalize_database_url(raw_url) == expected_url


# --- create_database_engine --------------------------------------------------

def test_sqlite_engine_allows_use_from_the_request_thread_pool(monkeypatch):
    captured = {}
    monkeypatch.setattr("app.database_connection.create_engine", lambda url, **options: captured.update(options))

    create_database_engine("sqlite:///./zoom.db")

    assert captured["connect_args"] == {"check_same_thread": False}


def test_postgres_engine_is_tuned_for_serverless_hosting(monkeypatch):
    captured = {}
    monkeypatch.setattr("app.database_connection.create_engine", lambda url, **options: captured.update(options))

    create_database_engine("postgresql+psycopg://user:pass@host/db")

    assert captured["pool_pre_ping"] is True  # dead pooled connections are replaced, not used
    assert captured["pool_size"] == 2 and captured["max_overflow"] == 0  # small pool: many instances run at once
    assert captured["connect_args"] == {"prepare_threshold": None}  # Neon's pooler has no prepared statements


# --- The schema works on Postgres ---------------------------------------------

def compile_for_postgres(table) -> str:
    return str(CreateTable(table).compile(dialect=postgresql.dialect()))


def test_every_table_compiles_for_postgres():
    for table in Base.metadata.sorted_tables:
        assert compile_for_postgres(table).startswith("\nCREATE TABLE " + table.name)


def test_postgres_schema_keeps_the_constraints_that_protect_the_data():
    meetings_sql = compile_for_postgres(Meeting.__table__)
    participants_sql = compile_for_postgres(Participant.__table__)

    assert "CHECK (duration_minutes > 0)" in meetings_sql
    assert "meeting_type = 'instant' OR scheduled_start IS NOT NULL" in meetings_sql
    assert "FOREIGN KEY(meeting_id) REFERENCES meetings (id) ON DELETE CASCADE" in participants_sql
    assert "FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE SET NULL" in participants_sql
    # The enum columns are plain text with a CHECK, so no Postgres ENUM type has to be created.
    assert "VARCHAR(20)" in meetings_sql and "CREATE TYPE" not in meetings_sql


def test_postgres_schema_creates_the_polling_index():
    participants_index = next(i for i in Participant.__table__.indexes if i.name == "ix_participants_meeting_left")

    index_sql = str(CreateIndex(participants_index).compile(dialect=postgresql.dialect()))

    assert "ON participants (meeting_id, left_at)" in index_sql


def test_meeting_code_is_a_unique_index_on_postgres_too():
    # unique=True together with index=True makes SQLAlchemy create a UNIQUE INDEX (not a clause inside CREATE TABLE).
    code_index = next(i for i in Meeting.__table__.indexes if i.name == "ix_meetings_meeting_code")

    index_sql = str(CreateIndex(code_index).compile(dialect=postgresql.dialect()))

    assert "CREATE UNIQUE INDEX ix_meetings_meeting_code ON meetings (meeting_code)" in index_sql


def test_user_email_is_unique_on_postgres_too():
    assert "UNIQUE (email)" in compile_for_postgres(User.__table__)


# --- GET /api/health ---------------------------------------------------------

def test_health_check_reports_the_server_and_the_database(api_client):
    response = api_client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}
