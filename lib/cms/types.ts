import type { ReactNode } from "react";

export const TEMPLATE_KEYS = ["meridian", "folio", "onyx"] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number];
export function isTemplateKey(value: unknown): value is TemplateKey {
  return typeof value === "string" && (TEMPLATE_KEYS as readonly string[]).includes(value);
}

export const SOCIAL_KEYS = ["facebook", "instagram", "linkedin", "x", "youtube", "tiktok"] as const;
export type SocialKey = (typeof SOCIAL_KEYS)[number];
export type Socials = Partial<Record<SocialKey, string>>;

export type SiteSettings = {
  companyName: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  socials: Socials;
  logoPath: string | null;
  logoUrl: string | null;
  about: string; // plain text, paragraphs separated by blank lines
  mission: string;
  vision: string;
  activeTemplate: TemplateKey;
  updatedAt: string;
};

export type Slide = {
  id: string;
  imagePath: string;
  imageUrl: string;
  heading: string;
  caption: string;
  ctaLabel: string;
  ctaUrl: string; // may be "#about", "/blog" or an absolute URL
  sortOrder: number;
  isActive: boolean;
};

export type PostStatus = "draft" | "published";

export type PostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverPath: string | null;
  coverUrl: string | null;
  publishedAt: string | null;
  readingMinutes: number;
};

export type Post = PostSummary & {
  status: PostStatus;
  contentHtml: string; // sanitized on save; render inside <div className="cms-content">
  contentJson: unknown | null; // Tiptap JSON; null means "load the editor from contentHtml"
  createdAt: string;
  updatedAt: string;
};

/** Everything a template's landing page needs. */
export type SiteData = { site: SiteSettings; slides: Slide[]; latestPosts: PostSummary[] };
export type BlogIndexData = { site: SiteSettings; posts: PostSummary[]; page: number; totalPages: number };
export type BlogPostData = { site: SiteSettings; post: Post; prev: PostSummary | null; next: PostSummary | null };

/**
 * basePath is "" on the live site and "/preview/<key>" (or "/dev/<key>") in previews.
 * Build every internal link as `${basePath}/blog` etc. so previews stay inside the preview.
 */
export type TemplateProps<T> = { data: T; basePath: string };

export type TemplateModule = {
  key: TemplateKey;
  name: string;
  description: string;
  Home: (props: TemplateProps<SiteData>) => ReactNode | Promise<ReactNode>;
  BlogIndex: (props: TemplateProps<BlogIndexData>) => ReactNode | Promise<ReactNode>;
  BlogPost: (props: TemplateProps<BlogPostData>) => ReactNode | Promise<ReactNode>;
};
