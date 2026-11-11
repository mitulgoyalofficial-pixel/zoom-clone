// =============================================================================
// File: lib/meetingInput.ts
// Purpose: Understands what a person typed or pasted into the Join box: a meeting ID in any
//          common spelling, or a whole invite link.
// Contains: parseMeetingInput
// =============================================================================

const MEETING_CODE_LENGTH = 11;

export interface ParsedMeetingInput {
  meetingCode: string; // 11 digits, no spaces
  passcode: string | null; // taken from ?pwd= when an invite link was pasted
}

// Purpose: Turn the Join box text into a meeting code (and passcode when the text is an invite link).
// Input:   rawText - e.g. "123 4567 8901", "123-4567-8901", "12345678901" or
//          "http://localhost:3000/join/12345678901?pwd=aB3xY9"
// Output:  { meetingCode, passcode } or null when the text is not a valid meeting ID or link
export function parseMeetingInput(rawText: string): ParsedMeetingInput | null {
  const text = rawText.trim();
  if (text === "") {
    return null;
  }

  if (/^https?:\/\//i.test(text)) {
    return parseInviteLink(text);
  }

  // Spaces and dashes are allowed between the digit groups, nothing else.
  const digits = text.replace(/[\s-]/g, "");
  if (new RegExp(`^\\d{${MEETING_CODE_LENGTH}}$`).test(digits)) {
    return { meetingCode: digits, passcode: null };
  }
  return null;
}

// Purpose: Pull the meeting code and passcode out of an invite link.
// Input:   link - text starting with http:// or https://
// Output:  { meetingCode, passcode } or null if no 11-digit path segment is found
function parseInviteLink(link: string): ParsedMeetingInput | null {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return null; // looked like a link but is not a valid URL
  }

  const meetingCode = url.pathname
    .split("/")
    .find((segment) => new RegExp(`^\\d{${MEETING_CODE_LENGTH}}$`).test(segment));
  if (!meetingCode) {
    return null;
  }
  return { meetingCode, passcode: url.searchParams.get("pwd") };
}
