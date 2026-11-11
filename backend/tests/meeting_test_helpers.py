# =============================================================================
# File: tests/meeting_test_helpers.py
# Purpose: Small helper functions shared by the endpoint test files, so each
#          test reads as a story instead of repeating setup calls.
# Contains: create_instant_meeting, join_meeting, list_participant_names,
#           start_meeting_with_host_and_guests
# =============================================================================


# Purpose: Create an instant meeting through the API.
# Input:   api_client - the test client
# Output:  the meeting as a dict (meeting_code, passcode, ...)
def create_instant_meeting(api_client) -> dict:
    return api_client.post("/api/meetings/instant").json()


# Purpose: Call the join endpoint.
# Input:   api_client; meeting_code; display_name; extra_fields - e.g. passcode=..., as_host=True
# Output:  the HTTP response
def join_meeting(api_client, meeting_code: str, display_name: str = "Alex", **extra_fields):
    body = {"display_name": display_name, **extra_fields}
    return api_client.post(f"/api/meetings/{meeting_code}/join", json=body)


# Purpose: Who is in the participants panel of a meeting right now.
# Output:  list of display names in join order
def list_participant_names(api_client, meeting_code: str) -> list[str]:
    response = api_client.get(f"/api/meetings/{meeting_code}/participants")
    return [participant["display_name"] for participant in response.json()["participants"]]


# Purpose: Set up the common situation: a live meeting with its host and some guests inside.
# Input:   api_client; guest_names - names of the guests to add
# Output:  (meeting dict, host participant dict, list of guest participant dicts)
def start_meeting_with_host_and_guests(api_client, *guest_names: str):
    meeting = create_instant_meeting(api_client)
    code = meeting["meeting_code"]
    host = join_meeting(api_client, code, "Mitul", as_host=True).json()
    guests = [
        join_meeting(api_client, code, name, passcode=meeting["passcode"]).json()
        for name in guest_names
    ]
    return meeting, host, guests
