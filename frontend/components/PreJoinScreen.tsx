"use client";

// =============================================================================
// File: components/PreJoinScreen.tsx
// Purpose: The screen shown before entering a meeting (opened by New Meeting, Start and
//          invite links: /join/{code}?host=1 or /join/{code}?pwd=...).
//          STARTER VERSION: it loads and validates the meeting. The camera preview, name
//          field and Join button are added when the pre-join screenshot is analysed.
// Contains: PreJoinScreen component
// =============================================================================

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { useApiData } from "@/hooks/useApiData";
import { fetchMeetingByCode } from "@/lib/apiClient";
import { formatMeetingCode } from "@/lib/formatters";

// Purpose: Render the pre-join screen.
// Output:  loading, "meeting not found" (404 from the backend) or the meeting's details
// How it works: reads the meeting code from the URL path and ?host=1 / ?pwd= from the query string.
export default function PreJoinScreen() {
  const { code: meetingCode } = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const isHost = searchParams.get("host") === "1";

  // useCallback keeps the function identity stable, which useApiData requires (see that hook's note).
  const loadMeeting = useCallback(() => fetchMeetingByCode(meetingCode), [meetingCode]);
  const { data: meeting, isLoading, errorMessage } = useApiData(loadMeeting);

  return (
    <main className="flex min-h-screen items-center justify-center bg-sidebar p-6">
      <div className="w-full max-w-md rounded-card bg-white p-8 text-center shadow-card">
        {isLoading && <p className="text-ink-muted">Checking meeting...</p>}

        {errorMessage && (
          <div role="alert">
            <p className="text-lg font-semibold text-red-600">{errorMessage}</p>
            <Link href="/" className="mt-4 inline-block text-zoom-blue hover:underline">
              Back to home
            </Link>
          </div>
        )}

        {meeting && (
          <>
            <h1 className="text-2xl font-bold">{meeting.title}</h1>
            <p className="mt-2 text-ink-muted">Meeting ID {formatMeetingCode(meeting.meeting_code)}</p>
            <p className="mt-1 text-ink-muted">Joining as {isHost ? "host" : "participant"}</p>
            <p className="mt-6 rounded-control bg-soft px-3 py-2 text-sm text-ink-muted">
              Camera preview and the Join button are coming in the next step.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
