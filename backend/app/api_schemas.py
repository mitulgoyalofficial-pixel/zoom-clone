# =============================================================================
# File: app/api_schemas.py
# Purpose: Defines the exact JSON shapes the API sends and receives (Pydantic).
#          Kept separate from database_models.py so a database column (for
#          example the passcode) is never exposed by accident.
# Contains:
#   - UtcDatetime: datetime type that is sent as an ISO string ending in "Z"
#   - UserResponse: the logged-in user (GET /api/me)
#   - MeetingPublicResponse: what anyone who knows a meeting ID may see
#   - MeetingHostResponse: public fields + passcode + invite link, only for
#                          the host's own dashboard lists
#   - ScheduleMeetingRequest: body of the Schedule form (POST .../schedule)
#   - JoinMeetingRequest, ParticipantResponse, ParticipantListResponse: join flow
#   - SetMutedRequest: body of the self mute/unmute call
# =============================================================================

from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer

from app.database_models import MeetingStatus, MeetingType, ParticipantRole

# Zoom's own limit for one meeting is 24 hours.
MAX_DURATION_MINUTES = 24 * 60

# Times are stored as naive UTC. Without the "Z" suffix the browser's
# new Date() would read them as LOCAL time and show the wrong hour.
UtcDatetime = Annotated[
    datetime, PlainSerializer(lambda moment: moment.isoformat() + "Z", return_type=str)
]


# Purpose: The current user, shown in the navbar profile.
# Fields: id, name, email, avatar_color (hex, used for the initials circle).
class UserResponse(BaseModel):
    # from_attributes lets Pydantic read fields straight off a database object.
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    avatar_color: str


# Purpose: Meeting details safe to show to anyone who knows the meeting ID
#   (for example on the join screen). Has has_passcode instead of the passcode.
class MeetingPublicResponse(BaseModel):
    id: int
    meeting_code: str
    title: str
    description: str | None
    host_name: str
    meeting_type: MeetingType
    status: MeetingStatus
    scheduled_start: UtcDatetime | None
    duration_minutes: int
    has_passcode: bool
    started_at: UtcDatetime | None
    ended_at: UtcDatetime | None


# Purpose: Meeting details for the host's own dashboard (Upcoming / Recent).
#   Adds the passcode and the ready-to-share invite link (copy invitation).
class MeetingHostResponse(MeetingPublicResponse):
    passcode: str | None
    invite_link: str


# Purpose: Body of POST /api/meetings/schedule (the Schedule form).
# Fields:
#   title            - required, 1-200 characters (spaces around it are trimmed)
#   description      - optional text
#   scheduled_start  - ISO date-time; with a timezone ("...Z" or "+05:30") or,
#                      if none is given, taken as UTC
#   duration_minutes - 1 to 1440
#   has_passcode     - Zoom's "Passcode" checkbox; on by default
class ScheduleMeetingRequest(BaseModel):
    # Trims spaces so a title of only spaces is rejected by min_length.
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    scheduled_start: datetime
    duration_minutes: int = Field(ge=1, le=MAX_DURATION_MINUTES)
    has_passcode: bool = True


# Purpose: Body of POST /api/meetings/{code}/join (the pre-join screen).
# Fields:
#   display_name - name shown to others, 1-100 characters (trimmed)
#   passcode     - what the guest typed; not needed for the host, or when the
#                  invite link already carried ?pwd=
#   as_host      - true only when the host starts their own meeting
class JoinMeetingRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    display_name: str = Field(min_length=1, max_length=100)
    passcode: str | None = None
    as_host: bool = False


# Purpose: One person in a meeting, as shown in the participants panel.
class ParticipantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    display_name: str
    role: ParticipantRole
    is_muted: bool
    joined_at: UtcDatetime


# Purpose: Answer of the participants poll (GET .../participants).
# Fields:
#   meeting_status - "ended" tells everyone the host has left
#   participants   - people currently in the meeting, in join order
#   was_removed    - true if the asking participant was removed by the host
class ParticipantListResponse(BaseModel):
    meeting_status: MeetingStatus
    participants: list[ParticipantResponse]
    was_removed: bool


# Purpose: Body of PATCH .../participants/{id}: a person mutes or unmutes themselves.
class SetMutedRequest(BaseModel):
    is_muted: bool
