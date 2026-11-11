// =============================================================================
// File: components/ParticipantsPanel.tsx
// Purpose: The side panel listing everyone in the meeting (Participants button). Each row has
//          the avatar, name, role and microphone state. The host also gets a Remove button on
//          every other row and a "Mute All" button at the bottom.
//          Zoom's own panel was not captured, so this is our design in the room's dark style.
// Contains: ParticipantsPanel component
// =============================================================================

import { Mic, MicOff, X } from "lucide-react";

import Avatar from "@/components/Avatar";
import type { Participant } from "@/lib/apiTypes";
import { getAvatarColorForName } from "@/lib/avatarColor";

interface ParticipantsPanelProps {
  participants: Participant[];
  myParticipantId: number;
  isHost: boolean; // shows the host-only buttons
  onClose: () => void;
  onRemove: (participantId: number) => void;
  onMuteAll: () => void;
}

// Purpose: Render the panel.
// Input:   see ParticipantsPanelProps
// Output:  a 320px dark panel with a header, the list and (for the host) the Mute All button
export default function ParticipantsPanel({
  participants,
  myParticipantId,
  isHost,
  onClose,
  onRemove,
  onMuteAll,
}: ParticipantsPanelProps) {
  return (
    <aside aria-label="Participants" className="flex w-[320px] shrink-0 flex-col border-l border-white/10 bg-[#232323]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="text-[15px] font-semibold">Participants ({participants.length})</h2>
        <button type="button" onClick={onClose} aria-label="Close participants panel" className="rounded p-1 hover:bg-white/10">
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <ul className="flex-1 overflow-y-auto px-2 py-2">
        {participants.map((participant) => {
          const isMe = participant.id === myParticipantId;
          return (
            <li key={participant.id} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-white/5">
              <Avatar
                name={participant.display_name}
                color={getAvatarColorForName(participant.display_name)}
                sizePx={32}
                className="rounded-full"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {participant.display_name}
                  {isMe && " (Me)"}
                </p>
                {participant.role === "host" && <p className="text-xs text-white/60">Host</p>}
              </div>
              {participant.is_muted ? (
                <MicOff size={16} className="text-red-500" aria-label="Muted" />
              ) : (
                <Mic size={16} className="text-white/70" aria-label="Unmuted" />
              )}
              {isHost && !isMe && (
                <button
                  type="button"
                  onClick={() => onRemove(participant.id)}
                  className="rounded px-2 py-1 text-xs text-red-400 hover:bg-white/10"
                  aria-label={`Remove ${participant.display_name}`}
                >
                  Remove
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {isHost && (
        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={onMuteAll}
            className="h-9 w-full rounded-md border border-white/20 text-sm hover:bg-white/10"
          >
            Mute All
          </button>
        </div>
      )}
    </aside>
  );
}
