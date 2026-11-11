"use client";

// =============================================================================
// File: components/RecentMeetingsCard.tsx
// Purpose: The "Recent meetings" section = Zoom's "Recent activity" card position
//          (dashboard left column, bottom): a title, a divider and the list of
//          meetings the user has hosted recently.
// Contains: RecentMeetingsCard component
// Source: docs/zoom-design-analysis.md section 3.1-F
// =============================================================================

import Card from "@/components/Card";
import MeetingCard from "@/components/MeetingCard";
import { useApiData } from "@/hooks/useApiData";
import { fetchRecentMeetings } from "@/lib/apiClient";

// Purpose: Render the card with loading, error, empty and list states.
// Output:  the card
export default function RecentMeetingsCard() {
  const { data: recentMeetings, isLoading, errorMessage, reload } = useApiData(fetchRecentMeetings);

  return (
    <Card>
      <h2 className="text-[26px] font-bold">Recent meetings</h2>
      <hr className="mt-4 mb-5 border-line" />

      {isLoading && <p className="text-ink-muted">Loading recent meetings...</p>}

      {errorMessage && (
        <div role="alert">
          <p className="text-red-600">{errorMessage}</p>
          <button type="button" onClick={reload} className="mt-2 text-[15px] text-zoom-blue hover:underline">
            Try again
          </button>
        </div>
      )}

      {recentMeetings && recentMeetings.length === 0 && (
        <p className="rounded-control bg-soft px-3 py-2.5 text-lg font-semibold">No recent meetings</p>
      )}

      {recentMeetings && recentMeetings.length > 0 && (
        <ul className="flex flex-col gap-4">
          {recentMeetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </ul>
      )}
    </Card>
  );
}
