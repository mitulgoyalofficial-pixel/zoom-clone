// =============================================================================
// File: app/(meeting)/join/[code]/page.tsx
// Purpose: The route /join/{meeting code}: the pre-join screen, also the target of invite links.
// Note: the "(meeting)" route group has no website shell (no navbar/sidebar), like Zoom's
//       full-screen meeting pages.
//       <Suspense> is REQUIRED here: with Cache Components, useParams/useSearchParams
//       inside PreJoinScreen are only known at request time, and the build fails
//       without a Suspense boundary around them (see the Next.js docs for useParams).
// =============================================================================

import { Suspense } from "react";

import PreJoinScreen from "@/components/PreJoinScreen";

// Purpose: Render the pre-join screen inside the required Suspense boundary.
export default function JoinMeetingPage() {
  return (
    <Suspense fallback={<p className="p-8 text-ink-muted">Loading...</p>}>
      <PreJoinScreen />
    </Suspense>
  );
}
