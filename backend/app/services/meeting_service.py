# =============================================================================
# File: app/services/meeting_service.py
# Purpose: Business logic for meetings (the "rules" of the app).
#          Routers only handle HTTP and call these functions; this layer is
#          the only place that decides how meetings are created/found/built.
# Contains:
#   - generate_meeting_code(), generate_passcode(): new meeting credentials
#   - create_instant_meeting(), create_scheduled_meeting(): make new meetings
#   - normalize_meeting_code(): "123 4567 8901" -> "12345678901"
#   - fetch_meeting_by_code(), fetch_upcoming_meetings(), fetch_recent_meetings()
#   - calculate_scheduled_end_time(), build_invite_link()
#   - ensure_user_hosts_meeting(), delete_meeting(): host-only actions on one meeting
#   - to_public_meeting_response(), to_host_meeting_response(): DB object -> API shape
# =============================================================================

import secrets
import string
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.api_schemas import MeetingHostResponse, MeetingPublicResponse, ScheduleMeetingRequest
from app.app_settings import FRONTEND_URL
from app.database_models import Meeting, MeetingStatus, MeetingType, User, current_utc_time
from app.services.meeting_errors import InvalidMeetingRequestError, NotMeetingHostError

# Letters + digits, like Zoom passcodes (e.g. "aB3xY9").
PASSCODE_ALPHABET = string.ascii_letters + string.digits
RECENT_MEETINGS_LIMIT = 20
# A time picker only has minute precision, so "right now" is often a few seconds in the past.
START_TIME_GRACE_MINUTES = 5


# Purpose: Create a meeting ID that no other meeting uses.
# Input:   db - open database session (to check for collisions)
# Output:  11-digit string, e.g. "84512367790"
# How it works: builds 1 random digit 1-9 + 10 random digits 0-9, then
#   checks the meetings table; if the code exists, tries again.
def generate_meeting_code(db: Session) -> str:
    while True:
        # First digit 1-9 so the code never starts with 0 and always shows 11 digits.
        first_digit = str(secrets.randbelow(9) + 1)
        other_digits = "".join(str(secrets.randbelow(10)) for _ in range(10))
        code = first_digit + other_digits

        # Collision is very unlikely (9 * 10^10 codes) but we check to guarantee uniqueness.
        existing_id = db.scalar(select(Meeting.id).where(Meeting.meeting_code == code))
        if existing_id is None:
            return code


# Purpose: Create a passcode for a new meeting.
# Input:   none
# Output:  6-character string of letters and digits, e.g. "aB3xY9"
# How it works: picks 6 random characters from PASSCODE_ALPHABET.
def generate_passcode() -> str:
    # `secrets` (not `random`) because a passcode must not be predictable.
    return "".join(secrets.choice(PASSCODE_ALPHABET) for _ in range(6))


# Purpose: Convert any date-time into the form we store: naive UTC.
# Input:   moment - with a timezone (converted to UTC) or without one
# Output:  datetime in UTC with no tzinfo
def convert_to_naive_utc(moment: datetime) -> datetime:
    # No timezone given: assume the caller already meant UTC.
    if moment.tzinfo is None:
        return moment
    return moment.astimezone(timezone.utc).replace(tzinfo=None)


# Purpose: Start a meeting right now ("New Meeting" button).
# Input:   db - open session; host - the user starting it
# Output:  the saved Meeting: type instant, status live, started now, with a passcode
# How it works: title is "<name>'s Zoom Meeting" like Zoom; commits immediately.
def create_instant_meeting(db: Session, host: User) -> Meeting:
    meeting = Meeting(
        meeting_code=generate_meeting_code(db),
        title=f"{host.name}'s Zoom Meeting",
        host=host,
        meeting_type=MeetingType.instant,
        # Live straight away: the host is about to enter the room.
        status=MeetingStatus.live,
        started_at=current_utc_time(),
        passcode=generate_passcode(),
    )
    db.add(meeting)
    db.commit()
    return meeting


# Purpose: Save a meeting scheduled for later (Schedule form).
# Input:   db - open session; host - the user scheduling it;
#          request - validated form data (title, description, start, duration, passcode flag)
# Output:  the saved Meeting with status scheduled
# Errors:  InvalidMeetingRequestError if the start time is in the past
def create_scheduled_meeting(db: Session, host: User, request: ScheduleMeetingRequest) -> Meeting:
    start_time = convert_to_naive_utc(request.scheduled_start)
    earliest_allowed_start = current_utc_time() - timedelta(minutes=START_TIME_GRACE_MINUTES)
    if start_time < earliest_allowed_start:
        raise InvalidMeetingRequestError("The meeting start time is in the past. Pick a time from now onwards.")

    meeting = Meeting(
        meeting_code=generate_meeting_code(db),
        title=request.title,
        description=request.description,
        host=host,
        meeting_type=MeetingType.scheduled,
        scheduled_start=start_time,
        duration_minutes=request.duration_minutes,
        # NULL passcode means "no passcode required" (checkbox unticked).
        passcode=generate_passcode() if request.has_passcode else None,
        status=MeetingStatus.scheduled,
    )
    db.add(meeting)
    db.commit()
    return meeting


# Purpose: Turn what a user typed or pasted into a bare meeting code.
# Input:   raw_code - e.g. "123 4567 8901" or "123-4567-8901"
# Output:  digits only, e.g. "12345678901"
# How it works: keeps only the digit characters.
def normalize_meeting_code(raw_code: str) -> str:
    return "".join(character for character in raw_code if character.isdigit())


# Purpose: Look up one meeting by its meeting code.
# Input:   db - open session; raw_code - code as typed (spaces allowed)
# Output:  the Meeting (with its host loaded), or None if it does not exist
# How it works: normalizes the code, then runs one indexed query.
def fetch_meeting_by_code(db: Session, raw_code: str) -> Meeting | None:
    meeting_code = normalize_meeting_code(raw_code)
    query = (
        select(Meeting)
        .where(Meeting.meeting_code == meeting_code)
        # joinedload fetches the host in the same query (host name is shown in the response).
        .options(joinedload(Meeting.host))
    )
    return db.scalar(query)


# Purpose: When a scheduled meeting is supposed to finish.
# Input:   meeting - a scheduled Meeting (scheduled_start is set)
# Output:  datetime (UTC) = scheduled_start + duration
def calculate_scheduled_end_time(meeting: Meeting) -> datetime:
    return meeting.scheduled_start + timedelta(minutes=meeting.duration_minutes)


# Purpose: The host's "Upcoming" list: scheduled meetings that have not finished yet.
# Input:   db - open session; host_id - whose meetings to list
# Output:  list of Meeting, earliest start first
# How it works: SQL narrows to scheduled, not-ended meetings of this host;
#   Python then drops those whose end time has passed.
def fetch_upcoming_meetings(db: Session, host_id: int) -> list[Meeting]:
    query = (
        select(Meeting)
        .where(
            Meeting.host_id == host_id,
            Meeting.meeting_type == MeetingType.scheduled,
            Meeting.status != MeetingStatus.ended,
        )
        .order_by(Meeting.scheduled_start)
        .options(joinedload(Meeting.host))
    )
    scheduled_meetings = db.scalars(query).all()

    # Filtered in Python: "start + duration" arithmetic is awkward in SQLite, and one host has few meetings.
    now = current_utc_time()
    return [m for m in scheduled_meetings if calculate_scheduled_end_time(m) > now]


# Purpose: The host's "Recent" list: meetings that actually started, newest first.
# Input:   db - open session; host_id - whose meetings to list
# Output:  list of Meeting (at most RECENT_MEETINGS_LIMIT)
def fetch_recent_meetings(db: Session, host_id: int) -> list[Meeting]:
    query = (
        select(Meeting)
        .where(Meeting.host_id == host_id, Meeting.started_at.is_not(None))
        .order_by(Meeting.started_at.desc())
        .limit(RECENT_MEETINGS_LIMIT)
        .options(joinedload(Meeting.host))
    )
    return list(db.scalars(query).all())


# Purpose: The shareable link for a meeting.
# Input:   meeting - any Meeting
# Output:  e.g. "http://localhost:3000/join/12345678901?pwd=aB3xY9"
#          (no ?pwd= part when the meeting has no passcode)
def build_invite_link(meeting: Meeting) -> str:
    invite_link = f"{FRONTEND_URL}/join/{meeting.meeting_code}"
    if meeting.passcode:
        # Passcodes are letters and digits only, so no URL-encoding is needed.
        invite_link += f"?pwd={meeting.passcode}"
    return invite_link


# Purpose: Collect the fields shared by both meeting response shapes.
# Input:   meeting - a Meeting with its host loaded
# Output:  dict of field name -> value (passcode deliberately left out)
def get_public_meeting_fields(meeting: Meeting) -> dict:
    return {
        "id": meeting.id,
        "meeting_code": meeting.meeting_code,
        "title": meeting.title,
        "description": meeting.description,
        "host_name": meeting.host.name,
        "meeting_type": meeting.meeting_type,
        "status": meeting.status,
        "scheduled_start": meeting.scheduled_start,
        "duration_minutes": meeting.duration_minutes,
        "has_passcode": meeting.passcode is not None,
        "started_at": meeting.started_at,
        "ended_at": meeting.ended_at,
    }


# Purpose: Convert a Meeting to the shape anyone with the meeting ID may see.
# Output:  MeetingPublicResponse (no passcode)
def to_public_meeting_response(meeting: Meeting) -> MeetingPublicResponse:
    return MeetingPublicResponse(**get_public_meeting_fields(meeting))


# Purpose: Convert a Meeting to the host's view (adds passcode and invite link).
# Output:  MeetingHostResponse
def to_host_meeting_response(meeting: Meeting) -> MeetingHostResponse:
    return MeetingHostResponse(
        **get_public_meeting_fields(meeting),
        passcode=meeting.passcode,
        invite_link=build_invite_link(meeting),
    )


# Purpose: Refuse an action that only the meeting's host may do.
# Input:   meeting - the meeting; user - the logged-in user
# Output:  none; raises NotMeetingHostError if the user is not this meeting's host
def ensure_user_hosts_meeting(meeting: Meeting, user: User) -> None:
    if meeting.host_id != user.id:
        raise NotMeetingHostError("Only the host of this meeting can do this.")


# Purpose: Delete a meeting (the details page "Delete" button).
# Input:   db - open session; meeting - the meeting; user - the logged-in user (must be the host)
# Output:  none
# Errors:  NotMeetingHostError if the user is not the host
# How it works: deleting the meeting row also deletes its participants (ON DELETE CASCADE).
def delete_meeting(db: Session, meeting: Meeting, user: User) -> None:
    ensure_user_hosts_meeting(meeting, user)
    db.delete(meeting)
    db.commit()
