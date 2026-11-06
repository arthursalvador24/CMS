"use client";

import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { buttonGhost, buttonPrimary } from "./ui";

export type SaveState = { kind: "idle" } | { kind: "saving" } | { kind: "saved" } | { kind: "error"; message: string };

/**
 * Sticky footer for a settings form: status on the left (announced politely), Discard and Save on the right.
 * Put it last inside the <form>; Save is the form's submit button.
 */
export function SaveBar({ state, dirty, onDiscard }: { state: SaveState; dirty: boolean; onDiscard: () => void }) {
  const saving = state.kind === "saving";
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-8 border-t border-stone-200 bg-stone-50/95 px-4 py-3 backdrop-blur-sm sm:-mx-8 sm:px-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p role="status" aria-live="polite" className="mr-auto flex min-h-10 min-w-0 items-center gap-2 text-sm">
          <StatusText state={state} dirty={dirty} />
        </p>
        <div className="flex items-center gap-2">
          {dirty && !saving ? (
            <button type="button" className={buttonGhost} onClick={onDiscard}>
              Discard
            </button>
          ) : null}
          <button type="submit" className={buttonPrimary} disabled={!dirty || saving}>
            {saving ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" /> : null}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusText({ state, dirty }: { state: SaveState; dirty: boolean }) {
  if (state.kind === "saving") return <span className="text-stone-600">Saving your changes…</span>;
  if (state.kind === "error")
    return (
      <span className="flex items-start gap-2 text-red-700">
        <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {state.message}
      </span>
    );
  if (dirty)
    return (
      <span className="flex items-center gap-2 text-amber-800">
        <span aria-hidden="true" className="size-2 rounded-full bg-amber-500" />
        Unsaved changes
      </span>
    );
  if (state.kind === "saved")
    return (
      <span className="flex items-center gap-2 text-emerald-700">
        <CircleCheck aria-hidden="true" className="size-4" />
        Saved. The live site is updated.
      </span>
    );
  return <span className="text-stone-500">No unsaved changes</span>;
}
