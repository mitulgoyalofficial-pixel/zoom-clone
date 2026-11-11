# =============================================================================
# File: tests/test_host_controls_endpoints.py
# Purpose: Tests for mute and remove:
#          POST .../mute-all, PATCH .../participants/{id} (self mute),
#          DELETE .../participants/{id} (host removes someone).
# Run (from backend/):  venv\Scripts\python -m pytest tests -v
# =============================================================================

from meeting_test_helpers import (
    create_instant_meeting,
    join_meeting,
    list_participant_names,
    start_meeting_with_host_and_guests,
)


# --- Helpers -----------------------------------------------------------------

# Purpose: Call mute-all as the given participant. Output: the HTTP response.
def mute_all(api_client, meeting_code: str, host_participant_id: int):
    return api_client.post(
        f"/api/meetings/{meeting_code}/mute-all", params={"host_participant_id": host_participant_id}
    )


# Purpose: Call remove as the given participant. Output: the HTTP response.
def remove_participant(api_client, meeting_code: str, participant_id: int, host_participant_id: int):
    return api_client.delete(
        f"/api/meetings/{meeting_code}/participants/{participant_id}",
        params={"host_participant_id": host_participant_id},
    )


# Purpose: Call the self mute/unmute endpoint. Output: the HTTP response.
def set_muted(api_client, meeting_code: str, participant_id: int, is_muted: bool):
    return api_client.patch(
        f"/api/meetings/{meeting_code}/participants/{participant_id}", json={"is_muted": is_muted}
    )


# Purpose: Map of display name -> is_muted for everyone inside the meeting.
def read_muted_states(api_client, meeting_code: str) -> dict:
    participants = api_client.get(f"/api/meetings/{meeting_code}/participants").json()["participants"]
    return {participant["display_name"]: participant["is_muted"] for participant in participants}


# --- Mute all ----------------------------------------------------------------

def test_mute_all_mutes_every_guest_but_not_the_host(api_client):
    meeting, host, _ = start_meeting_with_host_and_guests(api_client, "Sam", "Lee")

    response = mute_all(api_client, meeting["meeting_code"], host["id"])

    assert response.status_code == 204
    assert read_muted_states(api_client, meeting["meeting_code"]) == {
        "Mitul": False, "Sam": True, "Lee": True,
    }


def test_mute_all_is_refused_for_a_guest(api_client):
    meeting, _, guests = start_meeting_with_host_and_guests(api_client, "Sam", "Lee")

    response = mute_all(api_client, meeting["meeting_code"], guests[0]["id"])

    assert response.status_code == 403
    assert "Only the host" in response.json()["detail"]
    assert read_muted_states(api_client, meeting["meeting_code"])["Lee"] is False


def test_mute_all_with_an_unknown_participant_id_returns_404(api_client):
    meeting, _, _ = start_meeting_with_host_and_guests(api_client, "Sam")

    response = mute_all(api_client, meeting["meeting_code"], 99999)

    assert response.status_code == 404


def test_mute_all_with_the_host_of_another_meeting_returns_404(api_client):
    meeting, _, _ = start_meeting_with_host_and_guests(api_client, "Sam")
    _, other_host, _ = start_meeting_with_host_and_guests(api_client)

    response = mute_all(api_client, meeting["meeting_code"], other_host["id"])

    assert response.status_code == 404
    assert read_muted_states(api_client, meeting["meeting_code"])["Sam"] is False


def test_mute_all_requires_the_host_participant_id(api_client):
    meeting, _, _ = start_meeting_with_host_and_guests(api_client)

    response = api_client.post(f"/api/meetings/{meeting['meeting_code']}/mute-all")

    assert response.status_code == 422


def test_mute_all_fails_after_the_host_has_left(api_client):
    meeting, host, _ = start_meeting_with_host_and_guests(api_client, "Sam")
    api_client.post(f"/api/meetings/{meeting['meeting_code']}/leave", params={"participant_id": host["id"]})

    response = mute_all(api_client, meeting["meeting_code"], host["id"])

    assert response.status_code == 404


def test_mute_all_does_not_touch_people_who_already_left(api_client):
    meeting, host, guests = start_meeting_with_host_and_guests(api_client, "Sam", "Lee")
    api_client.post(f"/api/meetings/{meeting['meeting_code']}/leave", params={"participant_id": guests[0]["id"]})

    mute_all(api_client, meeting["meeting_code"], host["id"])

    assert read_muted_states(api_client, meeting["meeting_code"]) == {"Mitul": False, "Lee": True}


# --- Self mute / unmute ------------------------------------------------------

def test_a_participant_can_mute_and_unmute_themselves(api_client):
    meeting, _, guests = start_meeting_with_host_and_guests(api_client, "Sam")
    code, sam_id = meeting["meeting_code"], guests[0]["id"]

    muted = set_muted(api_client, code, sam_id, True)
    unmuted = set_muted(api_client, code, sam_id, False)

    assert muted.status_code == 200
    assert muted.json()["is_muted"] is True
    assert unmuted.json()["is_muted"] is False


def test_a_participant_muted_by_the_host_can_unmute_themselves(api_client):
    meeting, host, guests = start_meeting_with_host_and_guests(api_client, "Sam")
    code = meeting["meeting_code"]
    mute_all(api_client, code, host["id"])

    response = set_muted(api_client, code, guests[0]["id"], False)

    assert response.json()["is_muted"] is False


def test_muting_a_participant_who_left_returns_404(api_client):
    meeting, _, guests = start_meeting_with_host_and_guests(api_client, "Sam")
    code = meeting["meeting_code"]
    api_client.post(f"/api/meetings/{code}/leave", params={"participant_id": guests[0]["id"]})

    response = set_muted(api_client, code, guests[0]["id"], True)

    assert response.status_code == 404


def test_muting_with_a_participant_of_another_meeting_returns_404(api_client):
    first, _, first_guests = start_meeting_with_host_and_guests(api_client, "Sam")
    second = create_instant_meeting(api_client)

    response = set_muted(api_client, second["meeting_code"], first_guests[0]["id"], True)

    assert response.status_code == 404
    assert read_muted_states(api_client, first["meeting_code"])["Sam"] is False


def test_set_muted_rejects_a_body_without_is_muted(api_client):
    meeting, _, guests = start_meeting_with_host_and_guests(api_client, "Sam")

    response = api_client.patch(
        f"/api/meetings/{meeting['meeting_code']}/participants/{guests[0]['id']}", json={}
    )

    assert response.status_code == 422


def test_set_muted_on_an_unknown_meeting_returns_404(api_client):
    response = set_muted(api_client, "00000000000", 1, True)

    assert response.status_code == 404
    assert "Meeting not found" in response.json()["detail"]


# --- Remove participant ------------------------------------------------------

def test_host_removes_a_guest_who_disappears_from_the_list(api_client):
    meeting, host, guests = start_meeting_with_host_and_guests(api_client, "Sam", "Lee")
    code = meeting["meeting_code"]

    response = remove_participant(api_client, code, guests[0]["id"], host["id"])

    assert response.status_code == 204
    assert list_participant_names(api_client, code) == ["Mitul", "Lee"]


def test_removed_guest_is_told_they_were_removed_and_meeting_stays_live(api_client):
    meeting, host, guests = start_meeting_with_host_and_guests(api_client, "Sam")
    code = meeting["meeting_code"]
    remove_participant(api_client, code, guests[0]["id"], host["id"])

    poll = api_client.get(f"/api/meetings/{code}/participants", params={"participant_id": guests[0]["id"]}).json()

    assert poll["was_removed"] is True
    assert poll["meeting_status"] == "live"


def test_removed_guest_can_no_longer_mute_themselves(api_client):
    meeting, host, guests = start_meeting_with_host_and_guests(api_client, "Sam")
    code = meeting["meeting_code"]
    remove_participant(api_client, code, guests[0]["id"], host["id"])

    response = set_muted(api_client, code, guests[0]["id"], True)

    assert response.status_code == 404


def test_removed_guest_closing_the_tab_still_gets_a_harmless_leave(api_client):
    meeting, host, guests = start_meeting_with_host_and_guests(api_client, "Sam")
    code = meeting["meeting_code"]
    remove_participant(api_client, code, guests[0]["id"], host["id"])

    response = api_client.post(f"/api/meetings/{code}/leave", params={"participant_id": guests[0]["id"]})

    assert response.status_code == 204


def test_remove_is_refused_for_a_guest(api_client):
    meeting, _, guests = start_meeting_with_host_and_guests(api_client, "Sam", "Lee")
    code = meeting["meeting_code"]

    response = remove_participant(api_client, code, guests[1]["id"], guests[0]["id"])

    assert response.status_code == 403
    assert list_participant_names(api_client, code) == ["Mitul", "Sam", "Lee"]


def test_host_cannot_remove_themselves(api_client):
    meeting, host, _ = start_meeting_with_host_and_guests(api_client, "Sam")

    response = remove_participant(api_client, meeting["meeting_code"], host["id"], host["id"])

    assert response.status_code == 400
    assert "Leave the meeting" in response.json()["detail"]


def test_removing_someone_who_is_not_inside_returns_404(api_client):
    meeting, host, guests = start_meeting_with_host_and_guests(api_client, "Sam")
    code = meeting["meeting_code"]
    remove_participant(api_client, code, guests[0]["id"], host["id"])

    second_attempt = remove_participant(api_client, code, guests[0]["id"], host["id"])

    assert second_attempt.status_code == 404


def test_removing_a_participant_of_another_meeting_returns_404(api_client):
    meeting, host, _ = start_meeting_with_host_and_guests(api_client)
    other_meeting, _, other_guests = start_meeting_with_host_and_guests(api_client, "Outsider")

    response = remove_participant(api_client, meeting["meeting_code"], other_guests[0]["id"], host["id"])

    assert response.status_code == 404
    assert list_participant_names(api_client, other_meeting["meeting_code"]) == ["Mitul", "Outsider"]


def test_removed_guest_can_join_again_as_a_new_participant(api_client):
    meeting, host, guests = start_meeting_with_host_and_guests(api_client, "Sam")
    code = meeting["meeting_code"]
    remove_participant(api_client, code, guests[0]["id"], host["id"])

    rejoined = join_meeting(api_client, code, "Sam", passcode=meeting["passcode"]).json()

    assert rejoined["id"] != guests[0]["id"]
    assert list_participant_names(api_client, code) == ["Mitul", "Sam"]
