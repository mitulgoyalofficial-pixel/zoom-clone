"use client";

// =============================================================================
// File: components/QuickActionsCard.tsx
// Purpose: The top card of the dashboard's right column: the three required buttons
//          (New Meeting, Join, Schedule), plus Zoom's Personal Meeting ID row and
//          Booking links, which are visual placeholders only.
// Contains: QuickActionsCard component
// Source: docs/zoom-design-analysis.md section 3.1-G
// =============================================================================

import { CalendarCheck, CalendarDays, CalendarPlus, Copy, Plus, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import ActionTile from "@/components/ActionTile";
import Card from "@/components/Card";
import { ApiError, createInstantMeeting } from "@/lib/apiClient";

// Static sample text: our database has no "personal meeting ID", so this row is decoration.
const PLACEHOLDER_PERSONAL_MEETING_ID = "123 456 7890";

const BOOKING_LINK_TILES = [
  { label: "View links", icon: CalendarDays },
  { label: "Create page", icon: CalendarPlus },
  { label: "Meeting poll", icon: CalendarCheck },
];

// Purpose: Render the card and handle the New Meeting click.
// Output:  the card
// How it works: New Meeting creates an instant meeting through the API, then opens the
//   pre-join screen as the host (?host=1), where the host checks camera and mic and enters.
export default function QuickActionsCard() {
  const router = useRouter();
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [createErrorMessage, setCreateErrorMessage] = useState<string | null>(null);

  // Purpose: Create an instant meeting and go to its pre-join screen.
  // Input:   none (click handler)
  // Output:  none; on failure shows an error message under the tiles
  async function startInstantMeeting() {
    setIsCreatingMeeting(true);
    setCreateErrorMessage(null);
    try {
      const meeting = await createInstantMeeting();
      router.push(`/join/${meeting.meeting_code}?host=1`);
      // Not reset on success: the page navigates away, and keeping the button disabled stops double clicks.
    } catch (error) {
      setCreateErrorMessage(error instanceof ApiError ? error.message : "Could not start the meeting.");
      setIsCreatingMeeting(false);
    }
  }

  return (
    <Card>
      <div className="grid grid-cols-3 gap-0">
        <ActionTile
          label={isCreatingMeeting ? "Starting..." : "New Meeting"}
          colorClass="bg-zoom-orange"
          icon={<Video size={26} fill="currentColor" aria-hidden="true" />}
          onClick={startInstantMeeting}
          isDisabled={isCreatingMeeting}
        />
        <ActionTile
          label="Join"
          colorClass="bg-zoom-blue"
          href="/join"
          icon={
            <span className="flex size-[22px] items-center justify-center rounded-[6px] border-2 border-white">
              <Plus size={14} strokeWidth={3} aria-hidden="true" />
            </span>
          }
        />
        <ActionTile
          label="Schedule"
          colorClass="bg-zoom-blue"
          href="/meeting/schedule"
          icon={<CalendarDays size={26} aria-hidden="true" />}
        />
      </div>

      {createErrorMessage && (
        <p role="alert" className="mt-3 text-center text-sm text-red-600">
          {createErrorMessage}
        </p>
      )}

      <p className="mt-5 flex items-center gap-2 text-[15px]">
        <span className="font-semibold">Personal Meeting ID</span>
        <span>{PLACEHOLDER_PERSONAL_MEETING_ID}</span>
        <button type="button" aria-label="Copy Personal Meeting ID" className="text-ink-muted hover:text-ink">
          <Copy size={16} aria-hidden="true" />
        </button>
      </p>

      <hr className="my-4 border-line" />

      <h3 className="text-[15px] font-semibold">Booking links</h3>
      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {BOOKING_LINK_TILES.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            className="flex h-[59px] flex-col items-center justify-center gap-1 rounded-control border border-line text-[13px] text-ink-muted hover:bg-soft"
          >
            <Icon size={20} className="text-zoom-blue" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
    </Card>
  );
}
