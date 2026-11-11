"use client";

// =============================================================================
// File: hooks/useIsClient.ts
// Purpose: Tells a component whether it is running in the browser yet. Pages are prerendered
//          on the server at build time, so anything that depends on "now" or on the viewer's
//          time zone (today's date, the next half hour) must only be created in the browser,
//          otherwise the build-time value would be frozen into the page and clash on hydration.
// Contains: useIsClient hook
// =============================================================================

import { useSyncExternalStore } from "react";

// Nothing ever changes, so there is nothing to subscribe to.
function subscribeToNothing() {
  return () => {};
}

// Purpose: false while rendering on the server and during hydration, true afterwards in the browser.
// Output:  boolean
// How it works: useSyncExternalStore uses the third argument on the server and during hydration,
//   and the second one afterwards. This is the officially supported way to detect "client only".
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}
