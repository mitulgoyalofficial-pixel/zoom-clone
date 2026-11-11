# =============================================================================
# File: tests/test_sample_data_seeder.py
# Purpose: Tests for the sample data: what the first seed creates, and the refresh that keeps
#          the "Upcoming" section from going empty when the stored sample meetings get old.
# Run (from backend/):  venv\Scripts\python -m pytest tests -v
# =============================================================================

from datetime import timedelta

from app.database_models import Meeting, MeetingType, current_utc_time
from app.sample_data_seeder import refresh_sample_upcoming_meetings_if_none, seed_database_if_empty
from app.services.meeting_service import fetch_recent_meetings, fetch_upcoming_meetings

DEFAULT_USER_ID = 1


def test_first_seed_creates_three_upcoming_and_three_recent_meetings(db_session):
    assert len(fetch_upcoming_meetings(db_session, DEFAULT_USER_ID)) == 3
    assert len(fetch_recent_meetings(db_session, DEFAULT_USER_ID)) == 3


def test_seeding_again_adds_nothing(db_session):
    count_before = db_session.query(Meeting).count()

    seed_database_if_empty(db_session)

    assert db_session.query(Meeting).count() == count_before


def test_refresh_does_nothing_while_an_upcoming_meeting_exists(db_session):
    count_before = db_session.query(Meeting).count()

    refresh_sample_upcoming_meetings_if_none(db_session)

    assert db_session.query(Meeting).count() == count_before


def test_refresh_adds_fresh_sample_meetings_when_all_have_gone_past(db_session):
    # Arrange: move every scheduled sample meeting a week into the past, so Upcoming is empty.
    for meeting in db_session.query(Meeting).filter_by(meeting_type=MeetingType.scheduled).all():
        meeting.scheduled_start = meeting.scheduled_start - timedelta(days=7)
    db_session.commit()
    assert fetch_upcoming_meetings(db_session, DEFAULT_USER_ID) == []

    refresh_sample_upcoming_meetings_if_none(db_session)

    upcoming = fetch_upcoming_meetings(db_session, DEFAULT_USER_ID)
    assert [m.title for m in upcoming] == ["Sprint Planning", "Design Review", "1:1 with Priya"]
    assert all(m.scheduled_start > current_utc_time() for m in upcoming)


def test_refreshed_meetings_get_new_unique_codes(db_session):
    old_codes = {m.meeting_code for m in db_session.query(Meeting).all()}
    for meeting in db_session.query(Meeting).filter_by(meeting_type=MeetingType.scheduled).all():
        meeting.scheduled_start = meeting.scheduled_start - timedelta(days=7)
    db_session.commit()

    refresh_sample_upcoming_meetings_if_none(db_session)

    new_codes = {m.meeting_code for m in fetch_upcoming_meetings(db_session, DEFAULT_USER_ID)}
    assert len(new_codes) == 3 and not (new_codes & old_codes)
