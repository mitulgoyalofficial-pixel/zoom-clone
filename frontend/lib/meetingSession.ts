// =============================================================================
// File: lib/meetingSession.ts
// Purpose: Remembers, for the length of one browser tab, who you are in a meeting (your
//          participant id, name, role and camera choice) between the pre-join screen and the room.
// Contains: MeetingSession, saveMeetingSession, readMeetingSession, clearMeetingSession
// Why sessionStorage: it belongs to one tab, so two tabs can be two different participants of
//   the same meeting (handy for testing), and it vanishes when the tab closes.
// =============================================================================

import type { ParticipantRole } from "@/lib/apiTypes";

export interface MeetingSession {
  participantId: number;
  displayName: string;
  role: ParticipantRole;
  isCameraOn: boolean; // the camera toggle chosen on the pre-join screen
}

// Purpose: The storage key for one meeting.
function buildStorageKey(meetingCode: string): string {
  return `zoomclone:session:${meetingCode}`;
}

// Purpose: Remember the session after a successful join.
// Input:   meetingCode; session - what to remember
// Note:    storage can be blocked (private mode, blocked site data), so failures are ignored here;
//          the room then sends the person back to the pre-join screen.
export function saveMeetingSession(meetingCode: string, session: MeetingSession): void {
  try {
    sessionStorage.setItem(buildStorageKey(meetingCode), JSON.stringify(session));
  } catch {
    // ignored on purpose, see the note above
  }
}

// Purpose: Read the remembered session.
// Output:  the session, or null if there is none (or it cannot be read)
export function readMeetingSession(meetingCode: string): MeetingSession | null {
  try {
    const storedText = sessionStorage.getItem(buildStorageKey(meetingCode));
    return storedText ? (JSON.parse(storedText) as MeetingSession) : null;
  } catch {
    return null;
  }
}

// Purpose: Forget the session (after leaving, or when the meeting is over for this person).
export function clearMeetingSession(meetingCode: string): void {
  try {
    sessionStorage.removeItem(buildStorageKey(meetingCode));
  } catch {
    // ignored on purpose
  }
}
