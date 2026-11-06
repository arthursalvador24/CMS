"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { updateTag } from "next/cache";
import { z } from "zod";
import { assertAdmin, type AdminUser } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, type ActionResult } from "../action-result";
import { mediaUrl } from "../media";
import { CMS_TAG } from "../read";
import { MEDIA_PREFIX, sanitizePostHtml } from "../sanitize";
import { SLUG_MAX, SLUG_PATTERN, uniqueSlug } from "../slug";
import { removeImage, uploadImage } from "../upload";

const NOT_ADMIN = "You need to be signed in as an admin.";
const NOT_FOUND = "Post not found.";
const Id = z.uuid();

async function admin(): Promise<AdminUser | null> {
  try {
    return await assertAdmin();
  } catch {
    return null;
  }
}

/** `base` if no other post uses it, otherwise the first free `base-2`, `base-3`... */
async function freeSlug(supabase: SupabaseClient, base: string, exceptId?: string): Promise<string> {
  let query = supabase.from("posts").select("slug").like("slug", `${base}%`);
  if (exceptId) query = query.neq("id", exceptId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return uniqueSlug(base, (data ?? []).map((row) => row.slug as string));
}

/* ---------- create / save ---------- */

/** New draft titled "Untitled post" with a free "untitled-post" slug. */
export async function createPost(): Promise<ActionResult<{ id: string; slug: string }>> {
  const user = await admin();
  if (!user) return fail(NOT_ADMIN);
  const supabase = await createClient();
  try {
    const slug = await freeSlug(supabase, "untitled-post");
    const { data, error } = await supabase
      .from("posts")
      .insert({ title: "Untitled post", slug, status: "draft", author_id: user.id })
      .select("id, slug")
      .single();
    if (error) return fail("Could not create the post. Please try again.");
    return ok({ id: data.id as string, slug: data.slug as string });
  } catch {
    return fail("Could not create the post. Please try again.");
  }
}

const SavePostInput = z.object({
  id: Id,
  title: z.string().trim().min(1, "Add a title.").max(200, "Keep the title under 200 characters."),
  slug: z
    .string()
    .trim()
    .min(1, "Add a slug.")
    .max(SLUG_MAX, `Keep the slug under ${SLUG_MAX} characters.`)
    .regex(SLUG_PATTERN, "Use lowercase letters, numbers and single hyphens."),
  excerpt: z.string().trim().max(400, "Keep the excerpt under 400 characters."),
  contentJson: z
    .looseObject({ type: z.literal("doc") })
    .nullable()
    .refine((json) => json === null || JSON.stringify(json).length <= 2_000_000, "This post is too long."),
  contentHtml: z.string().max(500_000, "This post is too long."),
});
export type SavePostInput = z.input<typeof SavePostInput>;

/** Saves every field (also used by autosave). The HTML is sanitized here, never trusted from the browser. */
export async function savePost(input: SavePostInput): Promise<ActionResult<{ updatedAt: string }>> {
  if (!(await admin())) return fail(NOT_ADMIN);
  const parsed = SavePostInput.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return fail("Check the highlighted fields.", fieldErrors);
  }
  const { id, title, slug, excerpt, contentJson } = parsed.data;
  const contentHtml = sanitizePostHtml(parsed.data.contentHtml);
  if (contentHtml.length > 500_000) return fail("This post is too long.", { contentHtml: "This post is too long." });

  const supabase = await createClient();
  const slugTaken = (suggestion: string) =>
    fail(`The slug "${slug}" is already used by another post.`, { slug: `Already used. Try "${suggestion}".` });
  try {
    const free = await freeSlug(supabase, slug, id);
    if (free !== slug) return slugTaken(free);
    const { data, error } = await supabase
      .from("posts")
      .update({ title, slug, excerpt, content_json: contentJson, content_html: contentHtml })
      .eq("id", id)
      .select("status, updated_at")
      .maybeSingle();
    if (error?.code === "23505") return slugTaken(await freeSlug(supabase, slug, id));
    if (error) return fail("Could not save the post. Please try again.");
    if (!data) return fail(NOT_FOUND);
    // Draft autosaves do not change the public site, so they skip the cache refresh.
    if (data.status === "published") updateTag(CMS_TAG);
    return ok({ updatedAt: data.updated_at as string });
  } catch {
    return fail("Could not save the post. Please try again.");
  }
}

/* ---------- publish ---------- */

/** Publishes the post; published_at is set to now only the first time. */
export async function publishPost(id: string): Promise<ActionResult<{ publishedAt: string }>> {
  if (!(await admin())) return fail(NOT_ADMIN);
  if (!Id.safeParse(id).success) return fail(NOT_FOUND);
  const supabase = await createClient();
  const { data: row, error } = await supabase.from("posts").select("published_at").eq("id", id).maybeSingle();
  if (error) return fail("Could not publish the post. Please try again.");
  if (!row) return fail(NOT_FOUND);
  const publishedAt = (row.published_at as string | null) ?? new Date().toISOString();
  const { error: updateError } = await supabase
    .from("posts")
    .update({ status: "published", published_at: publishedAt })
    .eq("id", id);
  if (updateError) return fail("Could not publish the post. Please try again.");
  updateTag(CMS_TAG);
  return ok({ publishedAt });
}

/** Back to draft. published_at is kept so a later publish keeps the original date. */
export async function unpublishPost(id: string): Promise<ActionResult> {
  if (!(await admin())) return fail(NOT_ADMIN);
  if (!Id.safeParse(id).success) return fail(NOT_FOUND);
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").update({ status: "draft" }).eq("id", id).select("id").maybeSingle();
  if (error) return fail("Could not unpublish the post. Please try again.");
  if (!data) return fail(NOT_FOUND);
  updateTag(CMS_TAG);
  return ok(undefined);
}

/* ---------- images ---------- */

/** Uploads formData "file" as the cover (cms-media/posts/) and removes the previous cover. */
export async function setPostCover(id: string, formData: FormData): Promise<ActionResult<{ path: string; url: string }>> {
  if (!(await admin())) return fail(NOT_ADMIN);
  if (!Id.safeParse(id).success) return fail(NOT_FOUND);
  const supabase = await createClient();
  const { data: row, error } = await supabase.from("posts").select("cover_image_path").eq("id", id).maybeSingle();
  if (error) return fail("Could not update the cover. Please try again.");
  if (!row) return fail(NOT_FOUND);

  const upload = await uploadImage(supabase, formData.get("file"), "posts");
  if (!upload.ok) return fail(upload.error, { file: upload.error });
  const { error: updateError } = await supabase.from("posts").update({ cover_image_path: upload.path }).eq("id", id);
  if (updateError) {
    await removeImage(supabase, upload.path);
    return fail("Could not update the cover. Please try again.");
  }
  await removeImage(supabase, row.cover_image_path as string | null);
  updateTag(CMS_TAG);
  return ok({ path: upload.path, url: mediaUrl(upload.path) ?? "" });
}

export async function removePostCover(id: string): Promise<ActionResult> {
  if (!(await admin())) return fail(NOT_ADMIN);
  if (!Id.safeParse(id).success) return fail(NOT_FOUND);
  const supabase = await createClient();
  const { data: row, error } = await supabase.from("posts").select("cover_image_path").eq("id", id).maybeSingle();
  if (error) return fail("Could not remove the cover. Please try again.");
  if (!row) return fail(NOT_FOUND);
  const { error: updateError } = await supabase.from("posts").update({ cover_image_path: null }).eq("id", id);
  if (updateError) return fail("Could not remove the cover. Please try again.");
  await removeImage(supabase, row.cover_image_path as string | null);
  updateTag(CMS_TAG);
  return ok(undefined);
}

/**
 * Uploads formData "file" for the post body (cms-media/inline/) and returns its public URL.
 * No cache refresh: nothing public changes until the post is saved.
 */
export async function uploadInlineImage(formData: FormData): Promise<ActionResult<{ path: string; url: string }>> {
  if (!(await admin())) return fail(NOT_ADMIN);
  const supabase = await createClient();
  const upload = await uploadImage(supabase, formData.get("file"), "inline");
  if (!upload.ok) return fail(upload.error, { file: upload.error });
  return ok({ path: upload.path, url: mediaUrl(upload.path) ?? "" });
}

/* ---------- delete ---------- */

const INLINE_PATH = new RegExp(`${MEDIA_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(inline/[A-Za-z0-9_-]+\\.(?:png|jpg|webp))`, "g");

/** Deletes the post, then its cover and its inline/ body images unless another post still uses them. */
export async function deletePost(id: string): Promise<ActionResult> {
  if (!(await admin())) return fail(NOT_ADMIN);
  if (!Id.safeParse(id).success) return fail(NOT_FOUND);
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id)
    .select("cover_image_path, content_html")
    .maybeSingle();
  if (error) return fail("Could not delete the post. Please try again.");
  if (!row) return fail(NOT_FOUND);

  const paths = new Set<string>([...(row.content_html as string).matchAll(INLINE_PATH)].map((m) => m[1]));
  if (row.cover_image_path) paths.add(row.cover_image_path as string);
  await Promise.all(
    [...paths].map(async (path) => {
      // removeImage already keeps seed/ files; this keeps files another post still shows.
      const [asCover, inBody] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("cover_image_path", path),
        supabase.from("posts").select("id", { count: "exact", head: true }).like("content_html", `%${path}%`),
      ]);
      if (asCover.error || inBody.error || asCover.count || inBody.count) return;
      await removeImage(supabase, path);
    }),
  );
  updateTag(CMS_TAG);
  return ok(undefined);
}
