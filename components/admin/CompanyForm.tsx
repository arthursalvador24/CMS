"use client";

import { useState, type FormEvent } from "react";
import { updateCompanyDetails } from "@/lib/cms/actions/site";
import { SOCIAL_KEYS, type SiteSettings, type SocialKey } from "@/lib/cms/types";
import { Field, fieldAria, focusFirstError, NETWORK_ERROR } from "./Field";
import { FormSection } from "./PageHeader";
import { SaveBar, type SaveState } from "./SaveBar";
import { textarea, textInput } from "./ui";
import { useUnsavedWarning } from "./useUnsavedWarning";

type Values = {
  companyName: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  socials: Record<SocialKey, string>;
};

const SOCIAL_LABELS: Record<SocialKey, { label: string; placeholder: string }> = {
  facebook: { label: "Facebook", placeholder: "https://facebook.com/yourpage" },
  instagram: { label: "Instagram", placeholder: "https://instagram.com/yourname" },
  linkedin: { label: "LinkedIn", placeholder: "https://linkedin.com/company/yourname" },
  x: { label: "X", placeholder: "https://x.com/yourname" },
  youtube: { label: "YouTube", placeholder: "https://youtube.com/@yourchannel" },
  tiktok: { label: "TikTok", placeholder: "https://tiktok.com/@yourname" },
};

const toValues = (s: SiteSettings): Values => ({
  companyName: s.companyName,
  tagline: s.tagline,
  email: s.email,
  phone: s.phone,
  address: s.address,
  socials: Object.fromEntries(SOCIAL_KEYS.map((key) => [key, s.socials[key] ?? ""])) as Record<SocialKey, string>,
});

export function CompanyForm({ site }: { site: SiteSettings }) {
  const [saved, setSaved] = useState(() => toValues(site));
  const [values, setValues] = useState(saved);
  const [state, setState] = useState<SaveState>({ kind: "idle" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  useUnsavedWarning(dirty || state.kind === "saving");

  const set = (key: Exclude<keyof Values, "socials">) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));
  const setSocial = (key: SocialKey) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, socials: { ...v.socials, [key]: e.target.value } }));

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (state.kind === "saving") return;
    const submitted = values;
    setState({ kind: "saving" });
    try {
      const result = await updateCompanyDetails(submitted);
      if (result.ok) {
        const next = toValues(result.data);
        setSaved(next);
        // Keep anything typed while the save was running.
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

  const discard = () => {
    setValues(saved);
    setErrors({});
    setState({ kind: "idle" });
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <FormSection title="Name and tagline" description="Shown in the header, the homepage hero and the browser tab.">
        <div className="space-y-5">
          <Field id="companyName" label="Company name" error={errors.companyName}>
            <input
              {...fieldAria("companyName", errors.companyName)}
              name="companyName"
              required
              maxLength={120}
              autoComplete="organization"
              value={values.companyName}
              onChange={set("companyName")}
              className={textInput}
            />
          </Field>
          <Field id="tagline" label="Tagline" hint="One short line about what you do." error={errors.tagline}>
            <input
              {...fieldAria("tagline", errors.tagline, true)}
              name="tagline"
              maxLength={200}
              value={values.tagline}
              onChange={set("tagline")}
              className={textInput}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Contact" description="Shown in the contact section and the footer. Leave a field empty to hide it.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="email" label="Email" error={errors.email}>
            <input
              {...fieldAria("email", errors.email)}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={200}
              value={values.email}
              onChange={set("email")}
              className={textInput}
            />
          </Field>
          <Field id="phone" label="Phone" error={errors.phone}>
            <input
              {...fieldAria("phone", errors.phone)}
              name="phone"
              type="tel"
              autoComplete="tel"
              maxLength={60}
              value={values.phone}
              onChange={set("phone")}
              className={textInput}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field id="address" label="Address" error={errors.address}>
              <textarea
                {...fieldAria("address", errors.address)}
                name="address"
                rows={3}
                maxLength={400}
                autoComplete="street-address"
                value={values.address}
                onChange={set("address")}
                className={`${textarea} min-h-24`}
              />
            </Field>
          </div>
        </div>
      </FormSection>

      <FormSection title="Social links" description="Full links that start with https://. Empty ones are left out of the site.">
        <div className="grid gap-5 sm:grid-cols-2">
          {SOCIAL_KEYS.map((key) => {
            const id = `socials.${key}`;
            return (
              <Field key={key} id={id} label={SOCIAL_LABELS[key].label} error={errors[id]}>
                <input
                  {...fieldAria(id, errors[id])}
                  name={id}
                  type="url"
                  inputMode="url"
                  maxLength={300}
                  placeholder={SOCIAL_LABELS[key].placeholder}
                  value={values.socials[key]}
                  onChange={setSocial(key)}
                  className={textInput}
                />
              </Field>
            );
          })}
        </div>
      </FormSection>

      <SaveBar state={state} dirty={dirty} onDiscard={discard} />
    </form>
  );
}
