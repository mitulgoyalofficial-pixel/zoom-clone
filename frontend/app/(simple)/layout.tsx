// =============================================================================
// File: app/(simple)/layout.tsx
// Purpose: The light, minimal shell of the join page: slim header on top, content in the
//          middle, one-line footer at the bottom, plus the floating chat button.
// Note: "(simple)" is a route group (not part of the URL), next to "(site)" with the full
//       dashboard shell and "(meeting)" for the full-screen meeting pages.
// =============================================================================

import ChatFab from "@/components/ChatFab";
import { CurrentUserProvider } from "@/components/CurrentUserProvider";
import SimpleFooter from "@/components/SimpleFooter";
import SimpleHeader from "@/components/SimpleHeader";

// Purpose: Wrap a page in the minimal shell.
// Input:   children - the page content
export default function SimpleLayout({ children }: { children: React.ReactNode }) {
  return (
    <CurrentUserProvider>
      <SimpleHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <SimpleFooter />
      <ChatFab />
    </CurrentUserProvider>
  );
}
