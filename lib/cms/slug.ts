/** Same rule as the posts.slug check constraint in CMSDB. */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const SLUG_MAX = 120;

/** "Café & Co: Spring 2026!" -> "cafe-co-spring-2026". Never empty. */
export function slugify(input: string): string {
  const slug = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 100) // leaves room for a "-2" style suffix under SLUG_MAX
    .replace(/^-+|-+$/g, "");
  return slug || "post";
}

/** `base` when it is free, otherwise the first free `base-2`, `base-3`... */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
}
