# =============================================================================
# File: app/sample_data_seeder.py
# Purpose: Fills an empty database with sample data on startup, so the
#          dashboard has Upcoming and Recent meetings to show.
# Contains:
#   - seed_database_if_empty(): entry point called from main.py
#   - refresh_sample_upcoming_meetings_if_none(): keeps "Upcoming" from going empty
#   - add_sample_upcoming_meetings(): the three sample scheduled meetings
#   - helpers to create scheduled and past meetings
# Data created: 5 users (id=1 is the default "logged in" user),
#   3 upcoming scheduled meetings, 3 past meetings with participants.
# Key point: all dates are relative to "now". The database keeps its data (Postgres in
#   production), so the sample upcoming meetings slowly move into the past; when none are
#   left, startup adds them again with fresh dates (refresh_sample_upcoming_meetings_if_none).
# =============================================================================

from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database_models import (
    Meeting,
    MeetingStatus,
    MeetingType,
    Participant,
    ParticipantRole,
    User,
    current_utc_time,
)
from app.app_settings import DEFAULT_USER_ID
from app.services.meeting_service import fetch_upcoming_meetings, generate_meeting_code, generate_passcode


# Purpose: Make seeded start times look like real ones (10:00, 10:30...).
# Input:   moment - any datetime, e.g. 10:17:42
# Output:  next :00 or :30 after it, e.g. 10:30:00
# How it works: drops seconds, then adds the minutes left until the next
#   multiple of 30.
def round_up_to_next_half_hour(moment: datetime) -> datetime:
    moment = moment.replace(second=0, microsecond=0)
    minutes_to_add = 30 - moment.minute % 30
    return moment + timedelta(minutes=minutes_to_add)


# Purpose: Insert one future scheduled meeting (shows in "Upcoming").
# Input:   db, host user, title, description (or None), start time (UTC),
#          duration in minutes
# Output:  the new Meeting object
# How it works: builds a Meeting with status "scheduled", a fresh meeting
#   code and passcode, adds it to the session and flushes.
def add_scheduled_meeting(db: Session, host: User, title: str, description: str | None,
                          start: datetime, duration: int) -> Meeting:
    meeting = Meeting(
        meeting_code=generate_meeting_code(db),
        title=title,
        description=description,
        host=host,
        meeting_type=MeetingType.scheduled,
        scheduled_start=start,
        duration_minutes=duration,
        passcode=generate_passcode(),
        status=MeetingStatus.scheduled,
    )
    db.add(meeting)
    # Flush so the next generate_meeting_code() sees this code (autoflush is off).
    db.flush()
    return meeting


# Purpose: Insert one meeting that already happened (shows in "Recent"),
#   together with its attendance rows.
# Input:   db, host user, title, meeting type, start time (UTC), duration,
#          attendees (registered users), guest_names (people without account)
# Output:  the new Meeting object
# How it works: creates an "ended" Meeting, then one Participant row for the
#   host, one per attendee and one per guest (user_id NULL), all leaving
#   when the meeting ended.
def add_past_meeting(db: Session, host: User, title: str, meeting_type: MeetingType,
                     started: datetime, duration: int,
                     attendees: list[User], guest_names: list[str]) -> Meeting:
    ended = started + timedelta(minutes=duration)
    meeting = Meeting(
        meeting_code=generate_meeting_code(db),
        title=title,
        host=host,
        meeting_type=meeting_type,
        # The CHECK constraint requires a start time for scheduled meetings only.
        scheduled_start=started if meeting_type == MeetingType.scheduled else None,
        duration_minutes=duration,
        passcode=generate_passcode(),
        status=MeetingStatus.ended,
        created_at=started - timedelta(days=1),
        started_at=started,
        ended_at=ended,
    )
    meeting.participants.append(Participant(
        user=host, display_name=host.name, role=ParticipantRole.host,
        joined_at=started, left_at=ended,
    ))
    # Stagger join times by a minute each so the data looks realistic.
    for minutes_late, user in enumerate(attendees, start=1):
        meeting.participants.append(Participant(
            user=user, display_name=user.name, role=ParticipantRole.participant,
            joined_at=started + timedelta(minutes=minutes_late), left_at=ended,
        ))
    for name in guest_names:
        meeting.participants.append(Participant(
            user=None, display_name=name, role=ParticipantRole.participant,
            joined_at=started + timedelta(minutes=2), left_at=ended,
        ))
    db.add(meeting)
    db.flush()
    return meeting


# Purpose: Insert the three sample scheduled meetings for a host (shown in "Upcoming").
# Input:   db - open session; host - the user who hosts them
# Output:  None (flushes, the caller commits)
# How it works: start times count from the next half hour, so they are always in the future.
def add_sample_upcoming_meetings(db: Session, host: User) -> None:
    soon = round_up_to_next_half_hour(current_utc_time())
    add_scheduled_meeting(db, host, "Sprint Planning",
                          "Plan stories and estimates for the next sprint.",
                          soon + timedelta(hours=2), 60)
    add_scheduled_meeting(db, host, "Design Review",
                          "Walk through the new dashboard mockups.",
                          soon + timedelta(days=1), 45)
    add_scheduled_meeting(db, host, "1:1 with Priya", None,
                          soon + timedelta(days=3), 30)


# Purpose: Keep the dashboard's "Upcoming" section from going empty on a long-running deployment.
# Input:   db - open session
# Output:  None (commits only when it adds meetings)
# How it works: if the default user has no upcoming meeting at all, the three sample ones are
#   added again with fresh dates. If at least one upcoming meeting exists, nothing happens.
def refresh_sample_upcoming_meetings_if_none(db: Session) -> None:
    host = db.get(User, DEFAULT_USER_ID)
    if host is None or fetch_upcoming_meetings(db, host.id):
        return
    add_sample_upcoming_meetings(db, host)
    db.commit()


# Purpose: Entry point: insert all sample data, but only into an empty DB.
# Input:   db - open database session
# Output:  None (commits the sample data)
# How it works: returns early if any user exists; otherwise creates users,
#   then upcoming meetings, then past meetings, and commits once at the end.
def seed_database_if_empty(db: Session) -> None:
    # Skip if already seeded, so restarts don't create duplicates.
    if db.scalar(select(User.id).limit(1)) is not None:
        return

    # Inserted first, so it gets id=1: the default "logged in" user.
    # Purple like the default Zoom avatar in the reference screenshots.
    me = User(name="Mitul Goyal", email="mitul.goyal@example.com", avatar_color="#A94BC0")
    priya = User(name="Priya Sharma", email="priya.sharma@example.com", avatar_color="#E8590C")
    rahul = User(name="Rahul Verma", email="rahul.verma@example.com", avatar_color="#2F9E44")
    ananya = User(name="Ananya Iyer", email="ananya.iyer@example.com", avatar_color="#AE3EC9")
    david = User(name="David Chen", email="david.chen@example.com", avatar_color="#1098AD")
    db.add_all([me, priya, rahul, ananya, david])
    db.flush()

    now = current_utc_time()

    # Upcoming (scheduled, in the future)
    add_sample_upcoming_meetings(db, me)

    # Recent (already happened)
    add_past_meeting(db, me, "Mitul Goyal's Zoom Meeting", MeetingType.instant,
                     now - timedelta(hours=4), 20,
                     attendees=[rahul], guest_names=[])
    add_past_meeting(db, me, "Weekly Team Sync", MeetingType.scheduled,
                     now - timedelta(days=1), 45,
                     attendees=[priya, rahul, ananya], guest_names=[])
    add_past_meeting(db, me, "Client Demo Prep", MeetingType.scheduled,
                     now - timedelta(days=2), 30,
                     attendees=[david], guest_names=["Sam (Guest)"])

    # One commit for everything: either all sample data is saved or none.
    db.commit()
