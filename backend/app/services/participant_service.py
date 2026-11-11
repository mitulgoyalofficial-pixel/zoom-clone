# =============================================================================
# File: app/services/participant_service.py
# Purpose: Business rules for people inside a meeting: joining, leaving and
#          listing who is currently there. (Host controls come later.)
# Contains:
#   - join_meeting_as_host(), join_meeting_as_guest()
#   - leave_meeting()
#   - fetch_active_participants(), fetch_active_participant(), has_participant_been_removed()
#   - set_participant_muted(): a person mutes/unmutes themselves
# Rules in short:
#   - nobody can join an ended meeting
#   - the host skips the passcode; guests must give the right one (if any)
#   - the first join of a scheduled meeting makes it "live"
#   - when the host leaves, the meeting ends and everyone is marked as left
#   - every join adds a NEW participants row (rejoining never reuses a row)
# =============================================================================

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database_models import (
    Meeting,
    MeetingStatus,
    Participant,
    ParticipantRole,
    User,
    current_utc_time,
)
from app.services.meeting_errors import (
    MeetingEndedError,
    NotMeetingHostError,
    ParticipantNotFoundError,
    WrongPasscodeError,
)


# Purpose: Refuse joining a meeting that is already over.
# Input:   meeting - the meeting someone wants to join
# Output:  none; raises MeetingEndedError if the meeting has ended
def ensure_meeting_is_joinable(meeting: Meeting) -> None:
    if meeting.status == MeetingStatus.ended:
        raise MeetingEndedError("This meeting has ended.")


# Purpose: Switch a scheduled meeting to live when its first person arrives.
# Input:   meeting - the meeting being joined
# Output:  none; changes status and started_at only if the meeting was "scheduled"
def mark_meeting_live_if_scheduled(meeting: Meeting) -> None:
    if meeting.status == MeetingStatus.scheduled:
        meeting.status = MeetingStatus.live
        meeting.started_at = current_utc_time()


# Purpose: Save a new participants row and commit it.
# Input:   db; meeting; display_name; role; user - the account, or None for a guest
# Output:  the saved Participant
def save_new_participant(
    db: Session, meeting: Meeting, display_name: str, role: ParticipantRole, user: User | None
) -> Participant:
    participant = Participant(
        meeting=meeting,
        user=user,
        display_name=display_name,
        role=role,
    )
    db.add(participant)
    db.commit()
    return participant


# Purpose: The host enters their own meeting (New Meeting / Start button).
# Input:   db; meeting; current_user - the logged-in user; display_name
# Output:  the new Participant with role host
# Errors:  MeetingEndedError; NotMeetingHostError if current_user is not this meeting's host
# How it works: no passcode needed, the host owns the meeting.
def join_meeting_as_host(
    db: Session, meeting: Meeting, current_user: User, display_name: str
) -> Participant:
    ensure_meeting_is_joinable(meeting)
    if meeting.host_id != current_user.id:
        raise NotMeetingHostError("Only the host of this meeting can join as host.")

    mark_meeting_live_if_scheduled(meeting)
    return save_new_participant(db, meeting, display_name, ParticipantRole.host, user=current_user)


# Purpose: Someone enters a meeting using the meeting ID or an invite link.
# Input:   db; meeting; display_name; passcode - typed by the user or taken from ?pwd=
# Output:  the new Participant with role participant (guest: user_id is NULL)
# Errors:  MeetingEndedError; WrongPasscodeError if the meeting has a passcode and it does not match
def join_meeting_as_guest(
    db: Session, meeting: Meeting, display_name: str, passcode: str | None
) -> Participant:
    ensure_meeting_is_joinable(meeting)
    # NULL passcode on the meeting means "no passcode required".
    if meeting.passcode is not None and passcode != meeting.passcode:
        raise WrongPasscodeError("Incorrect passcode. Check the invitation and try again.")

    mark_meeting_live_if_scheduled(meeting)
    return save_new_participant(db, meeting, display_name, ParticipantRole.participant, user=None)


# Purpose: Close a meeting: mark it ended and everyone still inside as left.
# Input:   meeting - the meeting whose host just left
# Output:  none (the caller commits)
def end_meeting(meeting: Meeting) -> None:
    now = current_utc_time()
    meeting.status = MeetingStatus.ended
    meeting.ended_at = now
    for participant in meeting.participants:
        if participant.left_at is None:
            participant.left_at = now


# Purpose: A participant leaves (Leave button, or tab closed).
# Input:   db; meeting; participant_id - the row created when this person joined
# Output:  none
# Errors:  ParticipantNotFoundError if the id is not a participant of this meeting
# How it works: stamps left_at; if the leaver is the host the meeting ends.
#   Calling it again is harmless (needed because the tab-close beacon may arrive after Leave).
def leave_meeting(db: Session, meeting: Meeting, participant_id: int) -> None:
    participant = db.get(Participant, participant_id)
    # Checking meeting_id stops someone from leaving "as" a participant of another meeting.
    if participant is None or participant.meeting_id != meeting.id:
        raise ParticipantNotFoundError("Participant not found in this meeting.")

    if participant.left_at is None:
        participant.left_at = current_utc_time()

    host_is_leaving = participant.role == ParticipantRole.host
    if host_is_leaving and meeting.status != MeetingStatus.ended:
        end_meeting(meeting)
    db.commit()


# Purpose: Who is in the meeting right now (the participants panel).
# Input:   db; meeting_id
# Output:  list of Participant in join order; excludes people who left or were removed
# How it works: one query on (meeting_id, left_at), the composite index made for this.
def fetch_active_participants(db: Session, meeting_id: int) -> list[Participant]:
    query = (
        select(Participant)
        .where(
            Participant.meeting_id == meeting_id,
            Participant.left_at.is_(None),
            Participant.removed_at.is_(None),
        )
        .order_by(Participant.joined_at, Participant.id)
    )
    return list(db.scalars(query).all())


# Purpose: Lets a removed person find out why they disappeared from the meeting.
# Input:   db; meeting_id; participant_id - may be None (a viewer that has not joined)
# Output:  True only if that participant of this meeting has been removed by the host
def has_participant_been_removed(db: Session, meeting_id: int, participant_id: int | None) -> bool:
    if participant_id is None:
        return False
    participant = db.get(Participant, participant_id)
    if participant is None or participant.meeting_id != meeting_id:
        return False
    return participant.removed_at is not None


# Purpose: Find one person who is currently inside a meeting.
# Input:   db; meeting_id; participant_id
# Output:  the Participant
# Errors:  ParticipantNotFoundError if the id does not exist, belongs to another
#          meeting, or the person already left or was removed
def fetch_active_participant(db: Session, meeting_id: int, participant_id: int) -> Participant:
    participant = db.get(Participant, participant_id)
    # Checking meeting_id stops a participant id from one meeting being used in another.
    is_active_here = (
        participant is not None
        and participant.meeting_id == meeting_id
        and participant.left_at is None
        and participant.removed_at is None
    )
    if not is_active_here:
        raise ParticipantNotFoundError("Participant is not in this meeting.")
    return participant


# Purpose: Mute or unmute microphone state of one person (the Mute / Unmute button).
# Input:   db; meeting; participant_id - the person; is_muted - the new state
# Output:  the updated Participant
# Errors:  ParticipantNotFoundError if that person is not inside the meeting
# How it works: nobody is locked out, so a person muted by "mute all" may unmute
#   themselves (Zoom lets participants unmute after the host mutes everyone).
def set_participant_muted(
    db: Session, meeting: Meeting, participant_id: int, is_muted: bool
) -> Participant:
    participant = fetch_active_participant(db, meeting.id, participant_id)
    participant.is_muted = is_muted
    db.commit()
    return participant
