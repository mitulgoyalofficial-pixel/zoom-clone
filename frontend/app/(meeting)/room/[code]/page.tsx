// =============================================================================
// File: app/(meeting)/room/[code]/page.tsx
// Purpose: The route /room/{meeting code}: the live meeting room.
// Note: the "(meeting)" route group has no website shell (no navbar, sidebar or footer), like
//       Zoom's full-screen meeting page.
//       <Suspense> is REQUIRED: with Cache Components, useParams inside MeetingRoom is only
//       known at request time, and the build fails without a Suspense boundary around it.
// =============================================================================

import { Suspense } from "react";

import MeetingRoom from "@/components/MeetingRoom";

// Purpose: Render the room inside the required Suspense boundary.
export default function RoomPage() {
  return (
    <Suspense fallback={<p className="bg-[#1c1c1c] p-8 text-white/70">Loading meeting...</p>}>
      <MeetingRoom />
    </Suspense>
  );
}
