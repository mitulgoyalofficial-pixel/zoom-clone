// =============================================================================
// File: components/ChatFab.tsx
// Purpose: The round blue chat button floating at the bottom-right of Zoom pages.
//          Decoration only (no chat feature behind it).
// Contains: ChatFab component
// =============================================================================

import { MessageCircle } from "lucide-react";

// Purpose: Render the floating button.
// Output:  a 56px blue circle fixed to the bottom-right corner
export default function ChatFab() {
  return (
    <button
      type="button"
      aria-label="Chat"
      // z-40 keeps it above page content but below the sticky header (z-50) and dropdown menus.
      className="fixed right-5 bottom-5 z-40 flex size-14 items-center justify-center rounded-full bg-zoom-blue text-white shadow-lg hover:brightness-110"
    >
      <MessageCircle size={28} aria-hidden="true" />
    </button>
  );
}
