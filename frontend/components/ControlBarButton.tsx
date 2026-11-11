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
  shortLabel?: string; // shorter text used below 768px, where the bar is tight (e.g. "People")
  icon: React.ReactNode;
  onClick?: () => void; // leave out for placeholder buttons that do nothing
  ariaLabel?: string; // longer accessible name when the visible label is short
  badgeCount?: number; // small number at the icon's top-right (participant count)
  hasChevron?: boolean; // the small ^ next to the icon (visual only)
  isHiddenOnSmallScreens?: boolean; // placeholder buttons are hidden below 768px so the bar fits a phone
  isPressed?: boolean; // true while a menu or panel opened by this button is showing
}

// Purpose: Render the button.
// Input:   see ControlBarButtonProps
// Output:  a dark bar button, ~64px wide, lighter background on hover
export default function ControlBarButton({
  label,
  shortLabel,
  icon,
  onClick,
  ariaLabel,
  badgeCount,
  hasChevron = false,
  isHiddenOnSmallScreens = false,
  isPressed = false,
}: ControlBarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      aria-pressed={isPressed}
      className={`${isHiddenOnSmallScreens ? "hidden md:flex" : "flex"} min-w-[52px] flex-col items-center gap-0.5 rounded-md px-1 py-1 hover:bg-white/10 md:min-w-[64px] md:px-2 ${isPressed ? "bg-white/10" : ""}`}
    >
      <span className="relative flex h-6 items-center">
        {icon}
        {badgeCount !== undefined && (
          <span className="absolute -top-1.5 -right-3 text-[11px] leading-none text-white/80">{badgeCount}</span>
        )}
        {hasChevron && <ChevronUp size={12} className="absolute -right-4 hidden text-white/70 md:block" aria-hidden="true" />}
      </span>
      <span className="text-[11px] leading-tight text-white/90">
        {shortLabel ? (
          <>
            <span className="md:hidden">{shortLabel}</span>
            <span className="hidden md:inline">{label}</span>
          </>
        ) : (
          label
        )}
      </span>
    </button>
  );
}
