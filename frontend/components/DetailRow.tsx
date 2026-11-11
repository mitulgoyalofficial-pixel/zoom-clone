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
    <div className="mt-5 flex items-start text-[15px]">
      <div className="w-[160px] shrink-0">{label}</div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
