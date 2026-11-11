"use client";

// =============================================================================
// File: components/SidebarDrawerProvider.tsx
// Purpose: Remembers whether the sidebar drawer is open on small screens (below 1024px the
//          sidebar is hidden and slides in over the page when the hamburger button is pressed).
//          The hamburger button (in the navbar) and the sidebar share this one flag.
// Contains: SidebarDrawerProvider, useSidebarDrawer
// =============================================================================

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface SidebarDrawerState {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const SidebarDrawerContext = createContext<SidebarDrawerState>({
  isOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
});

// Purpose: Hold the open/closed flag for everything below it.
// Input:   children - the header and the sidebar
// How it works: while the drawer is open the Escape key closes it.
export function SidebarDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const openDrawer = useCallback(() => setIsOpen(true), []);
  const closeDrawer = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    // Purpose: close the drawer on the Escape key.
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  // useMemo keeps the object the same between renders, so consumers re-render only when something really changed.
  const value = useMemo(() => ({ isOpen, openDrawer, closeDrawer }), [isOpen, openDrawer, closeDrawer]);
  return <SidebarDrawerContext.Provider value={value}>{children}</SidebarDrawerContext.Provider>;
}

// Purpose: Read the drawer state (and open/close it) from any component below the provider.
export function useSidebarDrawer(): SidebarDrawerState {
  return useContext(SidebarDrawerContext);
}
