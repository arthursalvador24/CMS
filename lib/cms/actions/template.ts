"use server";
/**
 * Active template action (admin only). Re-checks admin, validates, saves, refreshes the public site.
 *
 *   setActiveTemplate(key: TemplateKey): Promise<ActionResult<SiteSettings>>   "meridian" | "folio" | "onyx"
 */
import { updateTag } from "next/cache";
import { assertAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, type ActionResult } from "../action-result";
import { CMS_TAG, mapSettings, type SettingsRow } from "../read";
import { fieldErrors, INVALID_INPUT, templateKeySchema } from "../schemas";
import type { SiteSettings, TemplateKey } from "../types";

export async function setActiveTemplate(key: TemplateKey): Promise<ActionResult<SiteSettings>> {
  try {
    await assertAdmin();
  } catch {
    return fail("Your session has ended. Sign in again as an admin.");
  }
  const parsed = templateKeySchema.safeParse(key);
  if (!parsed.success) return fail(INVALID_INPUT, { template: fieldErrors(parsed.error).form });
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .update({ active_template: parsed.data })
    .eq("id", 1)
    .select("*")
    .single();
  if (error || !data) {
    console.error("[cms/template] save failed:", error);
    return fail("Could not switch the template. Please try again.");
  }
  updateTag(CMS_TAG);
  return ok(mapSettings(data as SettingsRow));
}
