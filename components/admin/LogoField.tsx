"use client";

import { useRef, useState } from "react";
import { CircleAlert, CircleCheck, ImageUp, LoaderCircle, Trash2 } from "lucide-react";
import { removeLogo, uploadLogo } from "@/lib/cms/actions/site";
import { ConfirmDialog } from "./ConfirmDialog";
import { NETWORK_ERROR } from "./Field";
import { buttonGhost, buttonSecondary } from "./ui";
import { useUnsavedWarning } from "./useUnsavedWarning";

export const IMAGE_ACCEPT = "image/png,image/jpeg,image/webp";
const MAX_BYTES = 5 * 1024 * 1024;

/** Same limits as the server (lib/cms/upload.ts), checked first so a wrong file fails at once. */
export function checkImageFile(file: File): string | null {
  if (!IMAGE_ACCEPT.split(",").includes(file.type)) return "Use a PNG, JPG or WebP image.";
  if (file.size > MAX_BYTES) return "Images must be 5 MB or smaller.";
  return null;
}

type Status = { kind: "idle" } | { kind: "busy"; text: string } | { kind: "done"; text: string } | { kind: "error"; text: string };

/** Logo upload and removal. Both save right away, so there is nothing to lose here. */
export function LogoField({ initialUrl }: { initialUrl: string | null }) {
  const [url, setUrl] = useState(initialUrl);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [confirming, setConfirming] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const busy = status.kind === "busy";
  useUnsavedWarning(busy);

  async function upload(file: File | undefined) {
    if (!file) return;
    const problem = checkImageFile(file);
    if (problem) return setStatus({ kind: "error", text: problem });
    setStatus({ kind: "busy", text: "Uploading logo…" });
    const formData = new FormData();
    formData.set("logo", file);
    try {
      const result = await uploadLogo(formData);
      if (result.ok) {
        setUrl(result.data.logoUrl);
        setStatus({ kind: "done", text: "Logo updated on the live site." });
      } else setStatus({ kind: "error", text: result.error });
    } catch {
      setStatus({ kind: "error", text: NETWORK_ERROR });
    }
  }

  async function remove() {
    setStatus({ kind: "busy", text: "Removing logo…" });
    try {
      const result = await removeLogo();
      if (result.ok) {
        setUrl(null);
        setStatus({ kind: "done", text: "Logo removed. The site shows the company name instead." });
      } else setStatus({ kind: "error", text: result.error });
    } catch {
      setStatus({ kind: "error", text: NETWORK_ERROR });
    }
    setConfirming(false);
  }

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="relative grid h-28 w-full shrink-0 place-items-center overflow-hidden rounded-xl border border-stone-200 bg-[repeating-conic-gradient(#f5f5f4_0_25%,#fff_0_50%)] bg-[length:16px_16px] sm:w-48">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- preview of an uploaded logo of any shape
          <img src={url} alt="Current logo" className="absolute inset-0 size-full object-contain p-4" />
        ) : (
          <span className="text-sm text-stone-500">No logo</span>
        )}
        {busy ? (
          <span className="absolute inset-0 grid place-items-center bg-white/70">
            <LoaderCircle aria-hidden="true" className="size-6 animate-spin text-stone-700 motion-reduce:animate-none" />
          </span>
        ) : null}
      </div>

      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept={IMAGE_ACCEPT}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              void upload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button type="button" className={buttonSecondary} disabled={busy} onClick={() => fileRef.current?.click()}>
            <ImageUp aria-hidden="true" className="size-4" />
            {url ? "Replace logo" : "Upload logo"}
          </button>
          {url ? (
            <button type="button" className={buttonGhost} disabled={busy} onClick={() => setConfirming(true)}>
              <Trash2 aria-hidden="true" className="size-4" />
              Remove
            </button>
          ) : null}
        </div>
        <p className="text-sm text-stone-500">PNG, JPG or WebP, up to 5 MB. A transparent PNG works best. Saves right away.</p>
        <p role="status" aria-live="polite" className="text-sm empty:hidden">
          {status.kind === "busy" ? <span className="text-stone-600">{status.text}</span> : null}
          {status.kind === "done" ? (
            <span className="flex items-center gap-2 text-emerald-700">
              <CircleCheck aria-hidden="true" className="size-4" />
              {status.text}
            </span>
          ) : null}
          {status.kind === "error" ? (
            <span className="flex items-start gap-2 text-red-700">
              <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {status.text}
            </span>
          ) : null}
        </p>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Remove the logo?"
        confirmLabel="Remove logo"
        danger
        busy={busy}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      >
        The site will show the company name in its place. You can upload a logo again at any time.
      </ConfirmDialog>
    </div>
  );
}
