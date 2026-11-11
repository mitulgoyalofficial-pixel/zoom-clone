// =============================================================================
// File: components/Navbar.tsx
// Purpose: Zoom's main white navigation bar (64px): logo and marketing links on the left,
//          Schedule / Join / Host / Web App and the profile avatar on the right.
// Contains: Navbar component
// Source: docs/zoom-design-analysis.md section 3.1-B (incl. the blue-on-hover for the left links)
// =============================================================================

import Link from "next/link";

import HeaderActions from "@/components/HeaderActions";
import SidebarToggleButton from "@/components/SidebarToggleButton";
import ZoomLogo from "@/components/ZoomLogo";

// Marketing links on the left; they are placeholders (no pages behind them).
const MARKETING_LINKS = ["Products", "Solutions", "Resources", "Plans & Pricing"];

// Purpose: Render the navbar.
// Output:  the <nav> element
export default function Navbar() {
  return (
    <nav className="flex h-16 items-center justify-between border-b border-line bg-white px-3 sm:px-6">
      <div className="flex items-center">
        {/* Below 1024px the sidebar is a drawer; this button opens it. */}
        <SidebarToggleButton />
        <Link href="/" aria-label="Zoom home">
          <ZoomLogo />
        </Link>
        {/* The marketing links need the room of a large screen. */}
        <ul className="ml-9 hidden items-center gap-[38px] lg:flex">
          {MARKETING_LINKS.map((label) => (
            <li key={label}>
              <button type="button" className="text-base text-ink/75 hover:text-zoom-blue">
                {label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <HeaderActions />
    </nav>
  );
}
