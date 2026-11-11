// =============================================================================
// File: app/(site)/layout.tsx
// Purpose: The Zoom website shell shared by the dashboard and the schedule page:
//          sticky header (utility bar + navbar), left sidebar, content area and chat button.
// Note: "(site)" is a route group: it does not appear in the URL. The full-screen
//       meeting room lives outside this group so it does not get this shell.
// =============================================================================

import ChatFab from "@/components/ChatFab";
import { CurrentUserProvider } from "@/components/CurrentUserProvider";
import Navbar from "@/components/Navbar";
import SidebarNav from "@/components/SidebarNav";
import TopUtilityBar from "@/components/TopUtilityBar";

// Purpose: Wrap a page in the Zoom website shell.
// Input:   children - the page content
// Output:  header + sidebar + main area
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <CurrentUserProvider>
      {/* Sticky because Zoom keeps both bars visible while the page scrolls (screenshots 2-3). */}
      <header className="sticky top-0 z-50">
        <TopUtilityBar />
        <Navbar />
      </header>
      <div className="flex flex-1">
        <SidebarNav />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <ChatFab />
    </CurrentUserProvider>
  );
}
