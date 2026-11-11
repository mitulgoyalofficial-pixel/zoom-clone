# =============================================================================
# File: app/routers/meetings_router.py
# Purpose: HTTP endpoints for meetings. Only handles requests/responses and
#          errors; the actual rules live in services/meeting_service.py.
# Contains (read endpoints so far):
#   - list_upcoming_meetings()  GET /api/meetings/upcoming
#   - list_recent_meetings()    GET /api/meetings/recent
#   - get_meeting_by_code()     GET /api/meetings/{code}
# Note: /upcoming and /recent are declared BEFORE /{code}, otherwise FastAPI
#   would treat the words "upcoming" and "recent" as meeting codes.
# =============================================================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api_schemas import MeetingHostResponse, MeetingPublicResponse
from app.app_settings import DEFAULT_USER_ID
from app.database_connection import get_db_session
from app.services import meeting_service

router = APIRouter(prefix="/api/meetings", tags=["meetings"])


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
def get_meeting_by_code(code: str, db: Session = Depends(get_db_session)):
    meeting = meeting_service.fetch_meeting_by_code(db, code)
    if meeting is None:
        raise HTTPException(
            status_code=404,
            detail="Meeting not found. Check the meeting ID and try again.",
        )
    return meeting_service.to_public_meeting_response(meeting)
