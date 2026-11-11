"use client";

// =============================================================================
// File: components/ProfileCard.tsx
// Purpose: The first card of the dashboard's left column: big avatar, the user's name,
//          their plan, and the Manage Plan / View Plan Details placeholders.
// Contains: ProfileCard component
// Source: docs/zoom-design-analysis.md section 3.1-D
// =============================================================================

import Avatar from "@/components/Avatar";
import Card from "@/components/Card";
import { useCurrentUser } from "@/components/CurrentUserProvider";

const AVATAR_SIZE_PX = 78;

// Static text: the clone has no plans or billing, this is decoration copied from Zoom's look.
const PLAN_NAME = "Workplace Basic";

// Purpose: Render the profile card (with simple loading and error states).
// Output:  the card; the name comes from GET /api/me through CurrentUserProvider
export default function ProfileCard() {
  const { currentUser, isLoadingUser, userErrorMessage } = useCurrentUser();

  if (userErrorMessage) {
    return (
      <Card>
        <p role="alert" className="text-red-600">{userErrorMessage}</p>
      </Card>
    );
  }

  return (
    <Card className="flex items-stretch justify-between">
      <div className="flex items-center gap-4">
        {currentUser ? (
          <Avatar name={currentUser.name} color={currentUser.avatar_color} sizePx={AVATAR_SIZE_PX} className="rounded-[10px]" />
        ) : (
          <div style={{ width: AVATAR_SIZE_PX, height: AVATAR_SIZE_PX }} className="animate-pulse rounded-[10px] bg-soft" />
        )}
        <div>
          <h1 className="text-2xl font-bold">{currentUser?.name ?? (isLoadingUser ? "Loading..." : "")}</h1>
          <p className="mt-1 text-[15px] text-ink-muted">
            Plan: <span className="text-ink">{PLAN_NAME}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col items-end justify-between">
        <button type="button" className="h-8 rounded-control bg-soft px-4 text-[15px] text-zoom-blue hover:brightness-95">
          Manage Plan
        </button>
        <button type="button" className="text-[15px] text-zoom-blue hover:underline">
          View Plan Details
        </button>
      </div>
    </Card>
  );
}
