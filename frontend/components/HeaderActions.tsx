// =============================================================================
// File: components/HeaderActions.tsx
// Purpose: The right-hand group of Zoom's header: Schedule, Join, Host (dropdown), Web App
//          (dropdown) and the profile avatar. Shared by the main Navbar and the simple header
//          of the join page. The join page adds a "Support" link in front.
// Contains: HeaderActions component
// Source: docs/zoom-design-analysis.md sections 3.1-B and 3.3
// =============================================================================

import { ChevronDown } from "lucide-react";
import Link from "next/link";

import AvatarMenu from "@/components/AvatarMenu";

// Right-side links that open a dropdown in Zoom; the dropdown contents have not been captured yet.
const DROPDOWN_LINKS = ["Host", "Web App"];

const LINK_CLASSES = "text-base font-medium text-ink/90 hover:text-zoom-blue";

// Purpose: Render the header's right-hand links and avatar.
// Input:   showSupportLink - true on the join page, which has a "Support" link before Schedule
// Output:  the group of links
export default function HeaderActions({ showSupportLink = false }: { showSupportLink?: boolean }) {
  return (
    <div className="flex items-center gap-7">
      {showSupportLink && (
        <button type="button" className={LINK_CLASSES}>
          Support
        </button>
      )}
      <Link href="/meeting/schedule" className={LINK_CLASSES}>
        Schedule
      </Link>
      <Link href="/join" className={LINK_CLASSES}>
        Join
      </Link>
      {DROPDOWN_LINKS.map((label) => (
        <button key={label} type="button" className={`flex items-center gap-0.5 ${LINK_CLASSES}`}>
          {label}
          <ChevronDown size={16} aria-hidden="true" />
        </button>
      ))}
      <AvatarMenu />
    </div>
  );
}
