import sanitizeHtml from "sanitize-html";
import { SUPABASE_URL } from "@/lib/supabase/env";
import { EDITOR_FONTS, EDITOR_FONT_SIZES, EDITOR_IMAGE_SIZES } from "./editor-fonts";
import { MEDIA_BUCKET } from "./media";

/**
 * Allowlist of exactly the blog editor's output (docs/CONTRACTS.md, "Editor output").
 * Anything else is removed: scripts, event handlers, classes, ids, iframes, other styles,
 * non http/https/mailto links and images that are not in the cms-media bucket.
 */

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const oneOf = (values: readonly string[]) => values.map((v) => new RegExp(`^${escapeRe(v)}$`));

const HEX = [/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i];
const ALIGN = { "text-align": oneOf(["left", "center", "right", "justify"]) };
const SAFE_HREF = /^(?:https?:\/\/|mailto:)/i;
/** Image width/height: a whole number of pixels from 1 to 10000. */
const PIXELS = /^(?:[1-9]\d{0,3}|10000)$/;

export const MEDIA_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/`;
/** cms-media file URL such as .../cms-media/inline/<uuid>.webp (no "..", query or hash). */
const MEDIA_SRC = new RegExp(`^${escapeRe(MEDIA_PREFIX)}(?:[A-Za-z0-9_-]+/)*[A-Za-z0-9_-]+\\.(?:png|jpe?g|webp)$`);

// Browsers serialize the editor's hex colors as rgb() (ProseMirror sets styles through cssText).
const RGB = /rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/gi;
const byte = (n: string) => Math.min(255, Number(n)).toString(16).padStart(2, "0");
const rgbToHex: sanitizeHtml.Transformer = (tagName, attribs) => ({
  tagName,
  attribs: attribs.style ? { ...attribs, style: attribs.style.replace(RGB, (_, r, g, b) => `#${byte(r)}${byte(g)}${byte(b)}`) } : attribs,
});

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "hr", "img", "strong", "em", "u", "s", "a", "mark", "span"],
  allowedAttributes: {
    p: ["style"],
    h2: ["style"],
    h3: ["style"],
    h4: ["style"],
    a: ["href"],
    mark: ["style"],
    span: ["style"],
    img: ["src", "alt", "width", "height", "data-size"],
  },
  allowedStyles: {
    p: ALIGN,
    h2: ALIGN,
    h3: ALIGN,
    h4: ALIGN,
    span: {
      "font-family": oneOf(EDITOR_FONTS.map((f) => f.value)),
      "font-size": oneOf(EDITOR_FONT_SIZES),
      color: HEX,
    },
    mark: { "background-color": HEX },
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["https"] },
  allowProtocolRelative: false,
  transformTags: {
    span: rgbToHex,
    mark: rgbToHex,
    // Relative and unknown-scheme hrefs are dropped too, not only javascript:.
    a: (tagName, attribs) => {
      const href = (attribs.href ?? "").trim();
      const kept: sanitizeHtml.Attributes = SAFE_HREF.test(href) ? { href } : {};
      return { tagName, attribs: kept };
    },
    img: (tagName, { width, height, "data-size": size, ...attribs }) => ({
      tagName,
      attribs: {
        ...attribs,
        ...(PIXELS.test(width ?? "") ? { width } : {}),
        ...(PIXELS.test(height ?? "") ? { height } : {}),
        ...((EDITOR_IMAGE_SIZES as readonly string[]).includes(size) ? { "data-size": size } : {}),
      },
    }),
  },
  exclusiveFilter: (frame) => {
    if (frame.tag === "img") return !MEDIA_SRC.test(frame.attribs.src ?? "");
    if (frame.tag === "a" && !frame.attribs.href) return "excludeTag";
    if (frame.tag === "span" && !frame.attribs.style) return "excludeTag";
    return false;
  },
};

export function sanitizePostHtml(html: string): string {
  return sanitizeHtml(html, OPTIONS);
}
