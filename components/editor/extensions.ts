import type { Attribute } from "@tiptap/core";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { Color, FontFamily, FontSize, TextStyle } from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import { SUPABASE_URL } from "@/lib/supabase/env";
import { EDITOR_IMAGE_SIZES } from "@/lib/cms/editor-fonts";
import { MEDIA_BUCKET } from "@/lib/cms/media";

/**
 * Tiptap setup whose HTML matches docs/CONTRACTS.md "Editor output" and lib/cms/sanitize.ts.
 * Shared by RichTextEditor and the unit tests, so a change here shows up in both.
 */

export type ImageSize = (typeof EDITOR_IMAGE_SIZES)[number];
export const ALIGNMENTS = ["left", "center", "right", "justify"] as const;
export const SAFE_HREF = /^(?:https?:\/\/|mailto:)/i;
const MEDIA_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/`;

/** Body image: block node with alt and data-size; only cms-media URLs are accepted (paste included). */
export const CmsImage = Image.extend({
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "", parseHTML: (el) => el.getAttribute("alt") ?? "" },
      size: {
        default: "full" satisfies ImageSize,
        parseHTML: (el) => {
          const size = el.getAttribute("data-size") ?? "";
          return (EDITOR_IMAGE_SIZES as readonly string[]).includes(size) ? size : "full";
        },
        renderHTML: (attrs) => ({ "data-size": attrs.size }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "img[src]", getAttrs: (el) => ((el.getAttribute("src") ?? "").startsWith(MEDIA_PREFIX) ? null : false) }];
  },
});

/** Multicolor highlight that renders only style="background-color: #hex" (no data-color, no color: inherit). */
const CmsHighlight = Highlight.extend({
  addAttributes() {
    const { color } = this.parent?.() as Record<string, Attribute>;
    return {
      color: {
        ...color,
        renderHTML: (attrs) => (attrs.color ? { style: `background-color: ${attrs.color}` } : {}),
      },
    };
  },
}).configure({ multicolor: true });

export const editorExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3, 4] },
    // Not part of the editor output contract.
    code: false,
    codeBlock: false,
    hardBreak: false,
    link: {
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
      isAllowedUri: (url) => SAFE_HREF.test(url),
      HTMLAttributes: { target: null, rel: null, class: null },
    },
  }),
  TextStyle,
  FontFamily,
  FontSize,
  Color,
  CmsHighlight,
  TextAlign.configure({ types: ["heading", "paragraph"], alignments: [...ALIGNMENTS] }),
  CmsImage,
];
