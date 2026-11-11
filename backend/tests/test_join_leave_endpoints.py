# =============================================================================
# File: tests/test_join_leave_endpoints.py
# Purpose: Tests for the join flow: POST .../join, POST .../leave and
#          GET .../participants (rules: passcode, host vs guest, ended meetings,
#          meeting goes live on first join, host leaving ends the meeting).
# Run (from backend/):  venv\Scripts\python -m pytest tests -v
# =============================================================================

from app.database_models import Meeting, MeetingStatus, MeetingType, Participant, User, current_utc_time


# --- Helpers -----------------------------------------------------------------

# Purpose: Create an instant meeting through the API. Output: the meeting dict (code, passcode ...).
def create_instant_meeting(api_client) -> dict:
    return api_client.post("/api/meetings/instant").json()


# Purpose: Call the join endpoint. Input: meeting code, display_name and any other body fields.
# Output: the HTTP response
def join_meeting(api_client, meeting_code: str, display_name: str = "Alex", **extra_fields):
    body = {"display_name": display_name, **extra_fields}
    return api_client.post(f"/api/meetings/{meeting_code}/join", json=body)


# Purpose: The names currently in the participants panel of a meeting.
def list_participant_names(api_client, meeting_code: str) -> list[str]:
    response = api_client.get(f"/api/meetings/{meeting_code}/participants")
    return [participant["display_name"] for participant in response.json()["participants"]]


# --- Joining as host ---------------------------------------------------------

def test_host_joins_own_meeting_without_a_passcode(api_client):
    meeting = create_instant_meeting(api_client)

    response = join_meeting(api_client, meeting["meeting_code"], "Mitul", as_host=True)

    assert response.status_code == 201
    assert response.json()["role"] == "host"
    assert response.json()["display_name"] == "Mitul"
    assert response.json()["is_muted"] is False


def test_joining_as_host_is_refused_for_a_meeting_hosted_by_someone_else(api_client, db_session):
    priya = db_session.query(User).filter_by(name="Priya Sharma").one()
    meeting = Meeting(
        meeting_code="55555555555", title="Priya's meeting", host=priya,
        meeting_type=MeetingType.instant, status=MeetingStatus.live,
    )
    db_session.add(meeting)
    db_session.commit()

    response = join_meeting(api_client, "55555555555", as_host=True)

    assert response.status_code == 403
    assert "Only the host" in response.json()["detail"]


# --- Joining as guest --------------------------------------------------------

def test_guest_joins_with_the_correct_passcode(api_client):
    meeting = create_instant_meeting(api_client)

    response = join_meeting(api_client, meeting["meeting_code"], passcode=meeting["passcode"])

    assert response.status_code == 201
    assert response.json()["role"] == "participant"


def test_guest_is_stored_without_a_user_account(api_client, db_session):
    meeting = create_instant_meeting(api_client)

    participant_id = join_meeting(api_client, meeting["meeting_code"], passcode=meeting["passcode"]).json()["id"]

    assert db_session.get(Participant, participant_id).user_id is None


def test_guest_with_wrong_passcode_is_refused(api_client):
    meeting = create_instant_meeting(api_client)

    response = join_meeting(api_client, meeting["meeting_code"], passcode="wrong1")

    assert response.status_code == 403
    assert "Incorrect passcode" in response.json()["detail"]


def test_guest_without_a_passcode_is_refused_when_the_meeting_has_one(api_client):
    meeting = create_instant_meeting(api_client)

    response = join_meeting(api_client, meeting["meeting_code"])

    assert response.status_code == 403


def test_guest_joins_a_meeting_that_has_no_passcode_without_typing_one(api_client):
    request = {"title": "Open meeting", "scheduled_start": "2099-01-01T10:00:00Z",
               "duration_minutes": 30, "has_passcode": False}
    meeting = api_client.post("/api/meetings/schedule", json=request).json()

    response = join_meeting(api_client, meeting["meeting_code"])

    assert response.status_code == 201


def test_display_name_is_trimmed(api_client):
    meeting = create_instant_meeting(api_client)

    response = join_meeting(api_client, meeting["meeting_code"], "  Sam  ", passcode=meeting["passcode"])

    assert response.json()["display_name"] == "Sam"


def test_blank_display_name_is_rejected(api_client):
    meeting = create_instant_meeting(api_client)

    response = join_meeting(api_client, meeting["meeting_code"], "   ", passcode=meeting["passcode"])

    assert response.status_code == 422


def test_join_accepts_a_meeting_code_with_spaces(api_client):
    meeting = create_instant_meeting(api_client)
    code = meeting["meeting_code"]

    response = join_meeting(api_client, f"{code[:3]}%20{code[3:7]}%20{code[7:]}", passcode=meeting["passcode"])

    assert response.status_code == 201


# --- Meeting state rules -----------------------------------------------------

def test_joining_an_unknown_meeting_returns_404(api_client):
    response = join_meeting(api_client, "00000000000")

    assert response.status_code == 404
    assert "Meeting not found" in response.json()["detail"]


def test_joining_an_ended_meeting_returns_409(api_client):
    ended_meeting = api_client.get("/api/meetings/recent").json()[-1]

    response = join_meeting(api_client, ended_meeting["meeting_code"], as_host=True)

    assert response.status_code == 409
    assert "has ended" in response.json()["detail"]


def test_first_join_makes_a_scheduled_meeting_live(api_client):
    scheduled = api_client.get("/api/meetings/upcoming").json()[0]
    assert scheduled["status"] == "scheduled"

    join_meeting(api_client, scheduled["meeting_code"], as_host=True)

    after = api_client.get(f"/api/meetings/{scheduled['meeting_code']}").json()
    assert after["status"] == "live"
    assert after["started_at"] is not None


def test_second_join_does_not_change_when_the_meeting_started(api_client):
    scheduled = api_client.get("/api/meetings/upcoming").json()[0]
    join_meeting(api_client, scheduled["meeting_code"], as_host=True)
    started_at = api_client.get(f"/api/meetings/{scheduled['meeting_code']}").json()["started_at"]

    join_meeting(api_client, scheduled["meeting_code"], passcode=scheduled["passcode"])

    assert api_client.get(f"/api/meetings/{scheduled['meeting_code']}").json()["started_at"] == started_at


# --- Participants list -------------------------------------------------------

def test_participants_are_listed_in_join_order(api_client):
    meeting = create_instant_meeting(api_client)
    join_meeting(api_client, meeting["meeting_code"], "Mitul", as_host=True)
    join_meeting(api_client, meeting["meeting_code"], "Sam", passcode=meeting["passcode"])
    join_meeting(api_client, meeting["meeting_code"], "Lee", passcode=meeting["passcode"])

    assert list_participant_names(api_client, meeting["meeting_code"]) == ["Mitul", "Sam", "Lee"]


def test_participants_list_reports_meeting_status_and_not_removed_by_default(api_client):
    meeting = create_instant_meeting(api_client)
    joined = join_meeting(api_client, meeting["meeting_code"], "Mitul", as_host=True).json()

    body = api_client.get(
        f"/api/meetings/{meeting['meeting_code']}/participants", params={"participant_id": joined["id"]}
    ).json()

    assert body["meeting_status"] == "live"
    assert body["was_removed"] is False


def test_participants_of_an_unknown_meeting_returns_404(api_client):
    response = api_client.get("/api/meetings/00000000000/participants")

    assert response.status_code == 404


def test_removed_participant_is_hidden_from_the_list_and_told_they_were_removed(api_client, db_session):
    meeting = create_instant_meeting(api_client)
    code = meeting["meeting_code"]
    join_meeting(api_client, code, "Mitul", as_host=True)
    guest = join_meeting(api_client, code, "Sam", passcode=meeting["passcode"]).json()
    # The remove endpoint comes in the next step, so mark the row as removed directly.
    db_session.get(Participant, guest["id"]).removed_at = current_utc_time()
    db_session.commit()

    response = api_client.get(f"/api/meetings/{code}/participants", params={"participant_id": guest["id"]})

    assert [p["display_name"] for p in response.json()["participants"]] == ["Mitul"]
    assert response.json()["was_removed"] is True


# --- Leaving -----------------------------------------------------------------

def test_guest_leaving_removes_them_from_the_list_and_keeps_the_meeting_live(api_client):
    meeting = create_instant_meeting(api_client)
    code = meeting["meeting_code"]
    join_meeting(api_client, code, "Mitul", as_host=True)
    guest = join_meeting(api_client, code, "Sam", passcode=meeting["passcode"]).json()

    response = api_client.post(f"/api/meetings/{code}/leave", params={"participant_id": guest["id"]})

    assert response.status_code == 204
    assert list_participant_names(api_client, code) == ["Mitul"]
    assert api_client.get(f"/api/meetings/{code}").json()["status"] == "live"


def test_host_leaving_ends_the_meeting_and_empties_the_list(api_client):
    meeting = create_instant_meeting(api_client)
    code = meeting["meeting_code"]
    host = join_meeting(api_client, code, "Mitul", as_host=True).json()
    join_meeting(api_client, code, "Sam", passcode=meeting["passcode"])

    api_client.post(f"/api/meetings/{code}/leave", params={"participant_id": host["id"]})

    after = api_client.get(f"/api/meetings/{code}").json()
    assert after["status"] == "ended"
    assert after["ended_at"] is not None
    assert list_participant_names(api_client, code) == []
    assert api_client.get(f"/api/meetings/{code}/participants").json()["meeting_status"] == "ended"


def test_leaving_twice_is_harmless(api_client):
    meeting = create_instant_meeting(api_client)
    code = meeting["meeting_code"]
    guest = join_meeting(api_client, code, "Sam", passcode=meeting["passcode"]).json()
    api_client.post(f"/api/meetings/{code}/leave", params={"participant_id": guest["id"]})

    second_response = api_client.post(f"/api/meetings/{code}/leave", params={"participant_id": guest["id"]})

    assert second_response.status_code == 204


def test_leave_with_a_participant_of_another_meeting_returns_404(api_client):
    first = create_instant_meeting(api_client)
    second = create_instant_meeting(api_client)
    guest_in_first = join_meeting(api_client, first["meeting_code"], passcode=first["passcode"]).json()

    response = api_client.post(
        f"/api/meetings/{second['meeting_code']}/leave", params={"participant_id": guest_in_first["id"]}
    )

    assert response.status_code == 404
    assert list_participant_names(api_client, first["meeting_code"]) == ["Alex"]


def test_leave_requires_a_participant_id(api_client):
    meeting = create_instant_meeting(api_client)

    response = api_client.post(f"/api/meetings/{meeting['meeting_code']}/leave")

    assert response.status_code == 422


def test_rejoining_creates_a_new_participant_row(api_client):
    meeting = create_instant_meeting(api_client)
    code = meeting["meeting_code"]
    first = join_meeting(api_client, code, "Sam", passcode=meeting["passcode"]).json()
    api_client.post(f"/api/meetings/{code}/leave", params={"participant_id": first["id"]})

    second = join_meeting(api_client, code, "Sam", passcode=meeting["passcode"]).json()

    assert second["id"] != first["id"]
    assert list_participant_names(api_client, code) == ["Sam"]
