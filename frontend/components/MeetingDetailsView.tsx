"use client";

// =============================================================================
// File: components/MeetingDetailsView.tsx
// Purpose: The meeting details page (zoom.us/meeting/{id} look): breadcrumb, tabs, the meeting's
//          topic, time, ID, passcode (hidden until "Show") and invite link, then the sticky
//          action bar: Start, Copy Invitation, Edit, Delete, Save as Template.
//          Delete and Copy Invitation really work; Edit, Save as Template, "Add to" calendars
//          and the Attachments tab are placeholders.
// Contains: MeetingDetailsView (loads the meeting), MeetingDetailsContent (the page itself)
// Source: docs/zoom-design-analysis.md section 3.2.1
// =============================================================================

import { Check, ChevronRight, CalendarDays, Copy, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import DetailRow from "@/components/DetailRow";
import Modal from "@/components/Modal";
import { useApiData } from "@/hooks/useApiData";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { ApiError, deleteMeeting, fetchMeetingDetails } from "@/lib/apiClient";
import type { HostMeeting } from "@/lib/apiTypes";
import { formatDuration, formatMeetingCode, formatMeetingDateTime } from "@/lib/formatters";
import { buildInvitationText } from "@/lib/invitationText";
import { DANGER_BUTTON_CLASSES, OUTLINE_BUTTON_CLASSES, SOFT_BUTTON_CLASSES, PRIMARY_BUTTON_CLASSES } from "@/lib/uiClasses";

const HIDDEN_PASSCODE_TEXT = "********"; // Zoom always shows 8 asterisks, whatever the passcode length

// Calendars from Zoom's "Add to" row; placeholders only.
const CALENDAR_LINKS = ["Google Calendar", "Outlook Calendar (.ics)", "Yahoo Calendar"];

// Purpose: Load the meeting named in the URL and show loading, error or the page.
// Output:  the page content
export default function MeetingDetailsView() {
  const { code: meetingCode } = useParams<{ code: string }>();

  // useCallback keeps the function identity stable, which useApiData requires.
  const loadMeeting = useCallback(() => fetchMeetingDetails(meetingCode), [meetingCode]);
  const { data: meeting, isLoading, errorMessage } = useApiData(loadMeeting);

  if (isLoading) {
    return <p className="px-4 pt-6 text-ink-muted sm:px-8 sm:pt-8">Loading meeting...</p>;
  }
  if (errorMessage || !meeting) {
    return (
      <div role="alert" className="px-4 pt-6 sm:px-8 sm:pt-8">
        <p className="text-red-600">{errorMessage ?? "Meeting not found."}</p>
        <Link href="/meeting" className="mt-3 inline-block text-zoom-blue hover:underline">
          Back to My Meetings
        </Link>
      </div>
    );
  }
  return <MeetingDetailsContent meeting={meeting} />;
}

// Purpose: The loaded page.
// Input:   meeting - the host's view of the meeting (passcode and invite link included)
// Output:  the details rows plus the sticky action bar and the delete confirmation
function MeetingDetailsContent({ meeting }: { meeting: HostMeeting }) {
  const router = useRouter();
  const [isPasscodeVisible, setIsPasscodeVisible] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const { copyText: copyInviteLink, hasCopied: hasCopiedInviteLink } = useCopyToClipboard();
  const { copyText: copyInvitation, hasCopied: hasCopiedInvitation } = useCopyToClipboard();

  const startIso = meeting.scheduled_start ?? meeting.started_at;

  // Purpose: Delete button inside the confirmation dialog.
  async function confirmDelete() {
    setIsDeleting(true);
    setDeleteErrorMessage(null);
    try {
      await deleteMeeting(meeting.meeting_code);
      setIsDeleteDialogOpen(false);
      router.push("/meeting");
    } catch (error) {
      setDeleteErrorMessage(error instanceof ApiError ? error.message : "Could not delete the meeting.");
    }
    setIsDeleting(false);
  }

  return (
    <>
      <div className="px-4 pt-6 pb-10 sm:px-8 sm:pt-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center text-[15px]">
          <Link href="/meeting" className="text-zoom-blue hover:underline">
            My Meetings
          </Link>
          <ChevronRight size={14} className="mx-2 text-ink-muted" aria-hidden="true" />
          <span>Manage &quot;{meeting.title}&quot;</span>
        </nav>

        <div className="mt-6 flex gap-3 text-[15px]">
          <span className="inline-flex h-8 items-center rounded-control bg-sidebar-active px-5 text-zoom-blue">Details</span>
          <button type="button" className="inline-flex h-8 items-center rounded-control px-5 hover:bg-soft">
            Attachments
          </button>
        </div>

        <div className="sm:pl-4">
          <DetailRow label="Topic">{meeting.title}</DetailRow>
          {meeting.description && <DetailRow label="Description">{meeting.description}</DetailRow>}
          <DetailRow label="Time">
            {startIso ? formatMeetingDateTime(startIso) : "-"} · {formatDuration(meeting.duration_minutes)}
          </DetailRow>
          <DetailRow label="Meeting ID">{formatMeetingCode(meeting.meeting_code)}</DetailRow>

          <DetailRow label="Security">
            {meeting.passcode ? (
              <span className="flex items-center gap-2">
                <Check size={16} aria-hidden="true" />
                Passcode
                <span>{isPasscodeVisible ? meeting.passcode : HIDDEN_PASSCODE_TEXT}</span>
                <button
                  type="button"
                  onClick={() => setIsPasscodeVisible((wasVisible) => !wasVisible)}
                  className="text-zoom-blue hover:underline"
                >
                  {isPasscodeVisible ? "Hide" : "Show"}
                </button>
              </span>
            ) : (
              "No passcode required"
            )}
          </DetailRow>

          <DetailRow label="Invite Link">
            <div className="flex items-start gap-2">
              <a href={meeting.invite_link} className="break-all text-zoom-blue hover:underline">
                {meeting.invite_link}
              </a>
              <button
                type="button"
                aria-label="Copy invite link"
                onClick={() => copyInviteLink(meeting.invite_link)}
                className="mt-0.5 shrink-0 text-ink hover:text-zoom-blue"
              >
                <Copy size={18} fill="currentColor" aria-hidden="true" />
              </button>
              {hasCopiedInviteLink && <span className="shrink-0 text-ink-muted">Copied</span>}
            </div>
          </DetailRow>

          <DetailRow label="Add to">
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {CALENDAR_LINKS.map((label) => (
                <button key={label} type="button" className="flex items-center gap-1.5 text-zoom-blue hover:underline">
                  <CalendarDays size={18} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </DetailRow>

          <hr className="mt-6 border-line sm:ml-[160px]" />

          {/* The rows below are fixed text copied from Zoom's page; our database does not store these settings. */}
          <DetailRow label="Encryption">
            <span className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-green-600" aria-hidden="true" />
              Enhanced encryption
            </span>
          </DetailRow>
          <DetailRow label="My Notes">
            <p>Allow participants to transcribe meeting with My Notes</p>
            <p className="mt-1 text-ink-muted">All participants</p>
          </DetailRow>
          <DetailRow label="Meeting chat">Allow users to access meeting chats before and after the meeting</DetailRow>
          <DetailRow label="Video">
            <div className="grid grid-cols-[150px_auto] gap-y-1.5">
              <span>Host</span>
              <span>on</span>
              <span>Participant</span>
              <span>on</span>
            </div>
          </DetailRow>
          <DetailRow label="Options">Allow participants to join anytime</DetailRow>
        </div>
      </div>

      {/* Sticky: stays at the bottom of the window while the page is long, like Zoom's action bar. */}
      {/* pr-[88px] on phones keeps the buttons clear of the floating chat button; the buttons wrap onto a second line. */}
      <div className="sticky bottom-0 flex flex-wrap items-center gap-2.5 border-t border-line bg-white py-3 pr-[88px] pl-4 sm:px-8 sm:py-4">
        <Link href={`/join/${meeting.meeting_code}?host=1`} className={PRIMARY_BUTTON_CLASSES}>
          Start
        </Link>
        <button type="button" onClick={() => copyInvitation(buildInvitationText(meeting))} className={OUTLINE_BUTTON_CLASSES}>
          <Copy size={16} fill="currentColor" aria-hidden="true" />
          {hasCopiedInvitation ? "Copied" : "Copy Invitation"}
        </button>
        <button type="button" className={OUTLINE_BUTTON_CLASSES}>
          Edit
        </button>
        <button type="button" onClick={() => setIsDeleteDialogOpen(true)} className={OUTLINE_BUTTON_CLASSES}>
          Delete
        </button>
        {/* Right margin keeps the button clear of the floating chat button. */}
        <button type="button" className={`${OUTLINE_BUTTON_CLASSES} sm:ml-auto sm:mr-[72px]`}>
          Save as Template
        </button>
      </div>

      <Modal isOpen={isDeleteDialogOpen} title="Delete meeting?" onClose={() => setIsDeleteDialogOpen(false)}>
        <p className="text-[15px]">
          Delete &quot;{meeting.title}&quot;? This cannot be undone, and people will no longer be able to join with its link.
        </p>
        {deleteErrorMessage && (
          <p role="alert" className="mt-3 text-[15px] text-red-600">
            {deleteErrorMessage}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" onClick={() => setIsDeleteDialogOpen(false)} className={SOFT_BUTTON_CLASSES}>
            Cancel
          </button>
          <button type="button" onClick={confirmDelete} disabled={isDeleting} className={DANGER_BUTTON_CLASSES}>
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </Modal>
    </>
  );
}
