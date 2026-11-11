// =============================================================================
// File: app/(site)/page.tsx
// Purpose: The dashboard at "/": profile and Recent meetings on the left, quick actions
//          (New Meeting / Join / Schedule) and Upcoming meetings on the right.
//          It only arranges the cards; each card loads its own data.
// Layout (docs/zoom-design-analysis.md section 2): from 1024px two columns, the right one a fixed
//          326px, 24px gap, 72px side padding. Below 1024px one column: quick actions and Upcoming first.
// =============================================================================

import MeetingsCard from "@/components/MeetingsCard";
import ProfileCard from "@/components/ProfileCard";
import QuickActionsCard from "@/components/QuickActionsCard";
import RecentMeetingsCard from "@/components/RecentMeetingsCard";

// Purpose: Render the dashboard.
export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 items-start gap-6 px-4 py-6 sm:px-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_326px] lg:px-[72px]">
      {/* order: on small screens the right column (actions, Upcoming) comes first; on lg the order is natural. */}
      <div className="order-2 flex flex-col gap-6 lg:order-1">
        <ProfileCard />
        <RecentMeetingsCard />
      </div>
      <div className="order-1 flex flex-col gap-6 lg:order-2">
        <QuickActionsCard />
        <MeetingsCard />
      </div>
    </div>
  );
}
