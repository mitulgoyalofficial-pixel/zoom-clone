// =============================================================================
// File: components/MeetingListRow.tsx
// Purpose: One meeting row on the Meetings list page: the time range on the left, the title
//          (a link to the details page) and the meeting ID on the right.
// Contains: MeetingListRow component
// Source: docs/zoom-design-analysis.md section 3.2.2
// =============================================================================

import Link from "next/link";

import type { HostMeeting } from "@/lib/apiTypes";
import { formatMeetingCode, formatTimeRange } from "@/lib/formatters";
import { getMeetingEnd, getMeetingStart } from "@/lib/meetingList";

// Purpose: Render one row.
// Input:   meeting - a meeting from the Upcoming or Previous list
// Output:  the row; clicking the title opens /meeting/{code}
export default function MeetingListRow({ meeting }: { meeting: HostMeeting }) {
  return (
    <li className="flex flex-col gap-1 border-b border-line px-4 py-4 last:border-b-0 sm:flex-row sm:gap-8">
      <p className="shrink-0 text-base font-bold sm:w-[240px]">
        {formatTimeRange(getMeetingStart(meeting), getMeetingEnd(meeting))}
      </p>
      <div className="min-w-0">
        <Link href={`/meeting/${meeting.meeting_code}`} className="block truncate text-base font-bold hover:text-zoom-blue hover:underline">
          {meeting.title}
        </Link>
        <p className="mt-2 text-[15px] text-ink-muted">Meeting ID: {formatMeetingCode(meeting.meeting_code)}</p>
      </div>
    </li>
  );
}
