"use client";

// =============================================================================
// File: components/MeetingListTab.tsx
// Purpose: The content of one tab on the Meetings list page (Upcoming or Previous): loads the
//          meetings, groups them under day headers and shows loading, error and empty states.
// Contains: MeetingListTab component
// Source: docs/zoom-design-analysis.md section 3.2.2
// =============================================================================

import MeetingListRow from "@/components/MeetingListRow";
import { useApiData } from "@/hooks/useApiData";
import type { HostMeeting } from "@/lib/apiTypes";
import { groupMeetingsByDay } from "@/lib/meetingList";

interface MeetingListTabProps {
  fetchMeetings: () => Promise<HostMeeting[]>; // a function from lib/apiClient.ts (stable identity)
  emptyMessage: string; // shown when there are no meetings, e.g. "No upcoming meetings"
}

// Purpose: Render the grouped list for one tab.
// Input:   see MeetingListTabProps
// Output:  day header bars, each followed by its meeting rows
export default function MeetingListTab({ fetchMeetings, emptyMessage }: MeetingListTabProps) {
  const { data: meetings, isLoading, errorMessage, reload } = useApiData(fetchMeetings);

  if (isLoading) {
    return <p className="mt-6 text-ink-muted">Loading meetings...</p>;
  }
  if (errorMessage) {
    return (
      <div role="alert" className="mt-6">
        <p className="text-red-600">{errorMessage}</p>
        <button type="button" onClick={reload} className="mt-2 text-[15px] text-zoom-blue hover:underline">
          Try again
        </button>
      </div>
    );
  }
  if (!meetings || meetings.length === 0) {
    return <p className="mt-6 rounded-control bg-sidebar px-4 py-2.5 text-[15px] font-semibold">{emptyMessage}</p>;
  }

  return (
    <div className="mt-6">
      {groupMeetingsByDay(meetings).map((dayGroup) => (
        <section key={dayGroup.heading} className="mb-4">
          <h2 className="rounded-control bg-sidebar px-4 py-2.5 text-[15px] font-bold">{dayGroup.heading}</h2>
          <ul>
            {dayGroup.meetings.map((meeting) => (
              <MeetingListRow key={meeting.id} meeting={meeting} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
