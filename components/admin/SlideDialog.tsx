"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CircleAlert, ImageUp, LoaderCircle, X } from "lucide-react";
import { createSlide, updateSlide } from "@/lib/cms/actions/slides";
import type { Slide } from "@/lib/cms/types";
import { Field, fieldAria, focusFirstError, NETWORK_ERROR } from "./Field";
import { checkImageFile, IMAGE_ACCEPT } from "./LogoField";
import { buttonPrimary, buttonSecondary, fieldError, iconButton, textarea, textInput } from "./ui";
import { LEAVE_MESSAGE, useUnsavedWarning } from "./useUnsavedWarning";

type Values = { heading: string; caption: string; ctaLabel: string; ctaUrl: string };

/** Add (slide = null) or edit a slide. Mount it to open it; it calls onClose when done. */
export function SlideDialog({
  slide,
  onClose,
  onSaved,
}: {
  slide: Slide | null;
  onClose: () => void;
  onSaved: (slide: Slide) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const initial: Values = {
    heading: slide?.heading ?? "",
    caption: slide?.caption ?? "",
    ctaLabel: slide?.ctaLabel ?? "",
    ctaUrl: slide?.ctaUrl ?? "",
  };
  const [values, setValues] = useState(initial);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirty = file !== null || (Object.keys(initial) as (keyof Values)[]).some((k) => values[k] !== initial[k]);
  useUnsavedWarning(dirty || saving);

  useEffect(() => {
    ref.current?.showModal();
  }, []);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const requestClose = () => {
    if (saving) return;
    if (dirty && !window.confirm(LEAVE_MESSAGE)) return;
    ref.current?.close();
    onClose();
  };

  const pickFile = (picked: File | undefined) => {
    if (!picked) return;
    const problem = checkImageFile(picked);
    setErrors((e) => {
      const rest = { ...e };
      delete rest.image;
      return problem ? { ...rest, image: problem } : rest;
    });
    if (problem) return;
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  };

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!slide && !file) {
      setErrors({ image: "Choose an image for the slide." });
      return;
    }
    const formData = new FormData();
    if (slide) formData.set("id", slide.id);
    for (const [key, value] of Object.entries(values)) formData.set(key, value);
    if (file) formData.set("image", file);
    setSaving(true);
    setError(null);
    try {
      const result = slide ? await updateSlide(formData) : await createSlide(formData);
      if (result.ok) {
        onSaved(result.data);
        ref.current?.close();
        onClose();
        return;
      }
      setErrors(result.fieldErrors ?? {});
      setError(result.error);
      requestAnimationFrame(() => focusFirstError(result.fieldErrors ?? {}));
    } catch {
      setError(NETWORK_ERROR);
    }
    setSaving(false);
  }

  const set = (key: keyof Values) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [key]: e.target.value }));
  const imageUrl = preview ?? slide?.imageUrl ?? null;
  const title = slide ? "Edit slide" : "Add a slide";

  return (
    <dialog
      ref={ref}
      aria-labelledby="slide-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-white p-0 text-stone-900 backdrop:bg-stone-950/40 sm:m-auto sm:h-auto sm:max-h-[calc(100dvh-4rem)] sm:max-w-xl sm:rounded-2xl sm:border sm:border-stone-200 sm:shadow-xl sm:open:animate-[admin-pop_160ms_ease-out] motion-reduce:open:animate-none"
    >
      <form onSubmit={onSubmit} noValidate className="flex h-full flex-col sm:max-h-[calc(100dvh-4rem)]">
        <div className="flex items-center justify-between gap-4 border-b border-stone-200 px-5 py-3">
          <h2 id="slide-dialog-title" className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          <button type="button" className={iconButton} aria-label="Close" onClick={requestClose}>
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div className="space-y-2">
            <span id="image-label" className="block text-sm font-medium text-stone-800">
              Image
            </span>
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- local file preview or stored slide image
                <img src={imageUrl} alt="" className="size-full object-cover" />
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="grid size-full place-items-center text-sm text-stone-500 hover:bg-stone-200/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-stone-900"
                >
                  <span className="flex flex-col items-center gap-2">
                    <ImageUp aria-hidden="true" className="size-6" />
                    Choose an image
                  </span>
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              id="image"
              type="file"
              accept={IMAGE_ACCEPT}
              className="sr-only"
              tabIndex={-1}
              aria-labelledby="image-label"
              onChange={(e) => {
                pickFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <button type="button" className={buttonSecondary} onClick={() => fileRef.current?.click()} aria-describedby="image-hint">
                <ImageUp aria-hidden="true" className="size-4" />
                {imageUrl ? "Replace image" : "Choose image"}
              </button>
              {file ? <span className="min-w-0 truncate text-sm text-stone-600">{file.name}</span> : null}
            </div>
            {errors.image ? <p className={fieldError}>{errors.image}</p> : null}
            <p id="image-hint" className="text-sm text-stone-500">
              Wide photos work best, at least 1600 px across. PNG, JPG or WebP up to 4 MB.
            </p>
          </div>

          <Field id="heading" label="Heading" error={errors.heading}>
            <input {...fieldAria("heading", errors.heading)} maxLength={140} value={values.heading} onChange={set("heading")} className={textInput} />
          </Field>
          <Field id="caption" label="Caption" error={errors.caption}>
            <textarea
              {...fieldAria("caption", errors.caption)}
              maxLength={300}
              value={values.caption}
              onChange={set("caption")}
              className={`${textarea} min-h-20`}
            />
          </Field>

          <fieldset className="space-y-4 rounded-xl border border-stone-200 p-4">
            <legend className="px-1 text-sm font-medium text-stone-800">Button (optional)</legend>
            <p className="-mt-1 text-sm text-stone-500">Fill in both to show a button on the slide, or leave both empty.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="ctaLabel" label="Label" error={errors.ctaLabel}>
                <input
                  {...fieldAria("ctaLabel", errors.ctaLabel)}
                  maxLength={40}
                  placeholder="See our work"
                  value={values.ctaLabel}
                  onChange={set("ctaLabel")}
                  className={textInput}
                />
              </Field>
              <Field id="ctaUrl" label="Link" error={errors.ctaUrl}>
                <input
                  {...fieldAria("ctaUrl", errors.ctaUrl, true)}
                  maxLength={500}
                  inputMode="url"
                  placeholder="#contact"
                  value={values.ctaUrl}
                  onChange={set("ctaUrl")}
                  className={textInput}
                />
              </Field>
            </div>
            <p id="ctaUrl-hint" className="text-sm text-stone-500">
              Use #about or #contact for a homepage section, /blog for a page, or a full https:// link.
            </p>
          </fieldset>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-stone-200 bg-stone-50 px-5 py-3">
          <p role="status" aria-live="polite" className="mr-auto min-w-0 text-sm text-red-700 empty:hidden max-sm:basis-full">
            {error ? (
              <span className="flex items-start gap-2">
                <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                {error}
              </span>
            ) : null}
          </p>
          <button type="button" className={buttonSecondary} onClick={requestClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className={buttonPrimary} disabled={saving}>
            {saving ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" /> : null}
            {saving ? "Saving…" : slide ? "Save slide" : "Add slide"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
