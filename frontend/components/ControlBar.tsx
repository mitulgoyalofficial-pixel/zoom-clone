"use client";

// =============================================================================
// File: components/ControlBar.tsx
// Purpose: The black bar at the bottom of the room: Mute and Video on the left; Participants,
//          Chat, React, Share, Host tools (host only) and More in the middle; End / Leave on
//          the right. End opens Zoom's menu ("End Meeting for All" / "Leave Meeting" for the
//          host, "Leave Meeting" for guests), Host tools opens a small menu with Mute All.
//          Chat, React, More and the little chevrons are placeholders that do nothing.
// Contains: ControlBar component
// Source: docs/zoom-design-analysis.md sections 3.5 and 3.5.1
// =============================================================================

import {
  Ellipsis,
  Heart,
  MessageSquare,
  Mic,
  MicOff,
  ShieldCheck,
  Share2,
  Users,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { useState } from "react";

import ControlBarButton from "@/components/ControlBarButton";

interface ControlBarProps {
  isMuted: boolean;
  isCameraOn: boolean;
  isHost: boolean;
  participantCount: number;
  isParticipantsPanelOpen: boolean;
  hasCopiedShareLink: boolean; // true for two seconds after Share copied the link
  isLeaving: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleParticipantsPanel: () => void;
  onShare: () => void;
  onMuteAll: () => void;
  onLeave: () => void; // leaves the meeting; for the host this also ends it
}

const MENU_CLASSES = "absolute bottom-[58px] z-20 w-[250px] rounded-xl bg-[#232323] p-3 shadow-xl ring-1 ring-white/10";

// Purpose: Render the bar and its two pop-up menus.
// Input:   see ControlBarProps
// Output:  the bar; only one menu is open at a time
export default function ControlBar({
  isMuted,
  isCameraOn,
  isHost,
  participantCount,
  isParticipantsPanelOpen,
  hasCopiedShareLink,
  isLeaving,
  onToggleMute,
  onToggleCamera,
  onToggleParticipantsPanel,
  onShare,
  onMuteAll,
  onLeave,
}: ControlBarProps) {
  const [openMenu, setOpenMenu] = useState<"leave" | "host-tools" | null>(null);

  // Purpose: Open a menu, or close it if it is already the open one.
  function toggleMenu(menu: "leave" | "host-tools") {
    setOpenMenu((current) => (current === menu ? null : menu));
  }

  return (
    <div className="relative grid h-[58px] shrink-0 grid-cols-[1fr_auto_1fr] items-center bg-[#0d0d0d] px-4">
      <div className="flex items-center gap-1">
        <ControlBarButton
          label={isMuted ? "Unmute" : "Mute"}
          icon={isMuted ? <MicOff size={22} className="text-red-500" /> : <Mic size={22} />}
          hasChevron
          onClick={onToggleMute}
        />
        <ControlBarButton
          label="Video"
          ariaLabel={isCameraOn ? "Stop video" : "Start video"}
          icon={isCameraOn ? <Video size={22} /> : <VideoOff size={22} className="text-red-500" />}
          hasChevron
          onClick={onToggleCamera}
        />
      </div>

      <div className="flex items-center gap-1">
        <ControlBarButton
          label="Participants"
          icon={<Users size={22} />}
          badgeCount={participantCount}
          hasChevron
          isPressed={isParticipantsPanelOpen}
          onClick={onToggleParticipantsPanel}
        />
        <ControlBarButton label="Chat" icon={<MessageSquare size={22} />} hasChevron />
        <ControlBarButton label="React" icon={<Heart size={22} />} />
        <ControlBarButton
          label={hasCopiedShareLink ? "Link copied" : "Share"}
          ariaLabel="Share invite link"
          icon={<Share2 size={22} />}
          onClick={onShare}
        />
        {isHost && (
          <ControlBarButton
            label="Host tools"
            icon={<ShieldCheck size={22} />}
            isPressed={openMenu === "host-tools"}
            onClick={() => toggleMenu("host-tools")}
          />
        )}
        <ControlBarButton label="More" icon={<Ellipsis size={22} />} />
      </div>

      <div className="flex justify-end">
        <ControlBarButton
          label={isHost ? "End" : "Leave"}
          ariaLabel="End or leave the meeting"
          icon={
            <span className="flex size-6 items-center justify-center rounded-md border-2 border-red-500 text-red-500">
              <X size={14} strokeWidth={3} />
            </span>
          }
          isPressed={openMenu === "leave"}
          onClick={() => toggleMenu("leave")}
        />
      </div>

      {openMenu === "host-tools" && (
        <div role="menu" className={`${MENU_CLASSES} left-1/2 -translate-x-1/2`}>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onMuteAll();
              setOpenMenu(null);
            }}
            className="h-9 w-full rounded-md px-3 text-left text-[15px] hover:bg-white/10"
          >
            Mute all participants
          </button>
        </div>
      )}

      {openMenu === "leave" && (
        <div role="menu" className={`${MENU_CLASSES} right-4`}>
          {isHost && (
            <button
              type="button"
              role="menuitem"
              onClick={onLeave}
              disabled={isLeaving}
              className="h-10 w-full rounded-md bg-red-600 text-[15px] font-medium hover:brightness-110 disabled:opacity-60"
            >
              End Meeting for All
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={onLeave}
            disabled={isLeaving}
            className={`mt-2 h-10 w-full rounded-md text-[15px] disabled:opacity-60 ${isHost ? "bg-[#3a3a3a] hover:brightness-110" : "bg-red-600 font-medium hover:brightness-110"}`}
          >
            Leave Meeting
          </button>
          <div className="mt-3 flex items-center justify-between text-sm text-white/80">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="size-4 accent-zoom-blue" />
              Give feedback
            </label>
            <button type="button" onClick={() => setOpenMenu(null)} className="h-8 rounded-md bg-[#3a3a3a] px-4 hover:brightness-110">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
