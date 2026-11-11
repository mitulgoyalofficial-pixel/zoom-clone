// =============================================================================
// File: lib/apiClient.ts
// Purpose: The ONLY place in the frontend that talks to the FastAPI backend.
//          Components call these named functions and never use fetch directly.
// Contains:
//   - ApiError: the error thrown for any failed call (carries a user-friendly message)
//   - sendRequest(): shared fetch + error handling
//   - fetchCurrentUser, fetchUpcomingMeetings, fetchRecentMeetings, fetchMeetingByCode,
//     createInstantMeeting
// Setup: the backend address comes from NEXT_PUBLIC_API_URL (frontend/.env.local).
// =============================================================================

import type { HostMeeting, PublicMeeting, User } from "@/lib/apiTypes";

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
