// =============================================================================
// File: lib/invitationText.ts
// Purpose: Builds the text that "Copy Invitation" puts on the clipboard, laid out like Zoom's
//          invitation (who invites you, topic, time, join link, meeting ID, passcode).
// Contains: buildInvitationText
// =============================================================================

import type { HostMeeting } from "@/lib/apiTypes";
import { formatMeetingCode, formatMeetingDateTime } from "@/lib/formatters";

// Purpose: Create the invitation text for one meeting.
// Input:   meeting - the host's view of the meeting (it has the passcode and invite link)
// Output:  a multi-line string, ready to paste into an email or chat
export function buildInvitationText(meeting: HostMeeting): string {
  const startIso = meeting.scheduled_start ?? meeting.started_at;
  const lines = [
    `${meeting.host_name} is inviting you to a ${meeting.meeting_type} Zoom meeting.`,
    "",
    `Topic: ${meeting.title}`,
  ];

  if (startIso) {
    lines.push(`Time: ${formatMeetingDateTime(startIso)}`);
  }

  lines.push("", "Join Zoom Meeting", meeting.invite_link, "", `Meeting ID: ${formatMeetingCode(meeting.meeting_code)}`);

  // No passcode line when the meeting does not need one.
  if (meeting.passcode) {
    lines.push(`Passcode: ${meeting.passcode}`);
  }
  return lines.join("\n");
}
