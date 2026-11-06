import { z } from "zod";
import { SOCIAL_KEYS, TEMPLATE_KEYS, type Socials } from "./types";

/* Max lengths match the CHECK constraints in supabase/migrations/20261106162015_cms_schema.sql. */

const tooLong = (max: number) => `Keep this to ${max} characters or fewer.`;

/** Single-line text, trimmed. */
const line = (max: number) => z.string().trim().max(max, tooLong(max));

/** Multi-line text: Windows line endings become \n, then trimmed. */
const block = (max: number) =>
  z
    .string()
    .transform((v) => v.replace(/\r\n?/g, "\n").trim())
    .pipe(z.string().max(max, tooLong(max)));

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

const isHttpsUrl = (value: string) => {
  const url = parseUrl(value);
  return url?.protocol === "https:" && url.hostname !== "";
};

/** Slide button links: "#anchor", "/path", "https://..." or "mailto:...". Empty means no button. */
export function isSafeCtaUrl(value: string): boolean {
  if (value === "") return true;
  // Spaces, backslashes and control characters can disguise a scheme or a host.
  if (/[\s\\\p{Cc}]/u.test(value)) return false;
  if (value.startsWith("#")) return value.length > 1;
  if (value.startsWith("/")) return !value.startsWith("//");
  const url = parseUrl(value);
  if (url?.protocol === "https:") return url.hostname !== "";
  if (url?.protocol === "mailto:") return /^[^@]+@[^@]+$/.test(url.pathname);
  return false;
}

/** Where to go after sign-in. Only same-site /admin or /preview paths; anything else falls back to /admin. */
export function safeNextPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/")) return "/admin";
  const base = "http://same-site.invalid";
  let url: URL;
  try {
    url = new URL(value, base);
  } catch {
    return "/admin";
  }
  if (url.origin !== base) return "/admin";
  if (!/^\/(admin|preview)(\/|$)/.test(url.pathname) || url.pathname.startsWith("/admin/login")) return "/admin";
  return url.pathname + url.search + url.hash;
}

/** Turns zod issues into { "field": "first message" } for ActionResult.fieldErrors. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "form";
    out[key] ??= issue.message;
  }
  return out;
}

export const INVALID_INPUT = "Some fields need attention.";

/* ---------- sign-in ---------- */

export const signInSchema = z.object({
  email: z.string().trim().pipe(z.email("Enter a valid email address.")),
  password: z.string().min(1, "Enter your password.").max(200, "Email or password is incorrect."),
  next: z.unknown().transform(safeNextPath),
});

/* ---------- site settings ---------- */

const socialUrl = line(300).refine((v) => v === "" || isHttpsUrl(v), "Use a full link that starts with https://");

/** Keyed by SOCIAL_KEYS; empty links are dropped so only set links are stored. */
export const socialsSchema = z
  .partialRecord(z.enum(SOCIAL_KEYS), socialUrl)
  .transform((socials) => Object.fromEntries(Object.entries(socials).filter(([, url]) => url)) as Socials);

export const companyDetailsSchema = z.object({
  companyName: line(120).min(1, "Enter the company name."),
  tagline: line(200),
  email: line(200).refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email address."),
  phone: line(60).regex(/^[0-9+().\-\s]*$/, "Use digits, spaces and + ( ) - . only."),
  address: block(400),
  socials: socialsSchema,
});
export type CompanyDetailsInput = z.input<typeof companyDetailsSchema>;

/** About, Mission and Vision: plain text, paragraphs separated by blank lines. */
export const aboutSchema = z.object({
  about: block(5000),
  mission: block(2000),
  vision: block(2000),
});
export type AboutInput = z.input<typeof aboutSchema>;

export const templateKeySchema = z.enum(TEMPLATE_KEYS, "Pick one of the three templates.");

/* ---------- carousel slides ---------- */

export const slideFieldsSchema = z
  .object({
    heading: line(140),
    caption: block(300),
    ctaLabel: line(40),
    ctaUrl: line(500).refine(isSafeCtaUrl, "Use a link that starts with https://, /, # or mailto:"),
  })
  // Templates show the button only when both are set, so ask for both or neither.
  .refine((s) => !(s.ctaLabel && !s.ctaUrl), { path: ["ctaUrl"], error: "Add a link for the button, or clear the label." })
  .refine((s) => !(s.ctaUrl && !s.ctaLabel), { path: ["ctaLabel"], error: "Add a label for the button, or clear the link." });
export type SlideFieldsInput = z.input<typeof slideFieldsSchema>;

export const slideIdSchema = z.uuid("This slide no longer exists. Reload and try again.");

export const slideOrderSchema = z
  .array(slideIdSchema)
  .min(1, "There are no slides to reorder.")
  .max(200)
  .refine((ids) => new Set(ids).size === ids.length, "Each slide can appear only once.");
