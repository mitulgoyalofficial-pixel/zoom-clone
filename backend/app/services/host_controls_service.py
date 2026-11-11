# =============================================================================
# File: app/services/host_controls_service.py
# Purpose: The actions only the host of a meeting may do: mute everyone and
#          remove a participant.
# Contains:
#   - load_acting_host(): checks "is this caller really the host?"
#   - mute_all_participants()
#   - remove_participant()
# How the host is recognised: there is no login, so the caller sends their own
#   participant id (host_participant_id). We check that this row is in THIS
#   meeting, is still inside, and has the host role.
# =============================================================================

from sqlalchemy.orm import Session

from app.database_models import Meeting, Participant, ParticipantRole, current_utc_time
from app.services.meeting_errors import InvalidMeetingRequestError, NotMeetingHostError
from app.services.participant_service import fetch_active_participant, fetch_active_participants


# Purpose: Make sure the caller is the host of this meeting before a host-only action.
# Input:   db; meeting; host_participant_id - the caller's own participant id
# Output:  the host's Participant row
# Errors:  ParticipantNotFoundError if the caller is not inside this meeting
#          (this also covers a host who already left and ended the meeting);
#          NotMeetingHostError if the caller is inside but is not the host
def load_acting_host(db: Session, meeting: Meeting, host_participant_id: int) -> Participant:
    caller = fetch_active_participant(db, meeting.id, host_participant_id)
    if caller.role != ParticipantRole.host:
        raise NotMeetingHostError("Only the host can do this.")
    return caller


# Purpose: "Mute all" button.
# Input:   db; meeting; host_participant_id - the caller (must be the host)
# Output:  none
# How it works: sets is_muted on everyone inside except the host, like Zoom.
def mute_all_participants(db: Session, meeting: Meeting, host_participant_id: int) -> None:
    load_acting_host(db, meeting, host_participant_id)
    for participant in fetch_active_participants(db, meeting.id):
        if participant.role != ParticipantRole.host:
            participant.is_muted = True
    db.commit()


# Purpose: "Remove" in the participants panel.
# Input:   db; meeting; host_participant_id - the caller (must be the host);
#          participant_id - the person to remove
# Output:  none
# Errors:  NotMeetingHostError; ParticipantNotFoundError if the target is not inside;
#          InvalidMeetingRequestError if the host tries to remove themselves
# How it works: stamps removed_at (not left_at) so the removed person's next poll
#   can show "You were removed by the host".
def remove_participant(
    db: Session, meeting: Meeting, host_participant_id: int, participant_id: int
) -> None:
    load_acting_host(db, meeting, host_participant_id)
    if participant_id == host_participant_id:
        raise InvalidMeetingRequestError("You are the host. Leave the meeting instead of removing yourself.")

    participant = fetch_active_participant(db, meeting.id, participant_id)
    participant.removed_at = current_utc_time()
    db.commit()
