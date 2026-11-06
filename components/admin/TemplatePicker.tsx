"use client";

import { useEffect, useRef, useState } from "react";
import { CircleCheck, ExternalLink, Maximize2, X } from "lucide-react";
import { setActiveTemplate } from "@/lib/cms/actions/template";
import type { TemplateKey } from "@/lib/cms/types";
import { ConfirmDialog } from "./ConfirmDialog";
import { NETWORK_ERROR } from "./Field";
import { DeviceToggle, PreviewFrame, type Device } from "./PreviewFrame";
import { buttonPrimary, buttonSecondary, card, iconButton } from "./ui";
import { useUnsavedWarning } from "./useUnsavedWarning";

export type TemplateInfo = { key: TemplateKey; name: string; description: string };

export function TemplatePicker({ templates, initialActive }: { templates: TemplateInfo[]; initialActive: TemplateKey }) {
  const [active, setActive] = useState(initialActive);
  const [confirming, setConfirming] = useState<TemplateInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [fullScreen, setFullScreen] = useState<{ template: TemplateInfo; device: Device } | null>(null);
  useUnsavedWarning(busy);

  async function confirmSwitch() {
    if (!confirming) return;
    setBusy(true);
    setError(null);
    try {
      const result = await setActiveTemplate(confirming.key);
      if (result.ok) {
        setActive(result.data.activeTemplate);
        setMessage(`Your live site now uses ${confirming.name}.`);
        setConfirming(null);
        setFullScreen(null);
      } else setError(result.error);
    } catch {
      setError(NETWORK_ERROR);
    }
    setBusy(false);
  }

  const ask = (template: TemplateInfo) => {
    setError(null);
    setConfirming(template);
  };

  return (
    <div className="space-y-6">
      <p role="status" aria-live="polite" className="empty:hidden">
        {message ? (
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <CircleCheck aria-hidden="true" className="size-4 shrink-0" />
            {message}
            <a href="/" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2">
              View live site<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </span>
        ) : null}
      </p>

      {templates.map((template) => (
        <TemplateCard
          key={template.key}
          template={template}
          active={template.key === active}
          onUse={() => ask(template)}
          onFullScreen={(device) => setFullScreen({ template, device })}
        />
      ))}

      {fullScreen ? (
        <FullScreenPreview
          template={fullScreen.template}
          initialDevice={fullScreen.device}
          active={fullScreen.template.key === active}
          onUse={() => ask(fullScreen.template)}
          onClose={() => setFullScreen(null)}
        />
      ) : null}

      <ConfirmDialog
        open={confirming !== null}
        title={`Switch your live site to ${confirming?.name ?? ""}?`}
        confirmLabel={`Use ${confirming?.name ?? "this template"}`}
        busy={busy}
        error={error}
        onConfirm={confirmSwitch}
        onCancel={() => setConfirming(null)}
      >
        Visitors see the new design on their next page load. Your content stays exactly the same, and you can switch back at
        any time.
      </ConfirmDialog>
    </div>
  );
}

function TemplateCard({
  template,
  active,
  onUse,
  onFullScreen,
}: {
  template: TemplateInfo;
  active: boolean;
  onUse: () => void;
  onFullScreen: (device: Device) => void;
}) {
  const [device, setDevice] = useState<Device>("desktop");
  const headingId = `template-${template.key}`;

  return (
    <article
      aria-labelledby={headingId}
      className={`${card} grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_17rem] ${active ? "border-stone-900 ring-1 ring-stone-900" : ""}`}
    >
      <div className="relative">
        <PreviewFrame
          src={`/preview/${template.key}`}
          device={device}
          title={`${template.name} preview`}
          className="aspect-[16/10] border-b border-stone-200 lg:border-r lg:border-b-0"
        />
        <button
          type="button"
          onClick={() => onFullScreen(device)}
          aria-label={`Open the ${template.name} preview full screen`}
          className="group absolute inset-0 flex items-end justify-end p-3 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-stone-900"
        >
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900/85 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">
            <Maximize2 aria-hidden="true" className="size-3.5" />
            Full screen
          </span>
        </button>
      </div>

      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={headingId} className="text-lg font-semibold tracking-tight">
              {template.name}
            </h2>
            {active ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
                <CircleCheck aria-hidden="true" className="size-3.5" />
                Live on your site
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-sm text-pretty text-stone-600">{template.description}</p>
        </div>

        <div className="mt-auto space-y-3">
          <DeviceToggle value={device} onChange={setDevice} label={`${template.name} preview size`} />
          <div className="flex flex-wrap gap-2 lg:grid">
            {active ? (
              <a href="/" target="_blank" rel="noreferrer" className={`${buttonSecondary} flex-1`}>
                <ExternalLink aria-hidden="true" className="size-4" />
                View live site<span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : (
              <button type="button" className={`${buttonPrimary} flex-1`} onClick={onUse}>
                Use this template
              </button>
            )}
            <button type="button" className={buttonSecondary} onClick={() => onFullScreen(device)}>
              <Maximize2 aria-hidden="true" className="size-4" />
              Full screen
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function FullScreenPreview({
  template,
  initialDevice,
  active,
  onUse,
  onClose,
}: {
  template: TemplateInfo;
  initialDevice: Device;
  active: boolean;
  onUse: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [device, setDevice] = useState(initialDevice);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label={`${template.name} preview`}
      onClose={onClose}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-stone-100 p-0 text-stone-900 backdrop:bg-stone-950/50 open:animate-[admin-fade_160ms_ease-out] motion-reduce:open:animate-none"
    >
      <div className="flex h-full flex-col">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-stone-200 bg-white px-3 py-2 sm:px-4">
          <div className="mr-auto flex min-w-0 items-center gap-2">
            <h2 className="truncate text-base font-semibold">{template.name}</h2>
            {active ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
                <CircleCheck aria-hidden="true" className="size-3.5" />
                Live
              </span>
            ) : null}
          </div>
          <button type="button" className={`${iconButton} sm:order-last`} aria-label="Close preview" onClick={() => ref.current?.close()}>
            <X aria-hidden="true" className="size-5" />
          </button>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <DeviceToggle value={device} onChange={setDevice} label="Preview size" />
            <a
              href={`/preview/${template.key}`}
              target="_blank"
              rel="noreferrer"
              className={iconButton}
              aria-label="Open the preview in a new tab"
              title="Open in a new tab"
            >
              <ExternalLink aria-hidden="true" className="size-[18px]" />
            </a>
            {active ? null : (
              <button type="button" className={`${buttonPrimary} max-sm:ml-auto`} onClick={onUse}>
                Use {template.name}
              </button>
            )}
          </div>
        </div>
        <PreviewFrame src={`/preview/${template.key}`} device={device} title={`${template.name} preview`} interactive className="flex-1" />
      </div>
    </dialog>
  );
}
