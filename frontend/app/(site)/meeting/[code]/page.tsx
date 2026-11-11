// =============================================================================
// File: app/(site)/meeting/[code]/page.tsx
// Purpose: The route /meeting/{meeting code}: the meeting details page (opened right after
//          saving a scheduled meeting, and from the Meetings list).
// Note: <Suspense> is required here: with Cache Components, useParams inside
//       MeetingDetailsView is only known at request time, and the build fails without it.
//       /meeting/schedule is a separate static route, so it is not mistaken for a code.
// =============================================================================

import { Suspense } from "react";

import MeetingDetailsView from "@/components/MeetingDetailsView";

// Purpose: Render the details page inside the required Suspense boundary.
export default function MeetingDetailsPage() {
  return (
    <Suspense fallback={<p className="px-8 pt-8 text-ink-muted">Loading meeting...</p>}>
      <MeetingDetailsView />
    </Suspense>
  );
}
