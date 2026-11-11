// =============================================================================
// File: lib/formatters.ts
// Purpose: Pure helper functions that turn raw API values into the text Zoom shows
//          (meeting ID with spaces, friendly dates, durations).
// Contains: formatMeetingCode, formatMeetingTime, formatDuration
// =============================================================================

import { format, isToday, isTomorrow, isYesterday } from "date-fns";

// Purpose: Show a meeting ID the way Zoom does.
// Input:   meetingCode - 11 digits, e.g. "12345678901"
// Output:  "123 4567 8901" (the input unchanged if it is not 11 digits)
export function formatMeetingCode(meetingCode: string): string {
  if (meetingCode.length !== 11) {
    return meetingCode;
  }
  return `${meetingCode.slice(0, 3)} ${meetingCode.slice(3, 7)} ${meetingCode.slice(7)}`;
}

// Purpose: Show a point in time as a short friendly label in the viewer's local time zone.
// Input:   isoTime - ISO string from the API (UTC, ends with "Z")
// Output:  e.g. "Today, 5:30 PM", "Tomorrow, 10:00 AM", "Yesterday, 9:15 AM", "Sat, Nov 14, 10:30 AM"
// How it works: `new Date(isoTime)` converts UTC to local time; date-fns formats it.
export function formatMeetingTime(isoTime: string): string {
  const moment = new Date(isoTime);
  const time = format(moment, "h:mm a");

  if (isToday(moment)) {
    return `Today, ${time}`;
  }
  if (isTomorrow(moment)) {
    return `Tomorrow, ${time}`;
  }
  if (isYesterday(moment)) {
    return `Yesterday, ${time}`;
  }
  return `${format(moment, "EEE, MMM d")}, ${time}`;
}

// Purpose: Show a meeting length.
// Input:   totalMinutes - e.g. 45 or 90
// Output:  "45 min", "1 hr", "1 hr 30 min"
export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }
  if (minutes === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${minutes} min`;
}
