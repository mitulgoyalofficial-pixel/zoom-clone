"use client";

// =============================================================================
// File: components/SidebarToggleButton.tsx
// Purpose: The hamburger button at the left end of the navbar that opens the sidebar drawer.
//          It only exists below 1024px; on larger screens the sidebar is always visible.
// Contains: SidebarToggleButton component
// =============================================================================

import { Menu } from "lucide-react";

import { useSidebarDrawer } from "@/components/SidebarDrawerProvider";

// Purpose: Render the hamburger button.
// Output:  a 36px icon button, hidden from 1024px (lg) upwards
export default function SidebarToggleButton() {
  const { openDrawer } = useSidebarDrawer();

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label="Open menu"
      className="mr-2 flex size-9 items-center justify-center rounded-control hover:bg-soft lg:hidden"
    >
      <Menu size={22} aria-hidden="true" />
    </button>
  );
}
