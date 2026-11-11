# =============================================================================
# File: app/services/meeting_errors.py
# Purpose: The error types the services raise when a request breaks a meeting
#          rule. Services stay independent of HTTP; the routers translate each
#          error into a status code (see routers/meeting_route_helpers.py).
# Contains: MeetingRuleError (base) and one subclass per rule.
# =============================================================================


# Purpose: Base class: "this request is not allowed by the meeting rules".
#   The message is written for the end user and is shown by the frontend.
class MeetingRuleError(Exception):
    pass


# Purpose: The request itself is unacceptable (e.g. a start time in the past).
class InvalidMeetingRequestError(MeetingRuleError):
    pass


# Purpose: A guest gave a missing or wrong passcode.
class WrongPasscodeError(MeetingRuleError):
    pass


# Purpose: Someone tried to act as the host of a meeting they do not host.
class NotMeetingHostError(MeetingRuleError):
    pass


# Purpose: The meeting is over, so nobody can join it any more.
class MeetingEndedError(MeetingRuleError):
    pass


# Purpose: The participant id does not exist in this meeting.
class ParticipantNotFoundError(MeetingRuleError):
    pass
