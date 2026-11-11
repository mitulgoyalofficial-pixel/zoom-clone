// =============================================================================
// File: components/UpcomingMeetingItem.tsx
// Purpose: One compact row in the dashboard's "Meetings" (upcoming) card: when it starts,
//          the title, the meeting ID and a Start button.
// Contains: UpcomingMeetingItem component
// =============================================================================

import Link from "next/link";

import type { HostMeeting } from "@/lib/apiTypes";
import { formatDuration, formatMeetingCode, formatMeetingTime } from "@/lib/formatters";

// Purpose: Render one upcoming meeting.
// Input:   meeting - a scheduled meeting from GET /api/meetings/upcoming
// Output:  the row; Start opens the pre-join screen as the host (?host=1)
export default function UpcomingMeetingItem({ meeting }: { meeting: HostMeeting }) {
  // Upcoming meetings are always scheduled ones, so scheduled_start is set; "" keeps TypeScript happy.
  const startLabel = meeting.scheduled_start ? formatMeetingTime(meeting.scheduled_start) : "";

  return (
    <li className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm text-ink-muted">
          {startLabel} · {formatDuration(meeting.duration_minutes)}
        </p>
        <p className="truncate font-semibold">{meeting.title}</p>
        <p className="text-sm text-ink-muted">Meeting ID {formatMeetingCode(meeting.meeting_code)}</p>
      </div>
      <Link
        href={`/join/${meeting.meeting_code}?host=1`}
        className="shrink-0 rounded-control bg-zoom-blue px-4 py-1.5 text-[15px] font-medium text-white hover:brightness-110"
      >
        Start
      </Link>
    </li>
  );
}
