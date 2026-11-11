// =============================================================================
// File: lib/formatters.ts
// Purpose: Pure helper functions that turn raw API values into the text Zoom shows
//          (meeting ID with spaces, friendly dates, durations).
// Contains: formatMeetingCode, formatMeetingTime, formatDuration, formatTimeZoneOffset,
//           formatMeetingDateTime, formatTimeRange, formatDayHeading
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

// Purpose: Show the viewer's time zone as an offset from UTC.
// Input:   moment - a Date (the offset can differ in summer and winter, so it depends on the date)
// Output:  e.g. "GMT+5:30" or "GMT-8:00"
export function formatTimeZoneOffset(moment: Date): string {
  // getTimezoneOffset() is "minutes behind UTC" (India gives -330), so the sign is flipped.
  const minutesAheadOfUtc = -moment.getTimezoneOffset();
  const sign = minutesAheadOfUtc >= 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(minutesAheadOfUtc);
  const hours = Math.floor(absoluteMinutes / 60);
  const minutes = String(absoluteMinutes % 60).padStart(2, "0");
  return `GMT${sign}${hours}:${minutes}`;
}

// Purpose: Full date and time with the time zone, as on the meeting details page.
// Input:   isoTime - ISO string from the API
// Output:  e.g. "Nov 11, 2026 05:30 PM (GMT+5:30)"
export function formatMeetingDateTime(isoTime: string): string {
  const moment = new Date(isoTime);
  return `${format(moment, "MMM d, yyyy hh:mm a")} (${formatTimeZoneOffset(moment)})`;
}

// Purpose: A time range for one row of the Meetings list.
// Input:   start, end - Dates (local time; see getMeetingStart / getMeetingEnd in lib/meetingList.ts)
// Output:  e.g. "05:30 PM - 06:10 PM"
export function formatTimeRange(start: Date, end: Date): string {
  return `${format(start, "hh:mm a")} - ${format(end, "hh:mm a")}`;
}

// Purpose: The grey day header above a group of meetings in the Meetings list.
// Input:   day - any moment on that day
// Output:  "Today", "Tomorrow", "Yesterday" or e.g. "Thu, Nov 12, 2026"
export function formatDayHeading(day: Date): string {
  if (isToday(day)) {
    return "Today";
  }
  if (isTomorrow(day)) {
    return "Tomorrow";
  }
  if (isYesterday(day)) {
    return "Yesterday";
  }
  return format(day, "EEE, MMM d, yyyy");
}
