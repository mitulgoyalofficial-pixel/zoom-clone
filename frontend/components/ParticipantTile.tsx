// =============================================================================
// File: components/ParticipantTile.tsx
// Purpose: One person's square on the room's stage: their avatar in the middle (or your own
//          camera picture), and a small name tag with a red slashed microphone when muted.
//          There is no real video between people, so everyone else always shows the avatar.
// Contains: ParticipantTile component
// Source: docs/zoom-design-analysis.md section 3.5
// =============================================================================

import { MicOff } from "lucide-react";

import Avatar from "@/components/Avatar";
import LocalVideo from "@/components/LocalVideo";
import type { Participant } from "@/lib/apiTypes";
import { getAvatarColorForName } from "@/lib/avatarColor";

interface ParticipantTileProps {
  participant: Participant;
  cameraStream: MediaStream | null; // only passed for your own tile, and only when your camera is on
  isAlone: boolean; // true when this is the only person on the stage: big avatar, no tile background (like Zoom)
}

// Purpose: Render one tile.
// Input:   see ParticipantTileProps
// Output:  a dark tile filling its grid cell
export default function ParticipantTile({ participant, cameraStream, isAlone }: ParticipantTileProps) {
  return (
    <div className={`relative flex size-full items-center justify-center overflow-hidden rounded-lg ${isAlone ? "" : "bg-[#232323]"}`}>
      {cameraStream ? (
        <LocalVideo stream={cameraStream} className="absolute inset-0 size-full" />
      ) : (
        <Avatar
          name={participant.display_name}
          color={getAvatarColorForName(participant.display_name)}
          sizePx={isAlone ? 96 : 64}
          className="rounded-md"
        />
      )}

      <span className="absolute bottom-2 left-2 flex max-w-[calc(100%-16px)] items-center gap-1.5 rounded bg-black/60 px-2 py-0.5 text-sm">
        {participant.is_muted && <MicOff size={14} className="shrink-0 text-red-500" aria-label="Muted" />}
        <span className="truncate">{participant.display_name}</span>
      </span>
    </div>
  );
}
