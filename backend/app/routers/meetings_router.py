# =============================================================================
# File: app/routers/meetings_router.py
# Purpose: HTTP endpoints for meetings. Only handles requests/responses and
#          errors; the actual rules live in services/meeting_service.py.
# Contains:
#   - create_instant_meeting()  POST /api/meetings/instant
#   - schedule_meeting()        POST /api/meetings/schedule
#   - list_upcoming_meetings()  GET /api/meetings/upcoming
#   - list_recent_meetings()    GET /api/meetings/recent
#   - get_meeting_by_code()     GET /api/meetings/{code}
# Note: /upcoming and /recent are declared BEFORE /{code}, otherwise FastAPI
#   would treat the words "upcoming" and "recent" as meeting codes.
# =============================================================================

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api_schemas import MeetingHostResponse, MeetingPublicResponse, ScheduleMeetingRequest
from app.app_settings import DEFAULT_USER_ID
from app.database_connection import get_db_session
from app.database_models import User
from app.database_models import Meeting
from app.routers.current_user_dependency import load_default_user
from app.routers.meeting_route_helpers import convert_to_http_error, load_meeting_or_404
from app.services import meeting_service
from app.services.meeting_errors import MeetingRuleError

router = APIRouter(prefix="/api/meetings", tags=["meetings"])


# Purpose: "New Meeting" button: create a meeting that is live right now.
# Input:   none (POST /api/meetings/instant); the host is the logged-in user
# Output:  201 + MeetingHostResponse (meeting_code, passcode, invite_link ...)
@router.post("/instant", response_model=MeetingHostResponse, status_code=201)
def create_instant_meeting(host: User = Depends(load_default_user), db: Session = Depends(get_db_session)):
    meeting = meeting_service.create_instant_meeting(db, host)
    return meeting_service.to_host_meeting_response(meeting)


# Purpose: Schedule form: save a meeting for a future time.
# Input:   body ScheduleMeetingRequest (POST /api/meetings/schedule)
# Output:  201 + MeetingHostResponse; 400 if the start time is in the past;
#          422 (automatic) if a field is invalid, e.g. empty title or duration 0
@router.post("/schedule", response_model=MeetingHostResponse, status_code=201)
def schedule_meeting(
    request: ScheduleMeetingRequest,
    host: User = Depends(load_default_user),
    db: Session = Depends(get_db_session),
):
    try:
        meeting = meeting_service.create_scheduled_meeting(db, host, request)
    except MeetingRuleError as error:
        raise convert_to_http_error(error)
    return meeting_service.to_host_meeting_response(meeting)


# Purpose: Dashboard "Upcoming" section.
# Input:   none (GET /api/meetings/upcoming)
# Output:  list of MeetingHostResponse for the default user, earliest first
@router.get("/upcoming", response_model=list[MeetingHostResponse])
def list_upcoming_meetings(db: Session = Depends(get_db_session)):
    meetings = meeting_service.fetch_upcoming_meetings(db, host_id=DEFAULT_USER_ID)
    return [meeting_service.to_host_meeting_response(meeting) for meeting in meetings]


# Purpose: Dashboard "Recent" section.
# Input:   none (GET /api/meetings/recent)
# Output:  list of MeetingHostResponse for the default user, newest first
@router.get("/recent", response_model=list[MeetingHostResponse])
def list_recent_meetings(db: Session = Depends(get_db_session)):
    meetings = meeting_service.fetch_recent_meetings(db, host_id=DEFAULT_USER_ID)
    return [meeting_service.to_host_meeting_response(meeting) for meeting in meetings]


# Purpose: Validate a meeting ID on the Join screen and show its details.
# Input:   code - meeting ID in the URL; spaces allowed ("123 4567 8901")
# Output:  MeetingPublicResponse (no passcode); 404 if no such meeting
@router.get("/{code}", response_model=MeetingPublicResponse)
def get_meeting_by_code(meeting: Meeting = Depends(load_meeting_or_404)):
    return meeting_service.to_public_meeting_response(meeting)
