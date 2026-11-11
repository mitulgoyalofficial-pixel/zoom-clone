"use client";

// =============================================================================
// File: hooks/useApiData.ts
// Purpose: A reusable hook that loads data from the backend when a component appears
//          and reports the three states every screen needs: loading, error, data.
//          Also offers reload() for a "Try again" button.
// Contains: useApiData hook
// Note: the fetch function must have a STABLE identity (a function from lib/apiClient.ts,
//       or one wrapped in useCallback), otherwise the effect would re-run on every render.
// =============================================================================

import { useCallback, useEffect, useState } from "react";

import { ApiError } from "@/lib/apiClient";

const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

interface ApiDataState<T> {
  data: T | null;
  isLoading: boolean;
  errorMessage: string | null;
}

// Purpose: Load data once when the component shows up (and again after reload()).
// Input:   fetchData - a function from lib/apiClient.ts that returns a Promise
// Output:  { data, isLoading, errorMessage, reload }
// How it works: with the cache-components navigation, a page that was hidden and is shown
//   again re-runs its effects, so the data is refreshed when you come back to the page.
export function useApiData<T>(fetchData: () => Promise<T>) {
  const [state, setState] = useState<ApiDataState<T>>({ data: null, isLoading: true, errorMessage: null });
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    // Ignore an answer that arrives after the component was hidden or the request was replaced.
    let isCancelled = false;

    fetchData()
      .then((data) => {
        if (!isCancelled) {
          setState({ data, isLoading: false, errorMessage: null });
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          const errorMessage = error instanceof ApiError ? error.message : GENERIC_ERROR_MESSAGE;
          setState({ data: null, isLoading: false, errorMessage });
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [fetchData, reloadCount]);

  // Purpose: Load again (the "Try again" button). Shows the loading state straight away.
  const reload = useCallback(() => {
    setState((previous) => ({ ...previous, isLoading: true, errorMessage: null }));
    setReloadCount((count) => count + 1);
  }, []);

  return { ...state, reload };
}
