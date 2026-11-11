// =============================================================================
// File: lib/apiTypes.ts
// Purpose: TypeScript shapes of the JSON the FastAPI backend sends and receives.
//          They mirror backend/app/api_schemas.py one to one, so a field that
//          changes there must change here too.
// Contains: User, PublicMeeting, HostMeeting, ScheduleMeetingRequest, JoinMeetingRequest, Participant,
//           ParticipantList (+ the small string unions they use)
// =============================================================================

export type MeetingType = "instant" | "scheduled";
export type MeetingStatus = "scheduled" | "live" | "ended";
export type ParticipantRole = "host" | "participant";

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

// Body of POST /api/meetings/schedule (the Schedule form).
// scheduled_start must be an ISO date-time WITH a time zone, e.g. new Date(...).toISOString().
export interface ScheduleMeetingRequest {
  title: string;
  description: string | null;
  scheduled_start: string;
  duration_minutes: number; // 1 to 1440
  has_passcode: boolean;
}

// Body of POST /api/meetings/{code}/join (the pre-join screen).
export interface JoinMeetingRequest {
  display_name: string;
  passcode: string | null; // not needed for the host, or when the meeting has no passcode
  as_host: boolean; // true only when the host starts their own meeting
}

// One person in a meeting (the participants panel, and the answer of a join).
export interface Participant {
  id: number;
  display_name: string;
  role: ParticipantRole;
  is_muted: boolean;
  joined_at: string;
}

// Answer of the participants poll (GET /api/meetings/{code}/participants).
export interface ParticipantList {
  meeting_status: MeetingStatus;
  participants: Participant[]; // people currently inside, in join order
  was_removed: boolean; // true if the asking participant was removed by the host
}
