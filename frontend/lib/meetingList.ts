// =============================================================================
// File: lib/meetingList.ts
// Purpose: Helpers for the Meetings list page: work out when a meeting starts and ends,
//          and group meetings under day headings ("Today", "Thu, Nov 12, 2026"...).
// Contains: getMeetingStart, getMeetingEnd, groupMeetingsByDay, MeetingDayGroup
// =============================================================================

import type { HostMeeting } from "@/lib/apiTypes";
import { formatDayHeading } from "@/lib/formatters";

export interface MeetingDayGroup {
  heading: string; // "Today", "Tomorrow", "Thu, Nov 12, 2026" ...
  meetings: HostMeeting[];
}

// Purpose: When a meeting starts, as a Date in the viewer's local time.
// Input:   meeting - scheduled meetings have scheduled_start, instant ones only started_at
// Output:  a Date (the current time as a last resort; the API never sends a meeting with neither)
export function getMeetingStart(meeting: HostMeeting): Date {
  const startIso = meeting.scheduled_start ?? meeting.started_at;
  return startIso ? new Date(startIso) : new Date();
}

// Purpose: When a meeting ends (or is planned to end).
// Input:   meeting
// Output:  the real end time if the meeting has ended, otherwise start + planned duration
export function getMeetingEnd(meeting: HostMeeting): Date {
  if (meeting.ended_at) {
    return new Date(meeting.ended_at);
  }
  return new Date(getMeetingStart(meeting).getTime() + meeting.duration_minutes * 60_000);
}

// Purpose: Put meetings under one heading per calendar day.
// Input:   meetings - already sorted by the API (earliest first for Upcoming, newest first for Previous)
// Output:  groups in the same order as the input; meetings of the same day end up together
// How it works: the day is the viewer's LOCAL date, so a late-evening meeting is not pushed to the next day by UTC.
export function groupMeetingsByDay(meetings: HostMeeting[]): MeetingDayGroup[] {
  const groups: MeetingDayGroup[] = [];

  for (const meeting of meetings) {
    const heading = formatDayHeading(getMeetingStart(meeting));
    const lastGroup = groups[groups.length - 1];

    // Because the input is sorted, a meeting of the same day is always next to its group.
    if (lastGroup && lastGroup.heading === heading) {
      lastGroup.meetings.push(meeting);
    } else {
      groups.push({ heading, meetings: [meeting] });
    }
  }
  return groups;
}
