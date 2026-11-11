"use client";

// =============================================================================
// File: components/MeetingRoom.tsx
// Purpose: The live meeting room (/room/{code}): dark stage with one tile per person, top bar,
//          bottom control bar, the participants panel, and the messages for "you were removed",
//          "meeting ended" and so on. There is no real video between people; the room keeps
//          itself up to date by asking the backend who is inside every few seconds.
// Contains: MeetingRoom (client-only entry), RoomEntrance (reads who you are), RoomContent (the room)
// Source: docs/zoom-design-analysis.md sections 3.5 and 3.5.1
// =============================================================================

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import ControlBar from "@/components/ControlBar";
import ParticipantsPanel from "@/components/ParticipantsPanel";
import ParticipantTile from "@/components/ParticipantTile";
import RoomNotice from "@/components/RoomNotice";
import RoomTopBar from "@/components/RoomTopBar";
import { useApiData } from "@/hooks/useApiData";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useIsClient } from "@/hooks/useIsClient";
import { useLocalCamera } from "@/hooks/useLocalCamera";
import {
  ApiError,
  buildLeaveUrl,
  fetchMeetingByCode,
  fetchMeetingDetails,
  fetchParticipants,
  leaveMeeting,
  muteAllParticipants,
  removeParticipant,
  setParticipantMuted,
} from "@/lib/apiClient";
import type { MeetingStatus, Participant } from "@/lib/apiTypes";
import { clearMeetingSession, readMeetingSession, type MeetingSession } from "@/lib/meetingSession";

const POLL_INTERVAL_MS = 3000; // "polled every few seconds" (CLAUDE.md)

interface RoomState {
  participants: Participant[];
  meetingStatus: MeetingStatus;
  wasRemoved: boolean;
  isMeetingGone: boolean; // the backend answered 404: the meeting was deleted
  hasLoaded: boolean; // false until the first poll answered, so we do not show "you left" too early
}

const INITIAL_ROOM_STATE: RoomState = {
  participants: [],
  meetingStatus: "live",
  wasRemoved: false,
  isMeetingGone: false,
  hasLoaded: false,
};

// Purpose: Entry point; the room only makes sense in the browser (it reads sessionStorage and the camera).
// Output:  a loading line on the server, the room in the browser
export default function MeetingRoom() {
  const { code: meetingCode } = useParams<{ code: string }>();
  const isClient = useIsClient();
  // bfcacheId changes on every fresh navigation to this page. Using it as a key makes RoomEntrance
  // read the session again each time, instead of reusing the (hidden) room of an earlier visit with
  // a stale participant id. Back/forward navigation keeps the same key, so nothing is lost there.
  const { bfcacheId } = useRouter();

  if (!isClient) {
    return <p className="p-8 text-white/70">Loading meeting...</p>;
  }
  return <RoomEntrance key={bfcacheId} meetingCode={meetingCode} />;
}

// Purpose: Find out who the person is in this meeting (from the pre-join step).
// Input:   meetingCode
// Output:  the room, or a redirect to the pre-join screen when there is no session (a direct visit to /room/...)
function RoomEntrance({ meetingCode }: { meetingCode: string }) {
  const router = useRouter();
  const [session] = useState(() => readMeetingSession(meetingCode));

  useEffect(() => {
    if (!session) {
      router.replace(`/join/${meetingCode}`);
    }
  }, [session, meetingCode, router]);

  if (!session) {
    return <p className="p-8 text-white/70">Taking you to the join screen...</p>;
  }
  return <RoomContent meetingCode={meetingCode} session={session} />;
}

// Purpose: The room itself.
// Input:   meetingCode; session - who this tab is (participant id, name, role, camera choice)
// Output:  top bar, stage, optional participants panel, control bar and any full-screen notice
function RoomContent({ meetingCode, session }: { meetingCode: string; session: MeetingSession }) {
  const router = useRouter();
  const isHost = session.role === "host";

  const [roomState, setRoomState] = useState<RoomState>(INITIAL_ROOM_STATE);
  const [hasConnectionProblem, setHasConnectionProblem] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(session.isCameraOn);
  const [isParticipantsPanelOpen, setIsParticipantsPanelOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const { copyText: copyShareLink, hasCopied: hasCopiedShareLink } = useCopyToClipboard();

  // --- Meeting title and the link Share copies ----------------------------------------------------
  // The host gets the full invite link (with passcode) from the details endpoint; guests copy the plain join link.
  const loadRoomInfo = useCallback(async () => {
    const meeting = await fetchMeetingByCode(meetingCode);
    const shareLink = isHost
      ? (await fetchMeetingDetails(meetingCode)).invite_link
      : `${window.location.origin}/join/${meetingCode}`;
    return { title: meeting.title, shareLink };
  }, [meetingCode, isHost]);
  const { data: roomInfo } = useApiData(loadRoomInfo);

  // --- Polling: who is in the meeting? --------------------------------------------------------------
  const refreshParticipants = useCallback(async () => {
    try {
      const list = await fetchParticipants(meetingCode, session.participantId);
      setRoomState({
        participants: list.participants,
        meetingStatus: list.meeting_status,
        wasRemoved: list.was_removed,
        isMeetingGone: false,
        hasLoaded: true,
      });
      setHasConnectionProblem(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setRoomState((previous) => ({ ...previous, isMeetingGone: true, hasLoaded: true }));
      } else {
        setHasConnectionProblem(true); // keep showing the last known state while the connection is down
      }
    }
  }, [meetingCode, session.participantId]);

  useEffect(() => {
    // The first answer is requested straight away (0 ms timer, so it runs as a callback and not inline
    // in the effect), then again every few seconds.
    const firstCall = setTimeout(refreshParticipants, 0);
    const timer = setInterval(refreshParticipants, POLL_INTERVAL_MS);
    // With Cache Components a hidden page runs this cleanup, so polling stops when you navigate away.
    return () => {
      clearTimeout(firstCall);
      clearInterval(timer);
    };
  }, [refreshParticipants]);

  // --- Closing the tab: tell the backend, so nobody stays in the list as a ghost ---------------------------
  // Guests only: a host leaving ends the meeting for everybody, and a page reload also fires "pagehide",
  // which would end the meeting by accident. (A host who just closes the tab stays listed; known limitation.)
  useEffect(() => {
    if (isHost) {
      return;
    }
    // sendBeacon is made for this moment: the request still goes out while the page is being closed.
    function leaveQuietly() {
      navigator.sendBeacon(buildLeaveUrl(meetingCode, session.participantId));
    }
    window.addEventListener("pagehide", leaveQuietly);
    // The browser's Back button leaves the room inside the app without closing the page.
    window.addEventListener("popstate", leaveQuietly);
    return () => {
      window.removeEventListener("pagehide", leaveQuietly);
      window.removeEventListener("popstate", leaveQuietly);
    };
  }, [isHost, meetingCode, session.participantId]);

  // --- What is the person's situation? -------------------------------------------------------------------
  const me = roomState.participants.find((participant) => participant.id === session.participantId);
  const isMuted = me?.is_muted ?? true;

  let notice: { title: string; message: string; canRejoin: boolean } | null = null;
  if (roomState.hasLoaded && !isLeaving) {
    if (roomState.isMeetingGone) {
      notice = { title: "This meeting is no longer available", message: "The host deleted this meeting.", canRejoin: false };
    } else if (roomState.wasRemoved) {
      notice = { title: "You were removed from the meeting", message: "The host removed you from this meeting.", canRejoin: false };
    } else if (roomState.meetingStatus === "ended") {
      notice = { title: "This meeting has ended", message: "The host ended the meeting for everyone.", canRejoin: false };
    } else if (!me) {
      notice = { title: "You are no longer in this meeting", message: "You left the meeting or lost the connection.", canRejoin: true };
    }
  }

  // Forget the session as soon as the person is out of the meeting.
  useEffect(() => {
    if (notice) {
      clearMeetingSession(meetingCode);
    }
  }, [notice, meetingCode]);

  // The camera is switched off while a notice is showing.
  const { stream: cameraStream, errorMessage: cameraErrorMessage } = useLocalCamera(isCameraOn && !notice && !isLeaving);

  // --- Actions ---------------------------------------------------------------------------------------------
  // Purpose: Run one backend action and show a message if it fails.
  // Input:   action - the call to make; failureMessage - what to tell the user if it fails
  async function runAction(action: () => Promise<unknown>, failureMessage: string) {
    setActionErrorMessage(null);
    try {
      await action();
      await refreshParticipants();
    } catch (error) {
      setActionErrorMessage(error instanceof ApiError ? error.message : failureMessage);
    }
  }

  // Purpose: Mute / Unmute button.
  function toggleMute() {
    runAction(() => setParticipantMuted(meetingCode, session.participantId, !isMuted), "Could not change your microphone.");
  }

  // Purpose: Share button: copy the invite link.
  function shareLink() {
    copyShareLink(roomInfo?.shareLink ?? `${window.location.origin}/join/${meetingCode}`);
  }

  // Purpose: End / Leave: tell the backend (the host leaving ends the meeting), then go home.
  async function leaveRoom() {
    setIsLeaving(true);
    try {
      await leaveMeeting(meetingCode, session.participantId);
    } catch {
      // Even if the call fails (the meeting may already be gone) the person still wants out.
    }
    clearMeetingSession(meetingCode);
    router.push("/");
  }

  // --- Stage layout -------------------------------------------------------------------------------------------
  const participantCount = roomState.participants.length;
  const columnCount = participantCount <= 1 ? 1 : participantCount <= 4 ? 2 : participantCount <= 9 ? 3 : 4;

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-[#1c1c1c] text-white">
      <RoomTopBar title={roomInfo?.title ?? "Meeting"} />

      <div className="relative flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1 p-2">
          {participantCount === 0 ? (
            <p className="p-6 text-white/60">Joining the meeting...</p>
          ) : (
            <div
              className="grid size-full auto-rows-fr gap-2"
              style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
            >
              {roomState.participants.map((participant) => (
                <ParticipantTile
                  key={participant.id}
                  participant={participant}
                  isAlone={participantCount === 1}
                  // Only your own tile can show a real camera picture.
                  cameraStream={participant.id === session.participantId ? cameraStream : null}
                />
              ))}
            </div>
          )}

          {(actionErrorMessage || (isCameraOn && cameraErrorMessage) || hasConnectionProblem) && (
            <p role="alert" className="absolute top-3 left-1/2 -translate-x-1/2 rounded-md bg-black/80 px-4 py-2 text-sm">
              {actionErrorMessage ?? (hasConnectionProblem ? "Connection problem. Trying to reconnect..." : cameraErrorMessage)}
            </p>
          )}
        </div>

        {isParticipantsPanelOpen && (
          <ParticipantsPanel
            participants={roomState.participants}
            myParticipantId={session.participantId}
            isHost={isHost}
            onClose={() => setIsParticipantsPanelOpen(false)}
            onRemove={(participantId) =>
              runAction(() => removeParticipant(meetingCode, participantId, session.participantId), "Could not remove that person.")
            }
            onMuteAll={() =>
              runAction(() => muteAllParticipants(meetingCode, session.participantId), "Could not mute everyone.")
            }
          />
        )}
      </div>

      <ControlBar
        isMuted={isMuted}
        isCameraOn={isCameraOn}
        isHost={isHost}
        participantCount={participantCount}
        isParticipantsPanelOpen={isParticipantsPanelOpen}
        hasCopiedShareLink={hasCopiedShareLink}
        isLeaving={isLeaving}
        onToggleMute={toggleMute}
        onToggleCamera={() => setIsCameraOn((wasOn) => !wasOn)}
        onToggleParticipantsPanel={() => setIsParticipantsPanelOpen((wasOpen) => !wasOpen)}
        onShare={shareLink}
        onMuteAll={() => runAction(() => muteAllParticipants(meetingCode, session.participantId), "Could not mute everyone.")}
        onLeave={leaveRoom}
      />

      {notice && (
        <RoomNotice
          title={notice.title}
          message={notice.message}
          rejoinHref={notice.canRejoin ? `/join/${meetingCode}${isHost ? "?host=1" : ""}` : undefined}
        />
      )}
    </div>
  );
}
