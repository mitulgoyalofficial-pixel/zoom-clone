"use client";

// =============================================================================
// File: components/JoinMeetingForm.tsx
// Purpose: The content of the Join page (zoom.us/join look): a title, the "Meeting ID or
//          Personal Link Name" box and a Join button that stays grey until something is typed.
//          Join checks that the meeting exists, then opens its pre-join screen.
// Contains: JoinMeetingForm component
// Source: docs/zoom-design-analysis.md section 3.3
// =============================================================================

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError, fetchMeetingByCode } from "@/lib/apiClient";
import { parseMeetingInput } from "@/lib/meetingInput";

const INVALID_INPUT_MESSAGE = "Enter a valid 11-digit meeting ID or a meeting invite link.";

// Purpose: Render the form and handle Join.
// Output:  the page content
// How it works: Join parses the text (an ID or an invite link), asks the backend whether the
//   meeting exists (404 shows the backend's message under the box), and then opens
//   /join/{code}, carrying the passcode along when the pasted link had one.
export default function JoinMeetingForm() {
  const router = useRouter();
  const [inputText, setInputText] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isJoinEnabled = inputText.trim() !== "" && !isChecking;

  // Purpose: Join button / Enter key.
  // Input:   the form submit event
  async function joinMeeting(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedInput = parseMeetingInput(inputText);
    if (!parsedInput) {
      setErrorMessage(INVALID_INPUT_MESSAGE);
      return;
    }

    setIsChecking(true);
    setErrorMessage(null);
    try {
      await fetchMeetingByCode(parsedInput.meetingCode);
      const query = parsedInput.passcode ? `?pwd=${encodeURIComponent(parsedInput.passcode)}` : "";
      // Clear the box first: Next.js keeps this page mounted but hidden, so the text would still be here on return.
      setInputText("");
      router.push(`/join/${parsedInput.meetingCode}${query}`);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Could not check the meeting. Please try again.");
    }
    setIsChecking(false);
  }

  return (
    <div className="mx-auto mt-10 flex w-[361px] max-w-full flex-1 flex-col px-4 pb-10 sm:mt-[72px] sm:px-0">
      <h1 className="text-center text-[28px] font-bold">Join Meeting</h1>

      <form onSubmit={joinMeeting} noValidate className="mt-9">
        <label htmlFor="meeting-id-input" className="block text-[15px]">
          Meeting ID or Personal Link Name
        </label>
        <input
          id="meeting-id-input"
          type="text"
          // Focused on arrival, like Zoom: the blue ring invites typing straight away.
          autoFocus
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          placeholder="Enter Meeting ID or Personal Link Name"
          className="mt-2 h-[42px] w-full rounded-[10px] border border-input-border px-3.5 text-base outline-none placeholder:text-ink-muted focus:border-zoom-blue focus:ring-[3px] focus:ring-zoom-blue/30"
        />

        <label className="mt-3 flex items-center gap-2 text-[15px]">
          <input type="checkbox" className="size-4 accent-zoom-blue" />
          Always join from browser
        </label>

        {errorMessage && (
          <p role="alert" className="mt-3 text-[15px] text-red-600">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={!isJoinEnabled}
          className="mt-4 h-[38px] w-full rounded-control bg-zoom-blue text-base font-medium text-white hover:brightness-110 disabled:bg-[#ecedf2] disabled:text-ink-muted disabled:hover:brightness-100"
        >
          {isChecking ? "Checking..." : "Join"}
        </button>
      </form>

      <Link href="/join" className="mt-[70px] text-center text-base text-zoom-blue hover:underline">
        Join a meeting from an H.323/SIP room system
      </Link>
    </div>
  );
}
