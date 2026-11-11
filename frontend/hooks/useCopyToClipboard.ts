"use client";

// =============================================================================
// File: hooks/useCopyToClipboard.ts
// Purpose: A hook behind every "Copy" button: copies text to the clipboard and remembers for
//          two seconds that it just did, so the button can show "Copied".
// Contains: useCopyToClipboard hook
// =============================================================================

import { useCallback, useEffect, useRef, useState } from "react";

const COPIED_MESSAGE_DURATION_MS = 2000;

// Purpose: Provide a copy function and a "just copied" flag.
// Output:  { copyText, hasCopied }
// How it works: navigator.clipboard works on https pages and on localhost; if the browser
//   blocks it, nothing is shown (the page keeps working).
export function useCopyToClipboard() {
  const [hasCopied, setHasCopied] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stop a pending timer when the component goes away, so it cannot update state afterwards.
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  // Purpose: Copy text and show "Copied" for a moment.
  // Input:   text - what to put on the clipboard
  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return; // clipboard blocked by the browser: leave the button as it is
    }
    setHasCopied(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => setHasCopied(false), COPIED_MESSAGE_DURATION_MS);
  }, []);

  return { copyText, hasCopied };
}
