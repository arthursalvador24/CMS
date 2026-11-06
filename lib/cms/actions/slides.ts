"use server";
/**
 * Carousel slide actions (admin only). Each re-checks admin, validates, saves, refreshes the public site.
 *
 *   createSlide(formData: FormData): Promise<ActionResult<Slide>>
 *       fields: image (required: PNG, JPG or WebP, 4 MB max), heading, caption, ctaLabel, ctaUrl. Added last, visible.
 *   updateSlide(formData: FormData): Promise<ActionResult<Slide>>
 *       fields: id, heading, caption, ctaLabel, ctaUrl, image (optional; replaces the old image, which is deleted)
 *   reorderSlides(ids: string[]): Promise<ActionResult>          every slide id (hidden ones too), in the new order
 *   setSlideActive(id: string, isActive: boolean): Promise<ActionResult<Slide>>    show or hide
 *   deleteSlide(id: string): Promise<ActionResult>               also deletes its image
 *
 * Button rule: ctaLabel and ctaUrl are both set or both empty. ctaUrl: "#anchor", "/path", "https://..." or "mailto:...".
 */
import { updateTag } from "next/cache";
import type { z } from "zod";
import { assertAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, type ActionResult } from "../action-result";
import { CMS_TAG, mapSlide, type SlideRow } from "../read";
import { fieldErrors, INVALID_INPUT, slideFieldsSchema, slideIdSchema, slideOrderSchema } from "../schemas";
import type { Slide } from "../types";
import { removeImage, uploadImage } from "../upload";

const NOT_ADMIN = "Your session has ended. Sign in again as an admin.";
const NOT_FOUND = "This slide no longer exists. Reload and try again.";

async function isAdmin(): Promise<boolean> {
  try {
    await assertAdmin();
    return true;
  } catch {
    return false;
  }
}

function saveFailed(error: unknown): ActionResult<never> {
  console.error("[cms/slides] save failed:", error);
  return fail("Could not save your changes. Please try again.");
}

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

function parseFields(formData: FormData) {
  return slideFieldsSchema.safeParse({
    heading: text(formData, "heading"),
    caption: text(formData, "caption"),
    ctaLabel: text(formData, "ctaLabel"),
    ctaUrl: text(formData, "ctaUrl"),
  });
}

type SlideFields = z.output<typeof slideFieldsSchema>;
const toRow = (s: SlideFields) => ({ heading: s.heading, caption: s.caption, cta_label: s.ctaLabel, cta_url: s.ctaUrl });

export async function createSlide(formData: FormData): Promise<ActionResult<Slide>> {
  if (!(await isAdmin())) return fail(NOT_ADMIN);
  const parsed = parseFields(formData);
  if (!parsed.success) return fail(INVALID_INPUT, fieldErrors(parsed.error));
  const supabase = await createClient();
  const upload = await uploadImage(supabase, formData.get("image"), "slides");
  if (!upload.ok) return fail(upload.error, { image: upload.error });
  const { data: last } = await supabase
    .from("carousel_slides")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data, error } = await supabase
    .from("carousel_slides")
    .insert({ ...toRow(parsed.data), image_path: upload.path, sort_order: ((last?.sort_order as number) ?? 0) + 1 })
    .select("*")
    .single();
  if (error || !data) {
    await removeImage(supabase, upload.path);
    return saveFailed(error);
  }
  updateTag(CMS_TAG);
  return ok(mapSlide(data as SlideRow));
}

export async function updateSlide(formData: FormData): Promise<ActionResult<Slide>> {
  if (!(await isAdmin())) return fail(NOT_ADMIN);
  const id = slideIdSchema.safeParse(formData.get("id"));
  if (!id.success) return fail(NOT_FOUND);
  const parsed = parseFields(formData);
  if (!parsed.success) return fail(INVALID_INPUT, fieldErrors(parsed.error));
  const supabase = await createClient();

  // A form without a new file still sends an empty File; that means "keep the current image".
  const image = formData.get("image");
  let newPath: string | null = null;
  let oldPath: string | null = null;
  if (image instanceof File && image.size > 0) {
    const upload = await uploadImage(supabase, image, "slides");
    if (!upload.ok) return fail(upload.error, { image: upload.error });
    newPath = upload.path;
    const { data: before } = await supabase.from("carousel_slides").select("image_path").eq("id", id.data).maybeSingle();
    oldPath = (before?.image_path as string | undefined) ?? null;
  }

  const { data, error } = await supabase
    .from("carousel_slides")
    .update(newPath ? { ...toRow(parsed.data), image_path: newPath } : toRow(parsed.data))
    .eq("id", id.data)
    .select("*")
    .maybeSingle();
  if (error || !data) {
    await removeImage(supabase, newPath);
    return error ? saveFailed(error) : fail(NOT_FOUND);
  }
  await removeImage(supabase, oldPath);
  updateTag(CMS_TAG);
  return ok(mapSlide(data as SlideRow));
}

export async function reorderSlides(ids: string[]): Promise<ActionResult> {
  if (!(await isAdmin())) return fail(NOT_ADMIN);
  const parsed = slideOrderSchema.safeParse(ids);
  if (!parsed.success) return fail(INVALID_INPUT, fieldErrors(parsed.error));
  const supabase = await createClient();
  const { data: rows, error: readError } = await supabase.from("carousel_slides").select("id");
  if (readError || !rows) return saveFailed(readError);
  const existing = new Set(rows.map((r) => r.id as string));
  if (rows.length !== parsed.data.length || !parsed.data.every((id) => existing.has(id))) {
    return fail("The slide list changed. Reload and try again.");
  }
  // shortcut: one update per slide, not atomic; move to a SQL function if partial saves ever show up.
  const results = await Promise.all(
    parsed.data.map((id, index) => supabase.from("carousel_slides").update({ sort_order: index + 1 }).eq("id", id)),
  );
  const failed = results.find((r) => r.error);
  if (failed) return saveFailed(failed.error);
  updateTag(CMS_TAG);
  return ok(undefined);
}

export async function setSlideActive(id: string, isActive: boolean): Promise<ActionResult<Slide>> {
  if (!(await isAdmin())) return fail(NOT_ADMIN);
  const parsedId = slideIdSchema.safeParse(id);
  if (!parsedId.success) return fail(NOT_FOUND);
  if (typeof isActive !== "boolean") return fail(INVALID_INPUT);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("carousel_slides")
    .update({ is_active: isActive })
    .eq("id", parsedId.data)
    .select("*")
    .maybeSingle();
  if (error) return saveFailed(error);
  if (!data) return fail(NOT_FOUND);
  updateTag(CMS_TAG);
  return ok(mapSlide(data as SlideRow));
}

export async function deleteSlide(id: string): Promise<ActionResult> {
  if (!(await isAdmin())) return fail(NOT_ADMIN);
  const parsedId = slideIdSchema.safeParse(id);
  if (!parsedId.success) return fail(NOT_FOUND);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("carousel_slides")
    .delete()
    .eq("id", parsedId.data)
    .select("image_path")
    .maybeSingle();
  if (error) return saveFailed(error);
  if (!data) return fail(NOT_FOUND);
  await removeImage(supabase, data.image_path as string);
  updateTag(CMS_TAG);
  return ok(undefined);
}
