// =============================================================================
// File: components/ControlBarButton.tsx
// Purpose: One button of the room's bottom bar: an icon over a small label, optionally with a
//          small count badge (Participants) or a chevron-up (Unmute, Video, Chat, Share).
// Contains: ControlBarButton component
// Source: docs/zoom-design-analysis.md section 3.5
// =============================================================================

import { ChevronUp } from "lucide-react";

interface ControlBarButtonProps {
  label: string; // the text under the icon
  icon: React.ReactNode;
  onClick?: () => void; // leave out for placeholder buttons that do nothing
  ariaLabel?: string; // longer accessible name when the visible label is short
  badgeCount?: number; // small number at the icon's top-right (participant count)
  hasChevron?: boolean; // the small ^ next to the icon (visual only)
  isPressed?: boolean; // true while a menu or panel opened by this button is showing
}

// Purpose: Render the button.
// Input:   see ControlBarButtonProps
// Output:  a dark bar button, ~64px wide, lighter background on hover
export default function ControlBarButton({
  label,
  icon,
  onClick,
  ariaLabel,
  badgeCount,
  hasChevron = false,
  isPressed = false,
}: ControlBarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      aria-pressed={isPressed}
      className={`flex min-w-[64px] flex-col items-center gap-0.5 rounded-md px-2 py-1 hover:bg-white/10 ${isPressed ? "bg-white/10" : ""}`}
    >
      <span className="relative flex h-6 items-center">
        {icon}
        {badgeCount !== undefined && (
          <span className="absolute -top-1.5 -right-3 text-[11px] leading-none text-white/80">{badgeCount}</span>
        )}
        {hasChevron && <ChevronUp size={12} className="absolute -right-4 text-white/70" aria-hidden="true" />}
      </span>
      <span className="text-[11px] leading-tight text-white/90">{label}</span>
    </button>
  );
}
