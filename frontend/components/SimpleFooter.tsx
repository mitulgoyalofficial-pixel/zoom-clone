// =============================================================================
// File: components/SimpleFooter.tsx
// Purpose: The one-line footer of the join page: copyright text, a legal link and the
//          language dropdown (all placeholders).
// Contains: SimpleFooter component
// Source: docs/zoom-design-analysis.md section 3.3
// =============================================================================

import { ChevronDown } from "lucide-react";

// Purpose: Render the footer line.
// Output:  the <footer> element
export default function SimpleFooter() {
  return (
    <footer className="flex items-center justify-center gap-16 pb-6 text-[15px] text-ink-muted">
      <p>
        &copy; 2026 Zoom Clone (a learning project). All rights reserved.{" "}
        <button type="button" className="hover:underline">
          Privacy &amp; Legal Policies
        </button>
      </p>
      <button type="button" className="flex items-center gap-1 text-zoom-blue">
        English
        <ChevronDown size={14} aria-hidden="true" />
      </button>
    </footer>
  );
}
