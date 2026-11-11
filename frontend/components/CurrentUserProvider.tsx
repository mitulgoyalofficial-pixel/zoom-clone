"use client";

// =============================================================================
// File: components/CurrentUserProvider.tsx
// Purpose: Loads the logged-in user from the backend ONCE and shares it with every
//          component below it (navbar avatar, profile card), so they do not each
//          call GET /api/me themselves.
// Contains: CurrentUserProvider (wrap the page in it), useCurrentUser() (read it)
// =============================================================================

import { createContext, useContext, useEffect, useState } from "react";

import { ApiError, fetchCurrentUser } from "@/lib/apiClient";
import type { User } from "@/lib/apiTypes";

interface CurrentUserState {
  currentUser: User | null;
  isLoadingUser: boolean;
  userErrorMessage: string | null;
}

const LOADING_STATE: CurrentUserState = { currentUser: null, isLoadingUser: true, userErrorMessage: null };

const CurrentUserContext = createContext<CurrentUserState>(LOADING_STATE);

// Purpose: Fetch the current user when the page opens and provide it to children.
// Input:   children - everything that may call useCurrentUser()
// Output:  the children, wrapped in the context
export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CurrentUserState>(LOADING_STATE);

  useEffect(() => {
    // Guards against updating state after this component has gone away (hidden route or unmount).
    let isCancelled = false;

    fetchCurrentUser()
      .then((user) => {
        if (!isCancelled) {
          setState({ currentUser: user, isLoadingUser: false, userErrorMessage: null });
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          const message = error instanceof ApiError ? error.message : "Could not load your profile.";
          setState({ currentUser: null, isLoadingUser: false, userErrorMessage: message });
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  return <CurrentUserContext.Provider value={state}>{children}</CurrentUserContext.Provider>;
}

// Purpose: Read the logged-in user inside any component below CurrentUserProvider.
// Output:  { currentUser, isLoadingUser, userErrorMessage }; currentUser is null while loading or on error
export function useCurrentUser(): CurrentUserState {
  return useContext(CurrentUserContext);
}
