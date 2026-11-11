# =============================================================================
# File: tests/test_create_meeting_endpoints.py
# Purpose: Tests for the endpoints that create meetings:
#          POST /api/meetings/instant and POST /api/meetings/schedule.
# Run (from backend/):  venv\Scripts\python -m pytest tests -v
# =============================================================================

from datetime import datetime, timedelta, timezone


# Purpose: A valid Schedule form body, one day from now, with optional overrides.
# Input:   overrides - fields to replace, e.g. title="", duration_minutes=0
# Output:  dict ready to send as JSON
def build_schedule_request(**overrides) -> dict:
    tomorrow = datetime.now(timezone.utc) + timedelta(days=1)
    request = {
        "title": "Quarterly Review",
        "description": "Numbers and plans.",
        "scheduled_start": tomorrow.isoformat(),
        "duration_minutes": 60,
    }
    request.update(overrides)
    return request


# --- POST /api/meetings/instant ----------------------------------------------

def test_instant_meeting_is_created_live_with_zoom_style_title(api_client):
    response = api_client.post("/api/meetings/instant")

    body = response.json()
    assert response.status_code == 201
    assert body["title"] == "Mitul Goyal's Zoom Meeting"
    assert body["meeting_type"] == "instant"
    assert body["status"] == "live"
    assert body["started_at"] is not None
    assert body["host_name"] == "Mitul Goyal"


def test_instant_meeting_gets_11_digit_code_passcode_and_invite_link(api_client):
    body = api_client.post("/api/meetings/instant").json()

    assert len(body["meeting_code"]) == 11
    assert body["meeting_code"].isdigit()
    assert body["meeting_code"][0] != "0"
    assert len(body["passcode"]) == 6
    assert body["invite_link"] == f"http://localhost:3000/join/{body['meeting_code']}?pwd={body['passcode']}"


def test_instant_meeting_can_be_found_by_its_code_afterwards(api_client):
    created = api_client.post("/api/meetings/instant").json()

    response = api_client.get(f"/api/meetings/{created['meeting_code']}")

    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_instant_meeting_appears_first_in_recent(api_client):
    created = api_client.post("/api/meetings/instant").json()

    recent = api_client.get("/api/meetings/recent").json()

    assert recent[0]["meeting_code"] == created["meeting_code"]


def test_two_instant_meetings_get_different_codes(api_client):
    first = api_client.post("/api/meetings/instant").json()
    second = api_client.post("/api/meetings/instant").json()

    assert first["meeting_code"] != second["meeting_code"]


# --- POST /api/meetings/schedule ---------------------------------------------

def test_scheduled_meeting_is_saved_and_shown_in_upcoming(api_client):
    response = api_client.post("/api/meetings/schedule", json=build_schedule_request())

    assert response.status_code == 201
    assert response.json()["status"] == "scheduled"
    upcoming_titles = [m["title"] for m in api_client.get("/api/meetings/upcoming").json()]
    assert "Quarterly Review" in upcoming_titles


def test_scheduled_meeting_has_passcode_by_default(api_client):
    body = api_client.post("/api/meetings/schedule", json=build_schedule_request()).json()

    assert len(body["passcode"]) == 6
    assert body["has_passcode"] is True
    assert body["invite_link"].endswith(f"?pwd={body['passcode']}")


def test_scheduled_meeting_without_passcode_has_plain_invite_link(api_client):
    request = build_schedule_request(has_passcode=False)

    body = api_client.post("/api/meetings/schedule", json=request).json()

    assert body["passcode"] is None
    assert body["has_passcode"] is False
    assert body["invite_link"] == f"http://localhost:3000/join/{body['meeting_code']}"


def test_scheduled_start_with_timezone_offset_is_stored_as_utc(api_client):
    # 10:00 in India (+05:30) is 04:30 UTC.
    request = build_schedule_request(scheduled_start="2099-01-01T10:00:00+05:30")

    body = api_client.post("/api/meetings/schedule", json=request).json()

    assert body["scheduled_start"] == "2099-01-01T04:30:00Z"


def test_scheduled_start_without_timezone_is_taken_as_utc(api_client):
    request = build_schedule_request(scheduled_start="2099-01-01T10:00:00")

    body = api_client.post("/api/meetings/schedule", json=request).json()

    assert body["scheduled_start"] == "2099-01-01T10:00:00Z"


def test_description_is_optional(api_client):
    request = build_schedule_request()
    del request["description"]

    response = api_client.post("/api/meetings/schedule", json=request)

    assert response.status_code == 201
    assert response.json()["description"] is None


def test_schedule_rejects_a_start_time_in_the_past_with_clear_message(api_client):
    yesterday = datetime.now(timezone.utc) - timedelta(days=1)
    request = build_schedule_request(scheduled_start=yesterday.isoformat())

    response = api_client.post("/api/meetings/schedule", json=request)

    assert response.status_code == 400
    assert "in the past" in response.json()["detail"]


def test_schedule_allows_a_start_time_of_right_now(api_client):
    # The time picker only has minute precision, so "now" can be seconds in the past.
    just_now = datetime.now(timezone.utc) - timedelta(seconds=30)
    request = build_schedule_request(scheduled_start=just_now.isoformat())

    response = api_client.post("/api/meetings/schedule", json=request)

    assert response.status_code == 201


def test_schedule_rejects_empty_or_blank_title(api_client):
    for bad_title in ["", "   "]:
        response = api_client.post("/api/meetings/schedule", json=build_schedule_request(title=bad_title))

        assert response.status_code == 422


def test_schedule_rejects_duration_of_zero_and_over_24_hours(api_client):
    for bad_duration in [0, -5, 24 * 60 + 1]:
        response = api_client.post(
            "/api/meetings/schedule", json=build_schedule_request(duration_minutes=bad_duration)
        )

        assert response.status_code == 422


def test_schedule_rejects_a_missing_start_time(api_client):
    request = build_schedule_request()
    del request["scheduled_start"]

    response = api_client.post("/api/meetings/schedule", json=request)

    assert response.status_code == 422
