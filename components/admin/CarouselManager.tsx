"use client";

import { useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CircleAlert, CircleCheck, GalleryHorizontal, GripVertical, Info, Pencil, Plus, Trash2 } from "lucide-react";
import type { ActionResult } from "@/lib/cms/action-result";
import { deleteSlide, reorderSlides, setSlideActive } from "@/lib/cms/actions/slides";
import type { Slide } from "@/lib/cms/types";
import { ConfirmDialog } from "./ConfirmDialog";
import { NETWORK_ERROR } from "./Field";
import { SlideDialog } from "./SlideDialog";
import { buttonPrimary, card, focusRing, iconButton } from "./ui";
import { useUnsavedWarning } from "./useUnsavedWarning";

type Status = { kind: "idle" } | { kind: "busy"; text: string } | { kind: "done"; text: string } | { kind: "error"; text: string };

export function CarouselManager({ initialSlides }: { initialSlides: Slide[] }) {
  const [slides, setSlides] = useState(initialSlides);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [editing, setEditing] = useState<Slide | "new" | null>(null);
  const [deleting, setDeleting] = useState<Slide | null>(null);
  const busy = status.kind === "busy";
  useUnsavedWarning(busy);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /** Runs a save; on failure puts the list back the way it was. */
  async function run(text: string, action: () => Promise<ActionResult<unknown>>, done: string, undo?: () => void) {
    setStatus({ kind: "busy", text });
    try {
      const result = await action();
      if (result.ok) {
        setStatus({ kind: "done", text: done });
        return true;
      }
      undo?.();
      setStatus({ kind: "error", text: result.error });
    } catch {
      undo?.();
      setStatus({ kind: "error", text: NETWORK_ERROR });
    }
    return false;
  }

  const position = (id: UniqueIdentifier) => slides.findIndex((s) => s.id === id) + 1;
  const name = (id: UniqueIdentifier) => {
    const slide = slides.find((s) => s.id === id);
    return `Slide ${position(id)}${slide?.heading ? `, ${slide.heading},` : ""}`;
  };
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${name(active.id)}.`,
    onDragOver: ({ active, over }) => (over ? `${name(active.id)} is over position ${position(over.id)} of ${slides.length}.` : ""),
    onDragEnd: ({ active, over }) =>
      over ? `${name(active.id)} dropped at position ${position(over.id)} of ${slides.length}.` : `${name(active.id)} dropped.`,
    onDragCancel: ({ active }) => `Move cancelled. ${name(active.id)} is back in place.`,
  };

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const before = slides;
    const next = arrayMove(slides, position(active.id) - 1, position(over.id) - 1);
    setSlides(next);
    void run("Saving the new order…", () => reorderSlides(next.map((s) => s.id)), "New order saved. The live site is updated.", () =>
      setSlides(before),
    );
  }

  function toggle(slide: Slide) {
    const isActive = !slide.isActive;
    const swap = (value: boolean) => setSlides((list) => list.map((s) => (s.id === slide.id ? { ...s, isActive: value } : s)));
    swap(isActive);
    void run(
      isActive ? "Showing the slide…" : "Hiding the slide…",
      () => setSlideActive(slide.id, isActive),
      isActive ? "Slide shown on the live site." : "Slide hidden from the live site.",
      () => swap(!isActive),
    );
  }

  async function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    if (await run("Deleting the slide…", () => deleteSlide(target.id), "Slide deleted.")) {
      setSlides((list) => list.filter((s) => s.id !== target.id));
    }
    setDeleting(null);
  }

  const onSaved = (saved: Slide) => {
    setSlides((list) => (list.some((s) => s.id === saved.id) ? list.map((s) => (s.id === saved.id ? saved : s)) : [...list, saved]));
    setStatus({ kind: "done", text: editing === "new" ? "Slide added to the end of the carousel." : "Slide saved." });
  };

  const shown = slides.filter((s) => s.isActive).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-600">
          {slides.length === 0
            ? "No slides yet."
            : `${slides.length} ${slides.length === 1 ? "slide" : "slides"}, ${shown} shown on the site.`}
        </p>
        <button type="button" className={buttonPrimary} onClick={() => setEditing("new")} disabled={busy}>
          <Plus aria-hidden="true" className="size-4" />
          Add slide
        </button>
      </div>

      <p role="status" aria-live="polite" className="text-sm empty:hidden">
        {status.kind === "busy" ? <span className="text-stone-600">{status.text}</span> : null}
        {status.kind === "done" ? (
          <span className="flex items-center gap-2 text-emerald-700">
            <CircleCheck aria-hidden="true" className="size-4 shrink-0" />
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

      {slides.length > 0 && shown === 0 ? (
        <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          Every slide is hidden, so the homepage shows a still hero with your company name and tagline.
        </p>
      ) : null}

      {slides.length === 0 ? (
        <div className={`${card} flex flex-col items-center px-6 py-14 text-center`}>
          <span className="grid size-12 place-items-center rounded-2xl bg-stone-100 text-stone-500">
            <GalleryHorizontal aria-hidden="true" className="size-6" />
          </span>
          <h2 className="mt-4 text-base font-semibold">No slides yet</h2>
          <p className="mt-1 max-w-sm text-sm text-pretty text-stone-600">
            Until you add one, the homepage shows a still hero built from your company name and tagline.
          </p>
          <button type="button" className={`${buttonPrimary} mt-5`} onClick={() => setEditing("new")}>
            <Plus aria-hidden="true" className="size-4" />
            Add the first slide
          </button>
        </div>
      ) : (
        <>
          <DndContext
            id="carousel-slides" // stable ids so server and client HTML match
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
            accessibility={{
              announcements,
              screenReaderInstructions: {
                draggable:
                  "To move this slide, press Space or Enter, use the up and down arrow keys, then press Space or Enter again to drop it. Press Escape to cancel.",
              },
            }}
          >
            <SortableContext items={slides} strategy={verticalListSortingStrategy}>
              <ol className={`${card} divide-y divide-stone-200`} aria-label="Slides in carousel order">
                {slides.map((slide, index) => (
                  <SlideRow
                    key={slide.id}
                    slide={slide}
                    index={index}
                    disabled={busy}
                    onToggle={() => toggle(slide)}
                    onEdit={() => setEditing(slide)}
                    onDelete={() => setDeleting(slide)}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
          <p className="text-sm text-stone-500">
            Drag the handle to change the order. With a keyboard, focus the handle and press Space.
          </p>
        </>
      )}

      {editing ? (
        <SlideDialog
          key={editing === "new" ? "new" : editing.id}
          slide={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      ) : null}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this slide?"
        confirmLabel="Delete slide"
        danger
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      >
        {deleting?.heading ? <>&ldquo;{deleting.heading}&rdquo; and its image will be deleted. </> : "The slide and its image will be deleted. "}
        This cannot be undone. To take it off the site for now, hide it instead.
      </ConfirmDialog>
    </div>
  );
}

function SlideRow({
  slide,
  index,
  disabled,
  onToggle,
  onEdit,
  onDelete,
}: {
  slide: Slide;
  index: number;
  disabled: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.id,
    disabled,
  });
  const label = `slide ${index + 1}${slide.heading ? `, ${slide.heading}` : ""}`;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`relative flex flex-wrap items-center gap-x-3 gap-y-2 bg-white p-3 first:rounded-t-2xl last:rounded-b-2xl sm:flex-nowrap sm:gap-4 sm:px-4 ${
        isDragging ? "z-10 rounded-xl shadow-lg ring-1 ring-stone-300" : ""
      }`}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Move ${label}`}
        className={`${iconButton} cursor-grab touch-none active:cursor-grabbing`}
      >
        <GripVertical aria-hidden="true" className="size-5" />
      </button>

      <div className="relative aspect-[16/10] w-24 shrink-0 overflow-hidden rounded-lg bg-stone-100 sm:w-32">
        {/* eslint-disable-next-line @next/next/no-img-element -- small thumbnail of a stored slide image */}
        <img src={slide.imageUrl} alt="" className={`size-full object-cover ${slide.isActive ? "" : "opacity-40 grayscale"}`} />
        <span className="absolute top-1 left-1 rounded-md bg-white/90 px-1.5 text-xs font-medium tabular-nums text-stone-700">
          {index + 1}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${slide.heading ? "text-stone-900" : "text-stone-500 italic"}`}>
          {slide.heading || "No heading"}
        </p>
        {slide.caption ? <p className="mt-0.5 line-clamp-2 text-sm text-stone-600 sm:line-clamp-1">{slide.caption}</p> : null}
        <p className="mt-0.5 truncate text-xs text-stone-500">
          {slide.ctaLabel && slide.ctaUrl ? `Button: ${slide.ctaLabel} (${slide.ctaUrl})` : "No button"}
        </p>
      </div>

      <div className="flex w-full items-center gap-1 border-t border-stone-100 pt-2 sm:w-auto sm:border-0 sm:pt-0">
        <label className={`mr-auto flex h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2 sm:mr-2 ${disabled ? "cursor-not-allowed opacity-60" : ""}`}>
          <button
            type="button"
            role="switch"
            aria-checked={slide.isActive}
            aria-label={`Show ${label} on the site`}
            disabled={disabled}
            onClick={onToggle}
            className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors motion-reduce:transition-none ${focusRing} ${
              slide.isActive ? "bg-emerald-600" : "bg-stone-300"
            }`}
          >
            <span
              aria-hidden="true"
              className={`size-5 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none ${
                slide.isActive ? "translate-x-[18px]" : "translate-x-0.5"
              }`}
            />
          </button>
          <span aria-hidden="true" className={`w-12 text-sm ${slide.isActive ? "text-stone-800" : "text-stone-500"}`}>
            {slide.isActive ? "Shown" : "Hidden"}
          </span>
        </label>
        <button type="button" className={iconButton} aria-label={`Edit ${label}`} title="Edit" disabled={disabled} onClick={onEdit}>
          <Pencil aria-hidden="true" className="size-[18px]" />
        </button>
        <button
          type="button"
          className={`${iconButton} hover:bg-red-50 hover:text-red-700`}
          aria-label={`Delete ${label}`}
          title="Delete"
          disabled={disabled}
          onClick={onDelete}
        >
          <Trash2 aria-hidden="true" className="size-[18px]" />
        </button>
      </div>
    </li>
  );
}
