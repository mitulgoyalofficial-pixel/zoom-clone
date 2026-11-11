// =============================================================================
// File: lib/apiClient.ts
// Purpose: The ONLY place in the frontend that talks to the FastAPI backend.
//          Components call these named functions and never use fetch directly.
// Contains:
//   - ApiError: the error thrown for any failed call (carries a user-friendly message)
//   - sendRequest(): shared fetch + error handling
//   - fetchCurrentUser, fetchUpcomingMeetings, fetchRecentMeetings, fetchMeetingByCode,
//     fetchMeetingDetails, createInstantMeeting, scheduleMeeting, deleteMeeting,
//     joinMeeting, fetchParticipants, setParticipantMuted, muteAllParticipants, removeParticipant,
//     leaveMeeting, buildLeaveUrl
// Setup: the backend address comes from NEXT_PUBLIC_API_URL (frontend/.env.local).
// =============================================================================

import type {
  HostMeeting,
  JoinMeetingRequest,
  Participant,
  ParticipantList,
  PublicMeeting,
  ScheduleMeetingRequest,
  User,
} from "@/lib/apiTypes";

// NEXT_PUBLIC_ prefix makes Next.js copy the value into the browser bundle at build time.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const NETWORK_ERROR_MESSAGE = "Cannot reach the server. Check your connection and try again.";
const UNKNOWN_ERROR_MESSAGE = "Something went wrong. Please try again.";

// Purpose: An API call failed. `message` is safe to show to the user as it is.
// Fields:  status - HTTP status (0 when the server could not be reached at all)
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Purpose: Pull a readable message out of an error response from the backend.
// Input:   response - a non-OK fetch Response
// Output:  the message text
// How it works: FastAPI sends {"detail": "text"} for our own errors and
//   {"detail": [{"msg": "..."}]} for validation errors (422).
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body.detail === "string") {
      return body.detail;
    }
    if (Array.isArray(body.detail) && body.detail.length > 0 && typeof body.detail[0].msg === "string") {
      return body.detail[0].msg;
    }
  } catch {
    // The body was not JSON: fall through to the generic message.
  }
  return UNKNOWN_ERROR_MESSAGE;
}

// Purpose: Call one backend endpoint and return its JSON.
// Input:   path - e.g. "/api/me"; method - defaults to GET; body - optional object sent as JSON
// Output:  the parsed JSON as type T (undefined for a 204 No Content answer)
// Errors:  throws ApiError, both for HTTP errors and when the server is unreachable
async function sendRequest<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // fetch only throws when no response arrived at all (server down, offline, CORS blocked).
    throw new ApiError(0, NETWORK_ERROR_MESSAGE);
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

// Purpose: Load the logged-in user (navbar avatar, profile card).
export function fetchCurrentUser(): Promise<User> {
  return sendRequest<User>("/api/me");
}

// Purpose: Load the "Upcoming" meetings of the logged-in user, earliest first.
export function fetchUpcomingMeetings(): Promise<HostMeeting[]> {
  return sendRequest<HostMeeting[]>("/api/meetings/upcoming");
}

// Purpose: Load the "Recent" meetings of the logged-in user, newest first.
export function fetchRecentMeetings(): Promise<HostMeeting[]> {
  return sendRequest<HostMeeting[]>("/api/meetings/recent");
}

// Purpose: Look up one meeting by its ID (used to validate the ID on the join screen).
// Input:   meetingCode - digits, spaces allowed ("123 4567 8901")
// Output:  the meeting; throws ApiError with status 404 if it does not exist
export function fetchMeetingByCode(meetingCode: string): Promise<PublicMeeting> {
  return sendRequest<PublicMeeting>(`/api/meetings/${encodeURIComponent(meetingCode)}`);
}

// Purpose: "New Meeting": start an instant meeting as the logged-in user.
// Output:  the created meeting with its meeting_code, passcode and invite_link
export function createInstantMeeting(): Promise<HostMeeting> {
  return sendRequest<HostMeeting>("/api/meetings/instant", "POST");
}

// Purpose: Load everything about one meeting for the details page, including passcode and invite link.
// Input:   meetingCode - digits, spaces allowed
// Output:  the host's view of the meeting; throws ApiError 403 if the user is not the host, 404 if unknown
export function fetchMeetingDetails(meetingCode: string): Promise<HostMeeting> {
  return sendRequest<HostMeeting>(`/api/meetings/${encodeURIComponent(meetingCode)}/details`);
}

// Purpose: Save the Schedule form as a meeting.
// Input:   request - topic, optional description, start time (ISO with time zone), duration, passcode flag
// Output:  the saved meeting; throws ApiError 400 (e.g. start time in the past) or 422 (invalid field)
export function scheduleMeeting(request: ScheduleMeetingRequest): Promise<HostMeeting> {
  return sendRequest<HostMeeting>("/api/meetings/schedule", "POST", request);
}

// Purpose: The details page "Delete" button.
// Input:   meetingCode - the meeting to delete (host only)
// Output:  nothing; throws ApiError 403 if the user is not the host, 404 if unknown
export function deleteMeeting(meetingCode: string): Promise<void> {
  return sendRequest<void>(`/api/meetings/${encodeURIComponent(meetingCode)}`, "DELETE");
}

// Purpose: Enter a meeting (the pre-join screen's Join button).
// Input:   meetingCode; request - display name, passcode and whether to join as the host
// Output:  the new participant (keep its id: every later call needs it);
//          throws ApiError 403 (wrong passcode, or not the host), 404 (no such meeting), 409 (meeting ended)
export function joinMeeting(meetingCode: string, request: JoinMeetingRequest): Promise<Participant> {
  return sendRequest<Participant>(`/api/meetings/${encodeURIComponent(meetingCode)}/join`, "POST", request);
}

// Purpose: The room's poll: who is inside, is the meeting still going, was I removed?
// Input:   meetingCode; participantId - the asking participant (so the answer can say was_removed)
export function fetchParticipants(meetingCode: string, participantId: number): Promise<ParticipantList> {
  return sendRequest<ParticipantList>(
    `/api/meetings/${encodeURIComponent(meetingCode)}/participants?participant_id=${participantId}`,
  );
}

// Purpose: Mute or unmute yourself (the Mute / Unmute button).
// Output:  the updated participant
export function setParticipantMuted(meetingCode: string, participantId: number, isMuted: boolean): Promise<Participant> {
  return sendRequest<Participant>(
    `/api/meetings/${encodeURIComponent(meetingCode)}/participants/${participantId}`,
    "PATCH",
    { is_muted: isMuted },
  );
}

// Purpose: Host control: mute everyone except the host.
// Input:   hostParticipantId - the host's own participant id (the server checks the role)
export function muteAllParticipants(meetingCode: string, hostParticipantId: number): Promise<void> {
  return sendRequest<void>(
    `/api/meetings/${encodeURIComponent(meetingCode)}/mute-all?host_participant_id=${hostParticipantId}`,
    "POST",
  );
}

// Purpose: Host control: remove one participant from the meeting.
// Input:   participantId - who to remove; hostParticipantId - the host's own participant id
export function removeParticipant(meetingCode: string, participantId: number, hostParticipantId: number): Promise<void> {
  return sendRequest<void>(
    `/api/meetings/${encodeURIComponent(meetingCode)}/participants/${participantId}?host_participant_id=${hostParticipantId}`,
    "DELETE",
  );
}

// Purpose: Leave the meeting (if you are the host, the meeting ends).
export function leaveMeeting(meetingCode: string, participantId: number): Promise<void> {
  return sendRequest<void>(`/api/meetings/${encodeURIComponent(meetingCode)}/leave?participant_id=${participantId}`, "POST");
}

// Purpose: The URL of the leave call, for navigator.sendBeacon when the tab is closing.
// Output:  full URL; participant_id is in the query string so the beacon needs no body (no CORS preflight)
export function buildLeaveUrl(meetingCode: string, participantId: number): string {
  return `${API_BASE_URL}/api/meetings/${encodeURIComponent(meetingCode)}/leave?participant_id=${participantId}`;
}
