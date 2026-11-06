import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { mapPost, mapPostSummary, type PostRow } from "./read";
import type { Post, PostStatus, PostSummary } from "./types";

/**
 * Request-time admin reads (drafts included). Call them from admin pages inside <Suspense>,
 * after requireAdmin(); row-level security also hides drafts from anyone who is not an admin.
 */

export type AdminPostListItem = PostSummary & { status: PostStatus; updatedAt: string };

const LIST_COLUMNS = "id,title,slug,excerpt,cover_image_path,published_at,content_html,status,updated_at";

/** Newest edits first. `q` matches the title; `status` filters drafts or published posts. */
export async function listAdminPosts({
  q,
  status,
}: { q?: string; status?: PostStatus | "all" } = {}): Promise<AdminPostListItem[]> {
  const supabase = await createClient();
  let query = supabase.from("posts").select(LIST_COLUMNS).order("updated_at", { ascending: false });
  if (status === "draft" || status === "published") query = query.eq("status", status);
  const term = q?.trim();
  if (term) query = query.ilike("title", `%${term.replace(/[\\%_]/g, "\\$&")}%`);
  const { data, error } = await query;
  if (error) throw new Error(`Could not load posts: ${error.message}`);
  return (data as PostRow[]).map((row) => ({
    ...mapPostSummary(row),
    status: row.status === "published" ? "published" : "draft",
    updatedAt: row.updated_at ?? "",
  }));
}

/** One post with its content, or null when the id is unknown or not a uuid. */
export async function getAdminPost(id: string): Promise<Post | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load post: ${error.message}`);
  return data ? mapPost(data as PostRow) : null;
}
