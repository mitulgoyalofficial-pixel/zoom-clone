// =============================================================================
// File: components/Navbar.tsx
// Purpose: Zoom's main white navigation bar (64px): logo and marketing links on the left,
//          Schedule / Join / Host / Web App and the profile avatar on the right.
// Contains: Navbar component
// Source: docs/zoom-design-analysis.md section 3.1-B (incl. the blue-on-hover for the left links)
// =============================================================================

import { ChevronDown } from "lucide-react";
import Link from "next/link";

import AvatarMenu from "@/components/AvatarMenu";
import ZoomLogo from "@/components/ZoomLogo";

// Marketing links on the left; they are placeholders (no pages behind them).
const MARKETING_LINKS = ["Products", "Solutions", "Resources", "Plans & Pricing"];

// Right-side links that open a dropdown in Zoom; the dropdown contents have not been captured yet.
const DROPDOWN_LINKS = ["Host", "Web App"];

const RIGHT_LINK_CLASSES = "text-base font-medium text-ink/90 hover:text-zoom-blue";

// Purpose: Render the navbar.
// Output:  the <nav> element
export default function Navbar() {
  return (
    <nav className="flex h-16 items-center justify-between border-b border-line bg-white px-6">
      <div className="flex items-center">
        <Link href="/" aria-label="Zoom home">
          <ZoomLogo />
        </Link>
        <ul className="ml-9 flex items-center gap-[38px]">
          {MARKETING_LINKS.map((label) => (
            <li key={label}>
              <button type="button" className="text-base text-ink/75 hover:text-zoom-blue">
                {label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-7">
        <Link href="/meeting/schedule" className={RIGHT_LINK_CLASSES}>
          Schedule
        </Link>
        <Link href="/join" className={RIGHT_LINK_CLASSES}>
          Join
        </Link>
        {DROPDOWN_LINKS.map((label) => (
          <button key={label} type="button" className={`flex items-center gap-0.5 ${RIGHT_LINK_CLASSES}`}>
            {label}
            <ChevronDown size={16} aria-hidden="true" />
          </button>
        ))}
        <AvatarMenu />
      </div>
    </nav>
  );
}
