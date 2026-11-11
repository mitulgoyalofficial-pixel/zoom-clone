# =============================================================================
# File: app/routers/participants_router.py
# Purpose: HTTP endpoints for people inside one meeting. Only handles requests
#          and errors; the rules live in services/participant_service.py.
# Contains:
#   - join_meeting()              POST /api/meetings/{code}/join
#   - leave_meeting()             POST /api/meetings/{code}/leave?participant_id=
#   - list_active_participants()  GET  /api/meetings/{code}/participants
# =============================================================================

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.api_schemas import JoinMeetingRequest, ParticipantListResponse, ParticipantResponse
from app.database_connection import get_db_session
from app.database_models import Meeting, User
from app.routers.current_user_dependency import load_default_user
from app.routers.meeting_route_helpers import convert_to_http_error, load_meeting_or_404
from app.services import participant_service
from app.services.meeting_errors import MeetingRuleError

router = APIRouter(prefix="/api/meetings/{code}", tags=["participants"])


# Purpose: Pre-join screen "Join" button: enter the meeting.
# Input:   body JoinMeetingRequest (display_name, passcode, as_host)
# Output:  201 + ParticipantResponse (the frontend keeps its id to leave/poll later);
#          403 wrong passcode or not the host; 404 no such meeting; 409 meeting ended
@router.post("/join", response_model=ParticipantResponse, status_code=201)
def join_meeting(
    request: JoinMeetingRequest,
    meeting: Meeting = Depends(load_meeting_or_404),
    current_user: User = Depends(load_default_user),
    db: Session = Depends(get_db_session),
):
    try:
        if request.as_host:
            return participant_service.join_meeting_as_host(
                db, meeting, current_user, request.display_name
            )
        return participant_service.join_meeting_as_guest(
            db, meeting, request.display_name, request.passcode
        )
    except MeetingRuleError as error:
        raise convert_to_http_error(error)


# Purpose: Leave button (and the tab-close beacon). If the host leaves, the meeting ends.
# Input:   participant_id as a QUERY parameter, not a JSON body
# Output:  204 No Content; 404 if the participant is not in this meeting
@router.post("/leave", status_code=204)
def leave_meeting(
    participant_id: int,
    meeting: Meeting = Depends(load_meeting_or_404),
    db: Session = Depends(get_db_session),
):
    # Query parameter: navigator.sendBeacon on tab close can then send a plain POST with no
    # body, which avoids the CORS preflight a JSON body would trigger.
    try:
        participant_service.leave_meeting(db, meeting, participant_id)
    except MeetingRuleError as error:
        raise convert_to_http_error(error)
    return Response(status_code=204)


# Purpose: The room polls this every few seconds for the participants panel.
# Input:   optional query participant_id = the asking participant (to learn if they were removed)
# Output:  ParticipantListResponse (meeting_status, participants, was_removed)
@router.get("/participants", response_model=ParticipantListResponse)
def list_active_participants(
    participant_id: int | None = None,
    meeting: Meeting = Depends(load_meeting_or_404),
    db: Session = Depends(get_db_session),
):
    participants = participant_service.fetch_active_participants(db, meeting.id)
    was_removed = participant_service.has_participant_been_removed(db, meeting.id, participant_id)
    return ParticipantListResponse(
        meeting_status=meeting.status,
        participants=participants,
        was_removed=was_removed,
    )
