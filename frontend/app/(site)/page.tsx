// =============================================================================
// File: app/(site)/page.tsx
// Purpose: The dashboard at "/": profile and Recent meetings on the left, quick actions
//          (New Meeting / Join / Schedule) and Upcoming meetings on the right.
//          It only arranges the cards; each card loads its own data.
// Layout (docs/zoom-design-analysis.md section 2): two columns, the right one a fixed
//          326px, 24px gap, 72px side padding.
// =============================================================================

import MeetingsCard from "@/components/MeetingsCard";
import ProfileCard from "@/components/ProfileCard";
import QuickActionsCard from "@/components/QuickActionsCard";
import RecentMeetingsCard from "@/components/RecentMeetingsCard";

// Purpose: Render the dashboard.
export default function DashboardPage() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_326px] items-start gap-6 px-[72px] py-10">
      <div className="flex flex-col gap-6">
        <ProfileCard />
        <RecentMeetingsCard />
      </div>
      <div className="flex flex-col gap-6">
        <QuickActionsCard />
        <MeetingsCard />
      </div>
    </div>
  );
}
