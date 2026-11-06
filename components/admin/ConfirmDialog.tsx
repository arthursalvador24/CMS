"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { buttonDanger, buttonPrimary, buttonSecondary } from "./ui";

type Props = {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  /** Red confirm button for deletes. */
  danger?: boolean;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Native modal <dialog>: focus stays inside, Escape cancels, focus returns to the opener on close. */
export function ConfirmDialog({ open, title, children, confirmLabel, danger, busy, error, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-stone-200 bg-white p-0 text-stone-900 shadow-xl backdrop:bg-stone-950/40 open:animate-[admin-pop_160ms_ease-out] motion-reduce:open:animate-none"
    >
      <div className="p-6">
        <h2 id={titleId} className="text-lg font-semibold tracking-tight">
          {title}
        </h2>
        {children ? <div className="mt-2 text-sm leading-relaxed text-stone-600">{children}</div> : null}
        {error ? (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className={buttonSecondary} onClick={onCancel} disabled={busy} autoFocus>
            Cancel
          </button>
          <button type="button" className={danger ? buttonDanger : buttonPrimary} onClick={onConfirm} disabled={busy}>
            {busy ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
