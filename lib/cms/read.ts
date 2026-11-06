import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { mediaUrl } from "./media";
import {
  isTemplateKey,
  type Post,
  type PostStatus,
  type PostSummary,
  type SiteData,
  type SiteSettings,
  type Slide,
  type Socials,
} from "./types";

/** Every public read is tagged with this. Admin server actions call updateTag(CMS_TAG) after a save. */
export const CMS_TAG = "cms";

/* ---------- row mappers (shared with admin reads) ---------- */

export type SettingsRow = {
  company_name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  socials: Socials | null;
  logo_path: string | null;
  about: string;
  mission: string;
  vision: string;
  active_template: string;
  updated_at: string;
};

export function mapSettings(row: SettingsRow): SiteSettings {
  return {
    companyName: row.company_name,
    tagline: row.tagline,
    email: row.email,
    phone: row.phone,
    address: row.address,
    socials: row.socials ?? {},
    logoPath: row.logo_path,
    logoUrl: mediaUrl(row.logo_path),
    about: row.about,
    mission: row.mission,
    vision: row.vision,
    activeTemplate: isTemplateKey(row.active_template) ? row.active_template : "meridian",
    updatedAt: row.updated_at,
  };
}

export type SlideRow = {
  id: string;
  image_path: string;
  heading: string;
  caption: string;
  cta_label: string;
  cta_url: string;
  sort_order: number;
  is_active: boolean;
};

export function mapSlide(row: SlideRow): Slide {
  return {
    id: row.id,
    imagePath: row.image_path,
    imageUrl: mediaUrl(row.image_path) ?? "",
    heading: row.heading,
    caption: row.caption,
    ctaLabel: row.cta_label,
    ctaUrl: row.cta_url,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

export type PostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_path: string | null;
  content_json?: unknown | null;
  content_html?: string;
  status?: string;
  published_at: string | null;
  created_at?: string;
  updated_at?: string;
};

export function readingMinutes(html: string): number {
  const words = html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function mapPostSummary(row: PostRow): PostSummary {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    coverPath: row.cover_image_path,
    coverUrl: mediaUrl(row.cover_image_path),
    publishedAt: row.published_at,
    readingMinutes: readingMinutes(row.content_html ?? ""),
  };
}

export function mapPost(row: PostRow): Post {
  return {
    ...mapPostSummary(row),
    status: (row.status === "published" ? "published" : "draft") as PostStatus,
    contentHtml: row.content_html ?? "",
    contentJson: row.content_json ?? null,
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
  };
}

const SUMMARY_COLUMNS = "id,title,slug,excerpt,cover_image_path,published_at,content_html";

/* ---------- public reads (cached, published content only) ---------- */

export async function getSite(): Promise<SiteSettings> {
  "use cache";
  cacheTag(CMS_TAG);
  cacheLife("minutes");
  const { data, error } = await createPublicClient().from("site_settings").select("*").eq("id", 1).single();
  if (error) throw new Error(`Could not load site settings: ${error.message}`);
  return mapSettings(data as SettingsRow);
}

export async function getActiveSlides(): Promise<Slide[]> {
  "use cache";
  cacheTag(CMS_TAG);
  cacheLife("minutes");
  const { data, error } = await createPublicClient()
    .from("carousel_slides")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(`Could not load slides: ${error.message}`);
  return (data as SlideRow[]).map(mapSlide);
}

export async function getLatestPosts(limit = 3): Promise<PostSummary[]> {
  "use cache";
  cacheTag(CMS_TAG);
  cacheLife("minutes");
  const { data, error } = await createPublicClient()
    .from("posts")
    .select(SUMMARY_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw new Error(`Could not load posts: ${error.message}`);
  return (data as PostRow[]).map(mapPostSummary);
}

export async function getPublishedPosts(
  page = 1,
  perPage = 9,
): Promise<{ posts: PostSummary[]; page: number; totalPages: number; total: number }> {
  "use cache";
  cacheTag(CMS_TAG);
  cacheLife("minutes");
  const safePage = Math.max(1, Math.floor(page) || 1);
  const from = (safePage - 1) * perPage;
  const { data, error, count } = await createPublicClient()
    .from("posts")
    .select(SUMMARY_COLUMNS, { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .range(from, from + perPage - 1);
  if (error) throw new Error(`Could not load posts: ${error.message}`);
  const total = count ?? 0;
  return {
    posts: (data as PostRow[]).map(mapPostSummary),
    page: safePage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
    total,
  };
}

/** A published post plus its neighbours (prev = older, next = newer). Null when not found. */
export async function getPublishedPost(
  slug: string,
): Promise<{ post: Post; prev: PostSummary | null; next: PostSummary | null } | null> {
  "use cache";
  cacheTag(CMS_TAG);
  cacheLife("minutes");
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error(`Could not load post: ${error.message}`);
  if (!data) return null;
  const post = mapPost(data as PostRow);
  const at = post.publishedAt ?? post.createdAt;
  const [older, newer] = await Promise.all([
    supabase
      .from("posts")
      .select(SUMMARY_COLUMNS)
      .eq("status", "published")
      .lt("published_at", at)
      .order("published_at", { ascending: false })
      .limit(1),
    supabase
      .from("posts")
      .select(SUMMARY_COLUMNS)
      .eq("status", "published")
      .gt("published_at", at)
      .order("published_at", { ascending: true })
      .limit(1),
  ]);
  return {
    post,
    prev: older.data?.[0] ? mapPostSummary(older.data[0] as PostRow) : null,
    next: newer.data?.[0] ? mapPostSummary(newer.data[0] as PostRow) : null,
  };
}

export async function getSiteData(): Promise<SiteData> {
  const [site, slides, latestPosts] = await Promise.all([getSite(), getActiveSlides(), getLatestPosts(3)]);
  return { site, slides, latestPosts };
}
