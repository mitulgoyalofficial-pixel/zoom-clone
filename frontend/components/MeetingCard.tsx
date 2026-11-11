// =============================================================================
// File: components/MeetingCard.tsx
// Purpose: One item in the "Recent meetings" list. Styled like Zoom's "Recent activity"
//          items: bordered card, thumbnail box, blue title, grey detail lines, a small
//          outlined tag at the bottom-right and a "..." button at the top-right.
// Contains: MeetingCard component
// Source: docs/zoom-design-analysis.md section 3.1-F
// =============================================================================

import { Ellipsis, Video } from "lucide-react";
import Link from "next/link";

import type { HostMeeting } from "@/lib/apiTypes";
import { formatMeetingCode, formatMeetingTime } from "@/lib/formatters";

// Purpose: Choose the text of the small tag.
// Input:   meeting - a recent meeting
// Output:  "Live" if it is still going on, otherwise its type ("Instant" or "Scheduled")
function getTagLabel(meeting: HostMeeting): string {
  if (meeting.status === "live") {
    return "Live";
  }
  return meeting.meeting_type === "instant" ? "Instant" : "Scheduled";
}

// Purpose: Render one recent meeting.
// Input:   meeting - a meeting from GET /api/meetings/recent (started_at is always set there)
// Output:  the card (the "..." button is a placeholder for now)
export default function MeetingCard({ meeting }: { meeting: HostMeeting }) {
  const startedLabel = meeting.started_at ? formatMeetingTime(meeting.started_at) : "";

  return (
    <li className="relative flex gap-4 rounded-card border border-line p-4">
      {/* The thumbnail is decoration: hidden on phones to leave the room to the text. */}
      <div className="hidden size-[88px] shrink-0 items-center justify-center rounded-control border border-line sm:flex">
        <span className="flex size-10 items-center justify-center rounded-control bg-zoom-blue text-white">
          <Video size={22} fill="currentColor" aria-hidden="true" />
        </span>
      </div>

      <div className="min-w-0 pr-8 pb-5 text-[15px] sm:pb-0">
        <Link href={`/meeting/${meeting.meeting_code}`} className="block truncate font-semibold text-zoom-blue hover:underline">
          {meeting.title}
        </Link>
        <p>Hosted by {meeting.host_name}</p>
        <p>Started {startedLabel}</p>
        <p className="text-ink-muted">Meeting ID {formatMeetingCode(meeting.meeting_code)}</p>
      </div>

      <button
        type="button"
        aria-label="More actions"
        className="absolute top-3 right-3 rounded p-1 text-zoom-blue hover:bg-soft"
      >
        <Ellipsis size={20} aria-hidden="true" />
      </button>

      <span className="absolute right-4 bottom-3 rounded-full border border-zoom-blue/40 px-2 py-0.5 text-[11px] text-zoom-blue">
        {getTagLabel(meeting)}
      </span>
    </li>
  );
}
