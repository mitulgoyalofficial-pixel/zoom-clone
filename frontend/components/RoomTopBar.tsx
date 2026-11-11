// =============================================================================
// File: components/RoomTopBar.tsx
// Purpose: The thin black bar at the top of the room: an (i) pill with the meeting topic on
//          the left, and small icon buttons on the right (encryption shield, draw, AI sparkle
//          and view). The icons are decoration, like in the rest of this clone.
// Contains: RoomTopBar component
// Source: docs/zoom-design-analysis.md section 3.5
// =============================================================================

import { Info, LayoutGrid, Pencil, ShieldCheck, Sparkles } from "lucide-react";

// Purpose: Render the bar.
// Input:   title - the meeting topic
// Output:  the 48px bar
export default function RoomTopBar({ title }: { title: string }) {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between bg-[#0d0d0d] px-3">
      <span className="flex max-w-[50%] items-center gap-2 rounded-full bg-[#1c1c1c] px-3 py-1 text-sm font-bold">
        <Info size={16} className="shrink-0" aria-hidden="true" />
        <span className="truncate">{title}</span>
      </span>

      <div className="flex items-center gap-3 text-white/90">
        <ShieldCheck size={20} className="text-green-500" aria-label="Meeting is encrypted" />
        <Pencil size={18} aria-hidden="true" />
        <Sparkles size={18} aria-hidden="true" />
        <span className="h-5 w-px bg-white/20" aria-hidden="true" />
        <LayoutGrid size={18} aria-hidden="true" />
      </div>
    </div>
  );
}
