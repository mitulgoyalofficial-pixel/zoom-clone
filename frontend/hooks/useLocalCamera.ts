"use client";

// =============================================================================
// File: hooks/useLocalCamera.ts
// Purpose: Switches the user's camera on and off for the pre-join preview and the room, using
//          getUserMedia, and explains in plain words when that is not possible.
// Contains: useLocalCamera hook
// =============================================================================

import { useEffect, useState } from "react";

// Purpose: Turn a getUserMedia error into a message for the user.
// Input:   error - whatever the browser rejected with
// Output:  a short sentence
function describeCameraError(error: unknown): string {
  const errorName = error instanceof Error ? error.name : "";
  if (errorName === "NotAllowedError") {
    return "Camera access is blocked. Allow it in your browser's site settings.";
  }
  if (errorName === "NotFoundError") {
    return "No camera was found on this device.";
  }
  if (errorName === "NotReadableError") {
    return "The camera is being used by another app.";
  }
  return "The camera could not be started.";
}

// Purpose: Give a live camera stream while `isWanted` is true.
// Input:   isWanted - true to have the camera on
// Output:  { stream, errorMessage }; stream is null while the camera is off, loading or failed
// How it works: when isWanted becomes true the browser asks for permission and returns a
//   MediaStream; when it becomes false (or the component goes away) every track is stopped,
//   which also switches the camera's light off.
export function useLocalCamera(isWanted: boolean) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isWanted) {
      return;
    }

    // Guards against an answer arriving after the effect was cleaned up.
    let isCancelled = false;
    let activeStream: MediaStream | null = null;

    // The async wrapper turns a missing API (page not on https/localhost) into the same error path.
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("unsupported");
      }
      return navigator.mediaDevices.getUserMedia({ video: true });
    })()
      .then((newStream) => {
        if (isCancelled) {
          newStream.getTracks().forEach((track) => track.stop());
          return;
        }
        activeStream = newStream;
        setStream(newStream);
        setErrorMessage(null);
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          setStream(null);
          setErrorMessage(describeCameraError(error));
        }
      });

    return () => {
      isCancelled = true;
      activeStream?.getTracks().forEach((track) => track.stop());
    };
  }, [isWanted]);

  // While the camera is off the old stream and error must not be shown, even if state still holds them.
  return { stream: isWanted ? stream : null, errorMessage: isWanted ? errorMessage : null };
}
