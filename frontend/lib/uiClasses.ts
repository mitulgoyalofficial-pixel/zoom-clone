// =============================================================================
// File: lib/uiClasses.ts
// Purpose: Tailwind class strings for the controls that appear on many pages (buttons and
//          form fields), so every page uses the same look and a change is made in one place.
// Contains: PRIMARY_BUTTON_CLASSES, DANGER_BUTTON_CLASSES, OUTLINE_BUTTON_CLASSES, SOFT_BUTTON_CLASSES,
//           TEXT_INPUT_CLASSES, SELECT_CLASSES
// Source: docs/zoom-design-analysis.md sections 1 and 3.2 (all buttons and inputs are 32px high, radius 8)
// =============================================================================

// Filled brand-blue button (Save, Start, Schedule a Meeting).
export const PRIMARY_BUTTON_CLASSES =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-control bg-zoom-blue px-4 text-[15px] font-medium text-white hover:brightness-110 disabled:opacity-60";

// Filled red button for destructive actions (confirming a delete).
export const DANGER_BUTTON_CLASSES =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-control bg-red-600 px-4 text-[15px] font-medium text-white hover:brightness-110 disabled:opacity-60";

// White button with a thin border (Copy Invitation, Edit, Delete, Save as Template).
export const OUTLINE_BUTTON_CLASSES =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-control border border-line bg-white px-4 text-[15px] hover:bg-soft disabled:opacity-60";

// Light blue-grey button with blue text (Cancel, Test Audio and Video).
export const SOFT_BUTTON_CLASSES =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-control bg-soft px-4 text-[15px] text-zoom-blue hover:brightness-95 disabled:opacity-60";

// Text and date inputs.
export const TEXT_INPUT_CLASSES =
  "h-8 w-full rounded-control border border-input-border bg-white px-3 text-[15px] outline-none focus:border-zoom-blue disabled:border-line disabled:bg-soft disabled:text-ink-muted";

// Native <select>; the chevron arrow is drawn by the SelectField component, so the browser's own arrow is removed.
export const SELECT_CLASSES =
  "h-8 w-full appearance-none rounded-control border border-input-border bg-white pr-8 pl-3 text-[15px] outline-none focus:border-zoom-blue";
