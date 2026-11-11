// =============================================================================
// File: components/ZoomLogo.tsx
// Purpose: The "zoom" wordmark in brand blue. Drawn with text instead of copying
//          Zoom's trademarked logo artwork.
// Contains: ZoomLogo component
// =============================================================================

// Purpose: Render the wordmark.
// Output:  a bold blue "zoom" text element
export default function ZoomLogo() {
  return (
    // 42px: sized so the wordmark is ~110px wide like Zoom's (measured against the reference screenshot).
    <span className="text-[42px] leading-none font-extrabold tracking-tighter text-zoom-blue select-none">
      zoom
    </span>
  );
}
