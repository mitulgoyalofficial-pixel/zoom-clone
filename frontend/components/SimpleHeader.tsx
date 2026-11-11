// =============================================================================
// File: components/SimpleHeader.tsx
// Purpose: The slim header of the join page: just the logo on the left and the header
//          links (Support, Schedule, Join, Host, Web App, avatar) on the right. No black
//          utility bar and no marketing links.
// Contains: SimpleHeader component
// Source: docs/zoom-design-analysis.md section 3.3
// =============================================================================

import Link from "next/link";

import HeaderActions from "@/components/HeaderActions";
import ZoomLogo from "@/components/ZoomLogo";

// Purpose: Render the slim header.
// Output:  the <header> element
export default function SimpleHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-line bg-white px-6">
      <Link href="/" aria-label="Zoom home">
        <ZoomLogo />
      </Link>
      <HeaderActions showSupportLink />
    </header>
  );
}
