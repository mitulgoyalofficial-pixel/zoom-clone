# =============================================================================
# File: tests/conftest.py
# Purpose: Shared pytest fixtures. Gives every test a fresh in-memory SQLite
#          database (seeded with the sample data) and an API client wired to it,
#          so tests are fast, independent and never touch the real zoom.db.
# Contains: db_session fixture, api_client fixture
# =============================================================================

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import database_models  # noqa: F401  (registers the tables on Base.metadata)
from app.database_connection import Base, enable_sqlite_foreign_keys, get_db_session
from app.main import app
from app.sample_data_seeder import seed_database_if_empty


# Purpose: A seeded, empty-after-the-test database session.
# Output:  an open Session; the in-memory database disappears afterwards
@pytest.fixture
def db_session():
    # StaticPool: every connection shares ONE in-memory database
    # (by default each new connection to "sqlite://" would get its own empty one).
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    # Same foreign-key pragma as the real engine, so ON DELETE CASCADE behaves like production.
    event.listen(test_engine, "connect", enable_sqlite_foreign_keys)
    Base.metadata.create_all(test_engine)
    session = sessionmaker(bind=test_engine, autoflush=False)()
    seed_database_if_empty(session)
    yield session
    session.close()


# Purpose: An HTTP client that calls the real endpoints against the test database.
# Output:  a TestClient
@pytest.fixture
def api_client(db_session):
    # Replace the real session provider so endpoints use the test database.
    app.dependency_overrides[get_db_session] = lambda: db_session
    # No `with` block on purpose: that would run the startup hook (real zoom.db).
    yield TestClient(app)
    app.dependency_overrides.clear()
