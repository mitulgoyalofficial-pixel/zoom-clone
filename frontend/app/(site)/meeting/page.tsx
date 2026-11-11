// =============================================================================
// File: app/(site)/meeting/page.tsx
// Purpose: The route /meeting: the Meetings list page (the sidebar's "Meetings" item and the
//          dashboard's "Visit Meetings" link open it).
// =============================================================================

import MeetingsListPage from "@/components/MeetingsListPage";

// Purpose: Render the Meetings list page.
export default function MeetingsPage() {
  return <MeetingsListPage />;
}
