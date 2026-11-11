# =============================================================================
# File: tests/test_read_endpoints.py
# Purpose: Tests for the read-only endpoints: /api/me, /api/meetings/upcoming,
#          /api/meetings/recent and /api/meetings/{code}.
# Uses the seed data: 3 upcoming meetings, 3 past meetings, user id 1 = host.
# Run (from backend/):  venv\Scripts\python -m pytest tests -v
# =============================================================================

from datetime import timedelta

from app.database_models import Meeting


# --- GET /api/me -------------------------------------------------------------

def test_me_returns_the_default_user(api_client):
    response = api_client.get("/api/me")

    assert response.status_code == 200
    assert response.json()["id"] == 1
    assert response.json()["name"] == "Mitul Goyal"


# --- GET /api/meetings/upcoming ----------------------------------------------

def test_upcoming_lists_future_meetings_earliest_first(api_client):
    response = api_client.get("/api/meetings/upcoming")

    titles = [meeting["title"] for meeting in response.json()]
    assert response.status_code == 200
    assert titles == ["Sprint Planning", "Design Review", "1:1 with Priya"]


def test_upcoming_hides_meeting_whose_end_time_has_passed(api_client, db_session):
    sprint_planning = db_session.query(Meeting).filter_by(title="Sprint Planning").one()
    sprint_planning.scheduled_start -= timedelta(days=1)
    db_session.commit()

    response = api_client.get("/api/meetings/upcoming")

    titles = [meeting["title"] for meeting in response.json()]
    assert "Sprint Planning" not in titles


def test_upcoming_includes_passcode_and_invite_link_for_the_host(api_client):
    meeting = api_client.get("/api/meetings/upcoming").json()[0]

    expected_link = f"http://localhost:3000/join/{meeting['meeting_code']}?pwd={meeting['passcode']}"
    assert meeting["invite_link"] == expected_link


# --- GET /api/meetings/recent ------------------------------------------------

def test_recent_lists_started_meetings_newest_first(api_client):
    response = api_client.get("/api/meetings/recent")

    titles = [meeting["title"] for meeting in response.json()]
    assert response.status_code == 200
    assert titles == ["Mitul Goyal's Zoom Meeting", "Weekly Team Sync", "Client Demo Prep"]


def test_recent_does_not_include_meetings_that_never_started(api_client):
    response = api_client.get("/api/meetings/recent")

    assert all(meeting["started_at"] is not None for meeting in response.json())


# --- GET /api/meetings/{code} ------------------------------------------------

def test_get_meeting_by_code_returns_meeting_without_passcode(api_client, db_session):
    meeting = db_session.query(Meeting).filter_by(title="Design Review").one()

    response = api_client.get(f"/api/meetings/{meeting.meeting_code}")

    body = response.json()
    assert response.status_code == 200
    assert body["title"] == "Design Review"
    assert body["host_name"] == "Mitul Goyal"
    assert body["has_passcode"] is True
    # The passcode must never leak from the public endpoint.
    assert "passcode" not in body
    assert "invite_link" not in body


def test_get_meeting_by_code_accepts_spaces_in_the_code(api_client, db_session):
    meeting = db_session.query(Meeting).filter_by(title="Design Review").one()
    code = meeting.meeting_code
    spaced_code = f"{code[:3]} {code[3:7]} {code[7:]}"

    response = api_client.get(f"/api/meetings/{spaced_code}")

    assert response.status_code == 200
    assert response.json()["meeting_code"] == code


def test_get_meeting_by_code_returns_404_for_unknown_code(api_client):
    response = api_client.get("/api/meetings/00000000000")

    assert response.status_code == 404
    assert "Meeting not found" in response.json()["detail"]


# --- Time format -------------------------------------------------------------

def test_times_are_sent_with_utc_suffix(api_client):
    meeting = api_client.get("/api/meetings/upcoming").json()[0]

    # Without the "Z" the browser would read the time as local time.
    assert meeting["scheduled_start"].endswith("Z")
    assert meeting["started_at"] is None
