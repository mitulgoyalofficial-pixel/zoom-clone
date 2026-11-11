# =============================================================================
# File: app/routers/meeting_route_helpers.py
# Purpose: Small pieces shared by every router that works on one meeting
#          (meetings_router.py, participants_router.py), so they are written once.
# Contains:
#   - load_meeting_or_404(): FastAPI dependency that finds the meeting in the URL
#   - convert_to_http_error(): turns a MeetingRuleError into an HTTPException
# =============================================================================

from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.database_connection import get_db_session
from app.database_models import Meeting
from app.services import meeting_service
from app.services.meeting_errors import (
    InvalidMeetingRequestError,
    MeetingEndedError,
    MeetingRuleError,
    NotMeetingHostError,
    ParticipantNotFoundError,
    WrongPasscodeError,
)

# One table instead of an if/elif chain: which HTTP status each rule error means.
STATUS_CODE_BY_ERROR = {
    InvalidMeetingRequestError: 400,
    WrongPasscodeError: 403,
    NotMeetingHostError: 403,
    MeetingEndedError: 409,
    ParticipantNotFoundError: 404,
}


# Purpose: Find the meeting named in the URL ("/api/meetings/{code}/...").
# Input:   code - from the URL, spaces allowed; db - injected session
# Output:  the Meeting; raises 404 "Meeting not found..." if there is none
def load_meeting_or_404(code: str, db: Session = Depends(get_db_session)) -> Meeting:
    meeting = meeting_service.fetch_meeting_by_code(db, code)
    if meeting is None:
        raise HTTPException(
            status_code=404,
            detail="Meeting not found. Check the meeting ID and try again.",
        )
    return meeting


# Purpose: Convert a service-level rule error into the HTTP error to send back.
# Input:   error - any MeetingRuleError raised by a service
# Output:  HTTPException (use as: raise convert_to_http_error(error))
# How it works: looks the error class up in STATUS_CODE_BY_ERROR; the message is passed on.
def convert_to_http_error(error: MeetingRuleError) -> HTTPException:
    status_code = STATUS_CODE_BY_ERROR.get(type(error), 400)
    return HTTPException(status_code=status_code, detail=str(error))
