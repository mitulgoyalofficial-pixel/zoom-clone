// =============================================================================
// File: app/(simple)/join/page.tsx
// Purpose: The route /join: the Join Meeting page where you type a meeting ID or paste an
//          invite link (opened by the Join tile and the navbar's Join link).
// =============================================================================

import JoinMeetingForm from "@/components/JoinMeetingForm";

// Purpose: Render the Join page.
export default function JoinPage() {
  return <JoinMeetingForm />;
}
