// =============================================================================
// File: components/DetailRow.tsx
// Purpose: One read-only row of the meeting details page: a label on the left (160px column)
//          and plain text or links on the right.
// Contains: DetailRow component
// Source: docs/zoom-design-analysis.md section 3.2.1
// =============================================================================

// Purpose: Lay out a label and its value side by side.
// Input:   label - e.g. "Meeting ID"; children - the value (text, links, buttons)
// Output:  the row; rows are ~52px apart like Zoom's
export default function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    // Label above the value on phones, side by side (160px label column) from 640px.
    <div className="mt-5 flex flex-col items-start text-[15px] sm:flex-row">
      <div className="mb-0.5 w-full shrink-0 text-ink-muted sm:mb-0 sm:w-[160px] sm:text-ink">{label}</div>
      <div className="w-full min-w-0 flex-1">{children}</div>
    </div>
  );
}
