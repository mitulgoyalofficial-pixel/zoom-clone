"use client";

// =============================================================================
// File: components/Modal.tsx
// Purpose: A pop-up dialog with a dimmed background (used for the "Delete meeting?" question).
//          Built on the browser's native <dialog> element, which already traps keyboard focus
//          and closes on the Escape key.
// Contains: Modal component
// =============================================================================

import { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void; // called when the user presses Escape (the parent should set isOpen to false)
  children: React.ReactNode;
}

// Purpose: Show or hide the dialog following `isOpen`.
// Input:   see ModalProps
// Output:  the <dialog>; showModal() puts it on top of the page with a dimmed backdrop
export default function Modal({ isOpen, title, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    // The checks avoid errors from calling showModal() on an open dialog (or close() on a closed one).
    if (isOpen && !dialog.open) {
      dialog.showModal();
    }
    if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // m-auto: Tailwind's reset removes the dialog's default margin:auto, which is what centres it on screen.
      className="m-auto w-[440px] max-w-[calc(100vw-32px)] rounded-card p-6 shadow-card backdrop:bg-black/40"
    >
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-3">{children}</div>
    </dialog>
  );
}
