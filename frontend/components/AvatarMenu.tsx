"use client";

// =============================================================================
// File: components/AvatarMenu.tsx
// Purpose: The profile avatar at the right end of the navbar. Clicking it opens a small
//          dropdown with Profile and Settings placeholders (the brief asks for
//          "profile/settings placeholders"; the entries do nothing yet).
// Contains: AvatarMenu component
// =============================================================================

import { Settings, User as UserIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import Avatar from "@/components/Avatar";
import { useCurrentUser } from "@/components/CurrentUserProvider";

const AVATAR_SIZE_PX = 32;
const PLACEHOLDER_AVATAR_COLOR = "#d5d8e0"; // grey square shown while the user is still loading

// Purpose: Avatar button + dropdown menu.
// Output:  the avatar; the dropdown is visible only while it is open
// How it works: closes when you click outside it or press Escape.
export default function AvatarMenu() {
  const { currentUser } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Purpose: close the menu when the click happened outside of it.
    function closeOnOutsideClick(event: MouseEvent) {
      if (menuContainerRef.current && !menuContainerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    // Purpose: close the menu on the Escape key.
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    // Cleanup removes the listeners when the menu closes, so they never pile up.
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div ref={menuContainerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((wasOpen) => !wasOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Open profile menu"
        className="flex rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zoom-blue"
      >
        <Avatar
          name={currentUser?.name ?? ""}
          color={currentUser?.avatar_color ?? PLACEHOLDER_AVATAR_COLOR}
          sizePx={AVATAR_SIZE_PX}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-60 rounded-card border border-line bg-white p-1 shadow-card"
        >
          <div className="border-b border-line px-3 py-2">
            <p className="truncate text-sm font-semibold">{currentUser?.name ?? "Loading..."}</p>
            <p className="truncate text-xs text-ink-muted">{currentUser?.email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="mt-1 flex w-full items-center gap-2 rounded-control px-3 py-2 text-left text-sm hover:bg-soft"
          >
            <UserIcon size={16} aria-hidden="true" />
            Profile
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2 rounded-control px-3 py-2 text-left text-sm hover:bg-soft"
          >
            <Settings size={16} aria-hidden="true" />
            Settings
          </button>
        </div>
      )}
    </div>
  );
}
