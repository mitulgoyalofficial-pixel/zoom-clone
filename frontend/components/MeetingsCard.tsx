"use client";

// =============================================================================
// File: components/MeetingsCard.tsx
// Purpose: The "Meetings" card in the dashboard's right column = the brief's
//          "Upcoming meetings" section. Shows the upcoming meetings from the backend,
//          or Zoom's "No Upcoming Meetings" empty state.
// Contains: MeetingsCard component
// Source: docs/zoom-design-analysis.md section 3.1-H
// =============================================================================

import Card from "@/components/Card";
import UpcomingMeetingItem from "@/components/UpcomingMeetingItem";
import { useApiData } from "@/hooks/useApiData";
import { fetchUpcomingMeetings } from "@/lib/apiClient";

// Purpose: Render the card with loading, error, empty and list states.
// Output:  the card
export default function MeetingsCard() {
  const { data: upcomingMeetings, isLoading, errorMessage, reload } = useApiData(fetchUpcomingMeetings);

  return (
    <Card>
      <div className="flex items-baseline justify-between">
        <h2 className="text-[26px] font-bold">Meetings</h2>
        <button type="button" className="text-[15px] text-zoom-blue hover:underline">
          Visit Meetings
        </button>
      </div>

      {isLoading && <p className="mt-4 text-ink-muted">Loading meetings...</p>}

      {errorMessage && (
        <div role="alert" className="mt-4">
          <p className="text-red-600">{errorMessage}</p>
          <button type="button" onClick={reload} className="mt-2 text-[15px] text-zoom-blue hover:underline">
            Try again
          </button>
        </div>
      )}

      {upcomingMeetings && upcomingMeetings.length === 0 && (
        <p className="mt-4 rounded-control bg-soft px-3 py-2.5 text-lg font-semibold">No Upcoming Meetings</p>
      )}

      {upcomingMeetings && upcomingMeetings.length > 0 && (
        <ul className="mt-2">
          {upcomingMeetings.map((meeting) => (
            <UpcomingMeetingItem key={meeting.id} meeting={meeting} />
          ))}
        </ul>
      )}

      <div className="mt-5 flex justify-center">
        <button type="button" className="rounded-control bg-soft px-4 py-1.5 text-base text-zoom-blue hover:brightness-95">
          Test Audio and Video
        </button>
      </div>
    </Card>
  );
}
