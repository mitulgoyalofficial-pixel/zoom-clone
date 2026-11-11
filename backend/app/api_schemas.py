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
# =============================================================================

from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, PlainSerializer

from app.database_models import MeetingStatus, MeetingType

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
