// =============================================================================
// File: lib/apiTypes.ts
// Purpose: TypeScript shapes of the JSON the FastAPI backend sends and receives.
//          They mirror backend/app/api_schemas.py one to one, so a field that
//          changes there must change here too.
// Contains: User, PublicMeeting, HostMeeting (+ the small string unions they use)
// =============================================================================

export type MeetingType = "instant" | "scheduled";
export type MeetingStatus = "scheduled" | "live" | "ended";

// The logged-in user (GET /api/me).
export interface User {
  id: number;
  name: string;
  email: string;
  avatar_color: string; // hex like "#A94BC0", used for the initial avatar
}

// What anyone who knows a meeting ID may see (GET /api/meetings/{code}). Never includes the passcode.
// Time fields are ISO strings ending in "Z" (UTC); `new Date(value)` converts them to local time.
export interface PublicMeeting {
  id: number;
  meeting_code: string; // 11 digits without spaces, e.g. "12345678901"
  title: string;
  description: string | null;
  host_name: string;
  meeting_type: MeetingType;
  status: MeetingStatus;
  scheduled_start: string | null;
  duration_minutes: number;
  has_passcode: boolean;
  started_at: string | null;
  ended_at: string | null;
}

// The host's own view (Upcoming / Recent lists, and right after creating a meeting):
// the public fields plus the passcode and a ready-to-share invite link.
export interface HostMeeting extends PublicMeeting {
  passcode: string | null;
  invite_link: string;
}
