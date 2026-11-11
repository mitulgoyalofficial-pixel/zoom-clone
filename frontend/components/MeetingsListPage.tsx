"use client";

// =============================================================================
// File: components/MeetingsListPage.tsx
// Purpose: The Meetings page (zoom.us/meeting): title, "Schedule a Meeting" button, tabs
//          (Upcoming and Previous work, the other four are placeholders), the date range box
//          (visual only) and the meeting list of the selected tab.
// Contains: MeetingsListPage component
// Source: docs/zoom-design-analysis.md section 3.2.2
// =============================================================================

import { addMonths, format } from "date-fns";
import { CalendarDays, ChevronDown, CircleHelp, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import MeetingListTab from "@/components/MeetingListTab";
import { useIsClient } from "@/hooks/useIsClient";
import { fetchRecentMeetings, fetchUpcomingMeetings } from "@/lib/apiClient";

type ActiveTab = "upcoming" | "previous";

const WORKING_TABS: { name: ActiveTab; label: string }[] = [
  { name: "upcoming", label: "Upcoming" },
  { name: "previous", label: "Previous" },
];

// Tabs that Zoom has but this clone does not implement (they do nothing).
const PLACEHOLDER_TABS = ["Attachments", "Personal Room", "Meeting Templates", "Meeting Agendas"];

const TAB_CLASSES = "-mb-px border-b-2 pb-2.5 text-xl";

// Purpose: The visual-only date range box. It shows today to three months ahead, like Zoom's default.
// Output:  the box (needs the current date, so it is only rendered in the browser)
function DateRangeBox() {
  const today = new Date();
  const dateFormat = "MM-dd-yyyy"; // Zoom's order: month first

  return (
    <div className="mt-6 flex items-center gap-2">
      <div className="flex h-8 w-[270px] items-center gap-3 rounded-control border border-ink/50 px-3 text-[15px]">
        <CalendarDays size={16} aria-hidden="true" />
        <span>{format(today, dateFormat)}</span>
        <span>to</span>
        <span>{format(addMonths(today, 3), dateFormat)}</span>
      </div>
      <CircleHelp size={18} className="text-ink-muted" aria-label="Help" />
    </div>
  );
}

// Purpose: Render the whole Meetings page.
// Output:  the page content; switching tabs shows the Upcoming or Previous list
export default function MeetingsListPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("upcoming");
  const isClient = useIsClient();

  return (
    <div className="px-8 pt-8 pb-14">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meetings</h1>
        <div className="flex items-center gap-3">
          <button type="button" className="inline-flex h-8 items-center gap-2 rounded-control bg-soft px-3 text-sm hover:brightness-95">
            <CalendarDays size={16} aria-hidden="true" />
            Booking pages
            <ChevronDown size={14} aria-hidden="true" />
          </button>
          {/* Split button: the left part opens the form, the chevron part is a placeholder for Zoom's menu. */}
          <div className="flex overflow-hidden rounded-control bg-zoom-blue text-white">
            <Link href="/meeting/schedule" className="inline-flex h-8 items-center gap-1.5 px-4 text-[15px] font-medium hover:brightness-110">
              <Plus size={16} aria-hidden="true" />
              Schedule a Meeting
            </Link>
            <button type="button" aria-label="More scheduling options" className="flex h-8 w-9 items-center justify-center border-l border-white/40 hover:brightness-110">
              <ChevronDown size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-10 flex gap-8 border-b border-line">
        {WORKING_TABS.map((tab) => (
          <button
            key={tab.name}
            type="button"
            onClick={() => setActiveTab(tab.name)}
            aria-current={activeTab === tab.name ? "page" : undefined}
            className={`${TAB_CLASSES} ${activeTab === tab.name ? "border-zoom-blue text-zoom-blue" : "border-transparent text-ink/80 hover:text-zoom-blue"}`}
          >
            {tab.label}
          </button>
        ))}
        {PLACEHOLDER_TABS.map((label) => (
          <button key={label} type="button" className={`${TAB_CLASSES} border-transparent text-ink/80 hover:text-zoom-blue`}>
            {label}
          </button>
        ))}
      </div>

      {isClient && <DateRangeBox />}

      {/* key makes React start a fresh list (and a fresh request) whenever the tab changes. */}
      {activeTab === "upcoming" ? (
        <MeetingListTab key="upcoming" fetchMeetings={fetchUpcomingMeetings} emptyMessage="No upcoming meetings" />
      ) : (
        <MeetingListTab key="previous" fetchMeetings={fetchRecentMeetings} emptyMessage="No previous meetings" />
      )}
    </div>
  );
}
