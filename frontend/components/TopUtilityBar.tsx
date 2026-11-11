// =============================================================================
// File: components/TopUtilityBar.tsx
// Purpose: The thin black strip above the navbar (Search, Support, phone number,
//          Contact Sales, Request a Demo). Marketing links in Zoom, so here they are
//          visual placeholders that do nothing.
// Contains: TopUtilityBar component
// Source: docs/zoom-design-analysis.md section 3.1-A
// =============================================================================

import { Search } from "lucide-react";

// Purpose: Render the black utility bar (40px high, right-aligned white text).
// Output:  the bar element
export default function TopUtilityBar() {
  return (
    // Hidden on phones: it is marketing links only, and the navbar needs the space.
    <div className="hidden h-10 items-center justify-end gap-5 bg-utility-bar px-8 text-[15px] text-white md:flex">
      <button type="button" className="flex items-center gap-1.5 hover:underline">
        <Search size={18} aria-hidden="true" />
        Search
      </button>
      <button type="button" className="hover:underline">Support</button>
      <span>1.888.799.9666</span>
      <span className="h-4 w-px bg-white/30" aria-hidden="true" />
      <button type="button" className="hover:underline">Contact Sales</button>
      <button type="button" className="hover:underline">Request a Demo</button>
    </div>
  );
}
