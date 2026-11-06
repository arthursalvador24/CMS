"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ActionResult } from "@/lib/cms/action-result";

export type SaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error";

/**
 * Debounced autosave. Call markDirty() after each change; save() runs `delay` ms after the last one.
 * flush() saves now (await it before publishing). Saves never overlap, and leaving the page
 * with unsaved changes asks the browser to confirm.
 */
export function useAutosave(save: () => Promise<ActionResult<unknown>>, delay = 1500) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const saveRef = useRef(save);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const running = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    saveRef.current = save;
  });

  const flush = useCallback(async (): Promise<boolean> => {
    clearTimeout(timer.current);
    while (running.current) await running.current;
    if (!dirty.current) return true;
    dirty.current = false;
    setStatus("saving");
    const attempt = saveRef
      .current()
      .catch((): ActionResult<unknown> => ({ ok: false, error: "Could not reach the server. Please try again." }))
      .then((result) => {
        if (result.ok) {
          setError(null);
          setFieldErrors({});
          setStatus(dirty.current ? "unsaved" : "saved");
          return true;
        }
        dirty.current = true; // keep the change so the next edit or flush() retries it
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        setStatus("error");
        return false;
      });
    running.current = attempt;
    try {
      return await attempt;
    } finally {
      if (running.current === attempt) running.current = null;
    }
  }, []);

  const markDirty = useCallback(() => {
    dirty.current = true;
    setStatus((current) => (current === "error" ? current : "unsaved"));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), delay);
  }, [delay, flush]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty.current || running.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      clearTimeout(timer.current);
    };
  }, []);

  return { status, error, fieldErrors, markDirty, flush };
}
