/**
 * Fonts the blog editor offers. The CSS variables are defined once by app/fonts.ts on <html>,
 * so editor output renders the same in the admin and in every template.
 * Saved HTML stores the `value` string, e.g. style="font-family: var(--font-ed-lora)".
 */
export const EDITOR_FONTS = [
  { label: "Inter", value: "var(--font-ed-inter)" },
  { label: "DM Sans", value: "var(--font-ed-dm-sans)" },
  { label: "Lora", value: "var(--font-ed-lora)" },
  { label: "Playfair Display", value: "var(--font-ed-playfair)" },
  { label: "Merriweather", value: "var(--font-ed-merriweather)" },
  { label: "JetBrains Mono", value: "var(--font-ed-jetbrains)" },
] as const;

/** Allowed font sizes, stored as style="font-size: 18px". */
export const EDITOR_FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "30px", "36px", "48px"] as const;

/** Image sizes, stored as data-size on <img>. */
export const EDITOR_IMAGE_SIZES = ["small", "medium", "full"] as const;
