// =============================================================================
// File: components/RoomNotice.tsx
// Purpose: A full-screen message over the room for the moments when the person can no longer be
//          in the meeting: removed by the host, the meeting ended, they were disconnected, or the
//          meeting no longer exists.
// Contains: RoomNotice component
// =============================================================================

import Link from "next/link";

interface RoomNoticeProps {
  title: string; // e.g. "You were removed from the meeting"
  message: string; // one explaining sentence
  rejoinHref?: string; // when given, shows a "Rejoin" link (only sensible if the meeting still runs)
}

// Purpose: Render the message with its buttons.
// Input:   see RoomNoticeProps
// Output:  a dark overlay with a centred card: title, message, "Back to home" and optionally "Rejoin"
export default function RoomNotice({ title, message, rejoinHref }: RoomNoticeProps) {
  return (
    <div role="alertdialog" aria-label={title} className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-6">
      <div className="w-full max-w-[420px] rounded-xl bg-[#232323] p-7 text-center">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-2 text-[15px] text-white/70">{message}</p>
        <div className="mt-6 flex justify-center gap-3">
          {rejoinHref && (
            <Link href={rejoinHref} className="inline-flex h-9 items-center rounded-control bg-zoom-blue px-5 text-[15px] font-medium hover:brightness-110">
              Rejoin
            </Link>
          )}
          <Link href="/" className="inline-flex h-9 items-center rounded-control border border-white/25 px-5 text-[15px] hover:bg-white/10">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
