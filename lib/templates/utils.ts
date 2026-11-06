import { SOCIAL_KEYS, type SocialKey, type Socials } from "@/lib/cms/types";

/** Posts per page on every blog index. */
export const POSTS_PER_PAGE = 9;

/**
 * Internal link inside the current site or preview.
 * href("", "/blog") -> "/blog"; href("/preview/folio", "/") -> "/preview/folio";
 * href("/preview/folio", "/#about") -> "/preview/folio#about".
 */
export function href(basePath: string, path = "/"): string {
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  const [, pathname, rest] = /^([^?#]*)(.*)$/.exec(withSlash)!;
  if (pathname === "/") return `${basePath || "/"}${rest}`;
  return `${basePath}${withSlash}`;
}

/**
 * A slide button link that is safe to render, or null.
 * "#about" stays an in-page anchor, "/blog" gets the basePath, http(s), mailto and tel pass through.
 */
export function ctaHref(url: string, basePath: string): string | null {
  const value = url.trim();
  if (!value) return null;
  if (value.startsWith("#")) return value;
  if (value.startsWith("/") && !value.startsWith("//")) return href(basePath, value);
  return /^(https?:|mailto:|tel:)/i.test(value) ? value : null;
}

/** True when a link leaves the site (opens normally, but templates may mark it). */
export function isExternal(url: string): boolean {
  return /^https?:/i.test(url);
}

/** "Oct 28, 2026". Fixed to UTC so server output never depends on the host time zone. */
export function formatDate(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

/** Plain text (About, Mission, Vision) to paragraphs: blank lines separate them. */
export function paragraphs(text: string): string[] {
  return text
    .split(/\r?\n\s*\r?\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export const SOCIAL_LABELS: Record<SocialKey, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  x: "X",
  youtube: "YouTube",
  tiktok: "TikTok",
};

/** Social links in a fixed order, only the ones set to an http(s) URL. */
export function socialLinks(socials: Socials): { key: SocialKey; label: string; url: string }[] {
  return SOCIAL_KEYS.flatMap((key) => {
    const url = socials[key]?.trim();
    return url && /^https?:\/\//i.test(url) ? [{ key, label: SOCIAL_LABELS[key], url }] : [];
  });
}

/** `?page=` to a page number (1 or more). */
export function pageParam(value: string | string[] | undefined): number {
  const n = Number.parseInt(Array.isArray(value) ? value[0] : (value ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** `tel:` link for a phone number as typed by the admin. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
