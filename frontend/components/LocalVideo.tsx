"use client";

// =============================================================================
// File: components/LocalVideo.tsx
// Purpose: Shows a live camera stream in a <video> element (the pre-join preview and your own
//          tile in the room).
// Contains: LocalVideo component
// =============================================================================

import { useEffect, useRef } from "react";

// Purpose: Play a MediaStream.
// Input:   stream - from useLocalCamera; className - sizing classes from the parent
// Output:  the video, mirrored like a mirror (Zoom shows your own picture mirrored)
export default function LocalVideo({ stream, className = "" }: { stream: MediaStream; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // srcObject can only be set from code, not as an HTML attribute.
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // muted: there is no audio track, and browsers only autoplay muted videos.
  return <video ref={videoRef} autoPlay muted playsInline className={`-scale-x-100 object-cover ${className}`} />;
}
