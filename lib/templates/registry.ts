import { isTemplateKey, type TemplateKey, type TemplateModule } from "@/lib/cms/types";
import folio from "@/templates/folio";
import meridian from "@/templates/meridian";
import onyx from "@/templates/onyx";

export const TEMPLATES: Record<TemplateKey, TemplateModule> = { meridian, folio, onyx };

/** The template for a key, or null for an unknown key (routes call notFound()). */
export function getTemplate(key: string): TemplateModule | null {
  return isTemplateKey(key) ? TEMPLATES[key] : null;
}
