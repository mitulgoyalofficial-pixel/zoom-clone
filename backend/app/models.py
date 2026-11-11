# =============================================================================
# File: app/models.py
# Purpose: Defines the database schema as SQLAlchemy ORM classes.
#          One class = one table, one attribute = one column.
# Contains:
#   - Enums: MeetingType, MeetingStatus, ParticipantRole
#   - Tables: User (users), Meeting (meetings), Participant (participants)
#   - Relationships: user.hosted_meetings, user.participations,
#                    meeting.host, meeting.participants,
#                    participant.meeting, participant.user
#   - Constraints: UNIQUE, FOREIGN KEY, CHECK and indexes
# Relationships:
#   users 1 --- * meetings       (a user hosts many meetings)
#   meetings 1 --- * participants (a meeting has many attendance rows)
#   users 1 --- * participants   (optional: guests have user_id NULL)
# =============================================================================

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# Purpose: Get the current time for storing in the database.
# Input:   none
# Output:  datetime in UTC without tzinfo (e.g. 2026-11-11 10:30:00)
# How it works: takes the aware UTC time and strips tzinfo, because SQLite
#   has no timezone type. All DB times are UTC; the frontend shows local time.
def current_utc_time() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


# --- Enums -------------------------------------------------------------------
# Member names equal their values, so the DB stores readable strings like "live".

# Purpose: How a meeting was created.
#   instant   - started right away via "New Meeting"
#   scheduled - created via "Schedule" for a future time
class MeetingType(str, enum.Enum):
    instant = "instant"
    scheduled = "scheduled"


# Purpose: Lifecycle state of a meeting.
#   scheduled -> live (first join) -> ended (host leaves)
class MeetingStatus(str, enum.Enum):
    scheduled = "scheduled"
    live = "live"
    ended = "ended"


# Purpose: A participant's role in one meeting (host has mute-all / remove).
class ParticipantRole(str, enum.Enum):
    host = "host"
    participant = "participant"


# Purpose: Build a column type for a Python enum that works on SQLite.
# Input:   enum_class - one of the Enum classes above
# Output:  SQLAlchemy Enum column type
# How it works: SQLite has no ENUM type, so native_enum=False stores it as
#   VARCHAR(20), and create_constraint=True adds a CHECK (col IN (...)) so
#   the database itself rejects invalid values.
def string_enum_column(enum_class):
    return Enum(enum_class, native_enum=False, create_constraint=True, length=20)


# --- Tables ------------------------------------------------------------------

# Purpose: A registered person. No login in this app: user id=1 is always
#   the "logged in" user. Other users exist for seeded meeting history.
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    # Hex colour for the initials avatar, e.g. "#0B5CFF".
    avatar_color: Mapped[str] = mapped_column(String(7))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=current_utc_time)

    hosted_meetings: Mapped[list["Meeting"]] = relationship(back_populates="host")
    participations: Mapped[list["Participant"]] = relationship(back_populates="user")


# Purpose: One meeting (instant or scheduled).
#   "Upcoming" and "Recent" lists are derived from this table by query.
#   The invite link is not stored: it is built from meeting_code + passcode.
class Meeting(Base):
    __tablename__ = "meetings"
    __table_args__ = (
        CheckConstraint("duration_minutes > 0", name="ck_meetings_duration_positive"),
        # A scheduled meeting must have a start time; an instant one does not need it.
        CheckConstraint(
            "meeting_type = 'instant' OR scheduled_start IS NOT NULL",
            name="ck_meetings_scheduled_has_start",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # 11 digits stored as text: never used in maths, and text keeps it exact.
    meeting_code: Mapped[str] = mapped_column(String(11), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Indexed because "Recent" filters meetings by host.
    host_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    meeting_type: Mapped[MeetingType] = mapped_column(string_enum_column(MeetingType))
    scheduled_start: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    # 40 minutes: Zoom's default meeting length.
    duration_minutes: Mapped[int] = mapped_column(Integer, default=40)
    # NULL = no passcode required.
    passcode: Mapped[str | None] = mapped_column(String(10), nullable=True)
    status: Mapped[MeetingStatus] = mapped_column(string_enum_column(MeetingStatus))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=current_utc_time)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    host: Mapped["User"] = relationship(back_populates="hosted_meetings")
    # passive_deletes=True: the DB's ON DELETE CASCADE removes participants,
    # instead of SQLAlchemy loading and deleting them one by one.
    participants: Mapped[list["Participant"]] = relationship(
        back_populates="meeting", cascade="all, delete-orphan", passive_deletes=True
    )


# Purpose: One person's attendance in one meeting.
#   Every join inserts a new row (rejoining does not reuse the old one).
#   Active participant = left_at IS NULL AND removed_at IS NULL.
class Participant(Base):
    __tablename__ = "participants"
    __table_args__ = (
        # Serves the polling query (meeting_id = ? AND left_at IS NULL); as the
        # first column is meeting_id, it also covers lookups by meeting alone.
        Index("ix_participants_meeting_left", "meeting_id", "left_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # CASCADE: deleting a meeting deletes its attendance rows.
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id", ondelete="CASCADE"))
    # NULL = guest. SET NULL: if a user is deleted, keep the row as a guest.
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    display_name: Mapped[str] = mapped_column(String(100))
    role: Mapped[ParticipantRole] = mapped_column(string_enum_column(ParticipantRole))
    is_muted: Mapped[bool] = mapped_column(Boolean, default=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=current_utc_time)
    left_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    # Separate from left_at so a removed person's next poll can tell them why.
    removed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    meeting: Mapped["Meeting"] = relationship(back_populates="participants")
    user: Mapped["User | None"] = relationship(back_populates="participations")
