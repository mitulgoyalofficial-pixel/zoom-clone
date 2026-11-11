"use client";

// =============================================================================
// File: components/PreJoinScreen.tsx
// Purpose: The screen shown before entering a meeting (opened by New Meeting, Start, the Join
//          page and invite links: /join/{code}, with ?host=1 for the host and ?pwd= for the
//          passcode). It shows a camera preview, the mic and camera toggles, a name field
//          (and a passcode field when the meeting needs one) and the Join button.
//          Zoom's own pre-join screenshot was not available, so the layout is our own, in the
//          same light style as the Join page.
// Contains: PreJoinScreen (loads the meeting), PreJoinForm (the screen itself), ToggleButton
// =============================================================================

import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import Avatar from "@/components/Avatar";
import { useCurrentUser } from "@/components/CurrentUserProvider";
import LocalVideo from "@/components/LocalVideo";
import { useApiData } from "@/hooks/useApiData";
import { useLocalCamera } from "@/hooks/useLocalCamera";
import { ApiError, fetchMeetingByCode, joinMeeting, setParticipantMuted } from "@/lib/apiClient";
import type { PublicMeeting } from "@/lib/apiTypes";
import { getAvatarColorForName } from "@/lib/avatarColor";
import { formatMeetingCode } from "@/lib/formatters";
import { saveMeetingSession } from "@/lib/meetingSession";
import { TEXT_INPUT_CLASSES } from "@/lib/uiClasses";

const PASSCODE_REJECTED_STATUS = 403;

// Purpose: Load the meeting named in the URL and show loading, error, "ended" or the join form.
// Output:  the page content
export default function PreJoinScreen() {
  const { code: meetingCode } = useParams<{ code: string }>();

  // useCallback keeps the function identity stable, which useApiData requires (see that hook's note).
  const loadMeeting = useCallback(() => fetchMeetingByCode(meetingCode), [meetingCode]);
  const { data: meeting, isLoading, errorMessage } = useApiData(loadMeeting);

  if (isLoading) {
    return <p className="mx-auto mt-24 text-ink-muted">Checking meeting...</p>;
  }
  if (errorMessage || !meeting) {
    return (
      <div role="alert" className="mx-auto mt-24 text-center">
        <p className="text-lg font-semibold text-red-600">{errorMessage ?? "Meeting not found."}</p>
        <Link href="/join" className="mt-4 inline-block text-zoom-blue hover:underline">
          Try another meeting ID
        </Link>
      </div>
    );
  }
  if (meeting.status === "ended") {
    return (
      <div className="mx-auto mt-24 text-center">
        <p className="text-lg font-semibold">This meeting has ended.</p>
        <Link href="/" className="mt-4 inline-block text-zoom-blue hover:underline">
          Back to home
        </Link>
      </div>
    );
  }
  return <PreJoinForm meeting={meeting} />;
}

// Purpose: A round-cornered toggle with an icon, used for the microphone and the camera.
// Input:   isOn; labelWhenOn / labelWhenOff - the button text for each state; onToggle
// Output:  the button; the icon is red and slashed when the device is off, like Zoom's bar
function ToggleButton({
  isOn,
  labelWhenOn,
  labelWhenOff,
  iconWhenOn: IconWhenOn,
  iconWhenOff: IconWhenOff,
  onToggle,
}: {
  isOn: boolean;
  labelWhenOn: string;
  labelWhenOff: string;
  iconWhenOn: typeof Mic;
  iconWhenOff: typeof MicOff;
  onToggle: () => void;
}) {
  const Icon = isOn ? IconWhenOn : IconWhenOff;
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex h-10 items-center gap-2 rounded-control border border-line bg-white px-4 text-[15px] hover:bg-soft"
    >
      <Icon size={18} className={isOn ? "" : "text-red-600"} aria-hidden="true" />
      {isOn ? labelWhenOn : labelWhenOff}
    </button>
  );
}

// Purpose: The pre-join screen for a meeting that exists and has not ended.
// Input:   meeting - the public meeting details (has_passcode tells whether a passcode is needed)
// Output:  preview and toggles on the left, name / passcode / Join on the right
function PreJoinForm({ meeting }: { meeting: PublicMeeting }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useCurrentUser();

  const isHost = searchParams.get("host") === "1";
  const passcodeFromLink = searchParams.get("pwd");

  // Zoom starts muted with the camera preview on. null in the typed* values = "the user has not typed yet".
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [typedName, setTypedName] = useState<string | null>(null);
  const [typedPasscode, setTypedPasscode] = useState("");
  const [passcodeWasRejected, setPasscodeWasRejected] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { stream, errorMessage: cameraErrorMessage } = useLocalCamera(isCameraOn);

  // The host's name is filled in from the account; a guest types their own.
  const displayName = typedName ?? (isHost ? (currentUser?.name ?? "") : "");
  // Guests need a passcode when the meeting has one: from the link, or typed. The host never does.
  const needsPasscodeField = !isHost && meeting.has_passcode && (!passcodeFromLink || passcodeWasRejected);
  const passcodeToSend = passcodeFromLink && !passcodeWasRejected ? passcodeFromLink : typedPasscode.trim();

  const canJoin = displayName.trim() !== "" && (!needsPasscodeField || typedPasscode.trim() !== "") && !isJoining;

  // Purpose: Join button: enter the meeting, remember who we are, and open the room.
  // Input:   the form submit event
  async function enterMeeting(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsJoining(true);
    setErrorMessage(null);

    try {
      const participant = await joinMeeting(meeting.meeting_code, {
        display_name: displayName.trim(),
        passcode: meeting.has_passcode && !isHost ? passcodeToSend : null,
        as_host: isHost,
      });
      saveMeetingSession(meeting.meeting_code, {
        participantId: participant.id,
        displayName: participant.display_name,
        role: participant.role,
        isCameraOn,
      });
      // Everyone starts unmuted on the server; follow the microphone toggle chosen here.
      if (!isMicOn) {
        await setParticipantMuted(meeting.meeting_code, participant.id, true).catch(() => undefined);
      }
      router.push(`/room/${meeting.meeting_code}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === PASSCODE_REJECTED_STATUS && !isHost) {
        // Wrong passcode: make sure the passcode box is visible so it can be corrected.
        setPasscodeWasRejected(true);
      }
      setErrorMessage(error instanceof ApiError ? error.message : "Could not join the meeting. Please try again.");
    }
    setIsJoining(false);
  }

  return (
    <div className="mx-auto grid w-full max-w-[920px] gap-6 px-4 py-6 sm:gap-10 sm:px-6 sm:py-10 md:grid-cols-[480px_1fr]">
      <section>
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-card bg-[#1c1c1c] text-white">
          {stream ? (
            <LocalVideo stream={stream} className="size-full" />
          ) : (
            <div className="flex flex-col items-center gap-3 px-4 text-center">
              <Avatar
                name={displayName || "?"}
                color={getAvatarColorForName(displayName)}
                sizePx={88}
                className="rounded-[10px]"
              />
              <p className="text-sm text-white/70">{cameraErrorMessage ?? "Your camera is off"}</p>
            </div>
          )}
          {displayName && (
            <span className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-0.5 text-sm">{displayName}</span>
          )}
        </div>

        <div className="mt-4 flex gap-3">
          <ToggleButton
            isOn={isMicOn}
            labelWhenOn="Mute"
            labelWhenOff="Unmute"
            iconWhenOn={Mic}
            iconWhenOff={MicOff}
            onToggle={() => setIsMicOn((wasOn) => !wasOn)}
          />
          <ToggleButton
            isOn={isCameraOn}
            labelWhenOn="Stop Video"
            labelWhenOff="Start Video"
            iconWhenOn={Video}
            iconWhenOff={VideoOff}
            onToggle={() => setIsCameraOn((wasOn) => !wasOn)}
          />
        </div>
      </section>

      <form onSubmit={enterMeeting} noValidate>
        <h1 className="text-2xl font-bold">{meeting.title}</h1>
        <p className="mt-1 text-[15px] text-ink-muted">Meeting ID {formatMeetingCode(meeting.meeting_code)}</p>
        <p className="mt-1 text-[15px] text-ink-muted">Joining as {isHost ? "host" : "participant"}</p>

        <label htmlFor="display-name" className="mt-6 block text-[15px]">
          Your name
        </label>
        <input
          id="display-name"
          type="text"
          value={displayName}
          maxLength={100}
          placeholder="Enter your name"
          onChange={(event) => setTypedName(event.target.value)}
          className={`mt-1.5 ${TEXT_INPUT_CLASSES}`}
        />

        {needsPasscodeField && (
          <>
            <label htmlFor="meeting-passcode" className="mt-4 block text-[15px]">
              Meeting passcode
            </label>
            <input
              id="meeting-passcode"
              type="text"
              value={typedPasscode}
              maxLength={10}
              placeholder="Enter the passcode"
              onChange={(event) => setTypedPasscode(event.target.value)}
              className={`mt-1.5 ${TEXT_INPUT_CLASSES}`}
            />
          </>
        )}

        {errorMessage && (
          <p role="alert" className="mt-4 text-[15px] text-red-600">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={!canJoin}
          className="mt-6 h-[38px] w-full rounded-control bg-zoom-blue text-base font-medium text-white hover:brightness-110 disabled:bg-[#ecedf2] disabled:text-ink-muted disabled:hover:brightness-100"
        >
          {isJoining ? "Joining..." : "Join"}
        </button>
        <Link href="/" className="mt-4 block text-center text-[15px] text-zoom-blue hover:underline">
          Cancel
        </Link>
      </form>
    </div>
  );
}
