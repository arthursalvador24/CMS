import type { ReactNode } from "react";
import { fieldError, hint as hintClass, label as labelClass } from "./ui";

/** Ids and aria wiring for an input that belongs to a <Field>. */
export function fieldAria(id: string, error?: string, hint?: ReactNode) {
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ");
  return { id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy || undefined } as const;
}

/** Label, input (children), hint and error. Pair the input with fieldAria(id, error, hint). */
export function Field({
  id,
  label,
  hint,
  error,
  aside,
  children,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  /** Right side of the label row, e.g. a character count. */
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
        {aside}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className={fieldError}>
          {error}
        </p>
      ) : null}
      {hint ? (
        <p id={`${id}-hint`} className={hintClass}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Focus the first field named in a fieldErrors map (keys match input ids). */
export function focusFirstError(errors: Record<string, string>) {
  for (const key of Object.keys(errors)) {
    const el = document.getElementById(key);
    if (el) {
      el.focus();
      return;
    }
  }
}

export const NETWORK_ERROR = "Could not reach the server. Check your connection and try again.";
