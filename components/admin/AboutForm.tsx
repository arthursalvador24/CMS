"use client";

import { useState, type FormEvent } from "react";
import { updateAboutMissionVision } from "@/lib/cms/actions/site";
import type { SiteSettings } from "@/lib/cms/types";
import { Field, fieldAria, focusFirstError, NETWORK_ERROR } from "./Field";
import { FormSection } from "./PageHeader";
import { SaveBar, type SaveState } from "./SaveBar";
import { textarea } from "./ui";
import { useUnsavedWarning } from "./useUnsavedWarning";

type Key = "about" | "mission" | "vision";
type Values = Record<Key, string>;

const FIELDS: { key: Key; title: string; description: string; max: number; rows: string }[] = [
  {
    key: "about",
    title: "About",
    description: "Your story: who you are, what you do and how you work.",
    max: 5000,
    rows: "min-h-64",
  },
  { key: "mission", title: "Mission", description: "What you do every day, and for whom.", max: 2000, rows: "min-h-32" },
  { key: "vision", title: "Vision", description: "The future you are working toward.", max: 2000, rows: "min-h-32" },
];

const pick = (s: SiteSettings): Values => ({ about: s.about, mission: s.mission, vision: s.vision });
const number = new Intl.NumberFormat("en");

export function AboutForm({ site }: { site: SiteSettings }) {
  const [saved, setSaved] = useState(() => pick(site));
  const [values, setValues] = useState(saved);
  const [state, setState] = useState<SaveState>({ kind: "idle" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirty = values.about !== saved.about || values.mission !== saved.mission || values.vision !== saved.vision;
  useUnsavedWarning(dirty || state.kind === "saving");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (state.kind === "saving") return;
    const submitted = values;
    setState({ kind: "saving" });
    try {
      const result = await updateAboutMissionVision(submitted);
      if (result.ok) {
        const next = pick(result.data);
        setSaved(next);
        setValues((current) => (current === submitted ? next : current));
        setErrors({});
        setState({ kind: "saved" });
      } else {
        setErrors(result.fieldErrors ?? {});
        setState({ kind: "error", message: result.error });
        requestAnimationFrame(() => focusFirstError(result.fieldErrors ?? {}));
      }
    } catch {
      setState({ kind: "error", message: NETWORK_ERROR });
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      {FIELDS.map(({ key, title, description, max, rows }) => {
        const length = values[key].length;
        const over = length > max;
        return (
          <FormSection key={key} title={title} description={description}>
            <Field
              id={key}
              label={`${title} text`}
              hint={key === "about" ? "Leave a blank line between paragraphs." : undefined}
              error={errors[key]}
              aside={
                <span className={`text-xs tabular-nums ${over ? "font-medium text-red-700" : "text-stone-500"}`}>
                  {number.format(length)} / {number.format(max)}
                </span>
              }
            >
              <textarea
                {...fieldAria(key, errors[key], key === "about")}
                name={key}
                value={values[key]}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                className={`${textarea} ${rows}`}
              />
            </Field>
          </FormSection>
        );
      })}
      <SaveBar
        state={state}
        dirty={dirty}
        onDiscard={() => {
          setValues(saved);
          setErrors({});
          setState({ kind: "idle" });
        }}
      />
    </form>
  );
}
