# =============================================================================
# File: tests/test_meeting_details_and_delete_endpoints.py
# Purpose: Tests for the two host-only endpoints behind the meeting details page:
#          GET /api/meetings/{code}/details and DELETE /api/meetings/{code}.
# Run (from backend/):  venv\Scripts\python -m pytest tests -v
# =============================================================================

from app.database_models import Meeting, MeetingStatus, MeetingType, Participant, User
from meeting_test_helpers import create_instant_meeting, start_meeting_with_host_and_guests


# Purpose: Create a live meeting hosted by someone other than the logged-in user.
# Input:   db_session - the test database
# Output:  its meeting code
def create_meeting_hosted_by_priya(db_session) -> str:
    priya = db_session.query(User).filter_by(name="Priya Sharma").one()
    meeting = Meeting(
        meeting_code="55555555555", title="Priya's meeting", host=priya, passcode="secret",
        meeting_type=MeetingType.instant, status=MeetingStatus.live,
    )
    db_session.add(meeting)
    db_session.commit()
    return meeting.meeting_code


# --- GET /api/meetings/{code}/details ----------------------------------------

def test_details_returns_passcode_and_invite_link_to_the_host(api_client):
    meeting = create_instant_meeting(api_client)

    response = api_client.get(f"/api/meetings/{meeting['meeting_code']}/details")

    body = response.json()
    assert response.status_code == 200
    assert body["passcode"] == meeting["passcode"]
    assert body["invite_link"] == f"http://localhost:3000/join/{meeting['meeting_code']}?pwd={meeting['passcode']}"
    assert body["title"] == "Mitul Goyal's Zoom Meeting"


def test_details_of_a_meeting_without_a_passcode_has_a_plain_invite_link(api_client):
    request = {"title": "Open meeting", "scheduled_start": "2099-01-01T10:00:00Z",
               "duration_minutes": 30, "has_passcode": False}
    meeting = api_client.post("/api/meetings/schedule", json=request).json()

    body = api_client.get(f"/api/meetings/{meeting['meeting_code']}/details").json()

    assert body["passcode"] is None
    assert body["invite_link"] == f"http://localhost:3000/join/{meeting['meeting_code']}"


def test_details_accepts_a_meeting_code_with_spaces(api_client):
    meeting = create_instant_meeting(api_client)
    code = meeting["meeting_code"]

    response = api_client.get(f"/api/meetings/{code[:3]}%20{code[3:7]}%20{code[7:]}/details")

    assert response.status_code == 200


def test_details_of_another_hosts_meeting_is_forbidden(api_client, db_session):
    code = create_meeting_hosted_by_priya(db_session)

    response = api_client.get(f"/api/meetings/{code}/details")

    assert response.status_code == 403
    assert "Only the host" in response.json()["detail"]
    # The passcode must not leak through the error either.
    assert "secret" not in response.text


def test_details_of_an_unknown_meeting_returns_404(api_client):
    response = api_client.get("/api/meetings/00000000000/details")

    assert response.status_code == 404
    assert "Meeting not found" in response.json()["detail"]


# --- DELETE /api/meetings/{code} ---------------------------------------------

def test_host_deletes_their_meeting_and_it_can_no_longer_be_found(api_client):
    meeting = create_instant_meeting(api_client)
    code = meeting["meeting_code"]

    response = api_client.delete(f"/api/meetings/{code}")

    assert response.status_code == 204
    assert api_client.get(f"/api/meetings/{code}").status_code == 404


def test_deleted_scheduled_meeting_disappears_from_upcoming(api_client):
    upcoming = api_client.get("/api/meetings/upcoming").json()
    meeting_to_delete = upcoming[0]

    api_client.delete(f"/api/meetings/{meeting_to_delete['meeting_code']}")

    remaining_titles = [m["title"] for m in api_client.get("/api/meetings/upcoming").json()]
    assert meeting_to_delete["title"] not in remaining_titles
    assert len(remaining_titles) == len(upcoming) - 1


def test_deleting_a_meeting_also_deletes_its_participants(api_client, db_session):
    meeting, _, _ = start_meeting_with_host_and_guests(api_client, "Sam", "Lee")
    meeting_id = meeting["id"]
    assert db_session.query(Participant).filter_by(meeting_id=meeting_id).count() == 3

    api_client.delete(f"/api/meetings/{meeting['meeting_code']}")

    assert db_session.query(Participant).filter_by(meeting_id=meeting_id).count() == 0


def test_deleting_another_hosts_meeting_is_forbidden_and_changes_nothing(api_client, db_session):
    code = create_meeting_hosted_by_priya(db_session)

    response = api_client.delete(f"/api/meetings/{code}")

    assert response.status_code == 403
    assert db_session.query(Meeting).filter_by(meeting_code=code).count() == 1


def test_deleting_an_unknown_meeting_returns_404(api_client):
    response = api_client.delete("/api/meetings/00000000000")

    assert response.status_code == 404


def test_deleting_twice_returns_404_the_second_time(api_client):
    meeting = create_instant_meeting(api_client)
    api_client.delete(f"/api/meetings/{meeting['meeting_code']}")

    second_response = api_client.delete(f"/api/meetings/{meeting['meeting_code']}")

    assert second_response.status_code == 404
