"use server";
/**
 * Site settings actions (admin only). Each re-checks admin, validates, saves, refreshes the public site.
 *
 *   updateCompanyDetails(input: CompanyDetailsInput): Promise<ActionResult<SiteSettings>>
 *       { companyName, tagline, email, phone, address, socials: { facebook?, instagram?, ... } }
 *   uploadLogo(formData: FormData): Promise<ActionResult<SiteSettings>>      field "logo": PNG, JPG or WebP, 5 MB max
 *   removeLogo(): Promise<ActionResult<SiteSettings>>
 *   updateAboutMissionVision(input: AboutInput): Promise<ActionResult<SiteSettings>>   { about, mission, vision }
 *
 * The active template is set in ./template.ts.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { updateTag } from "next/cache";
import { assertAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, type ActionResult } from "../action-result";
import { CMS_TAG, mapSettings, type SettingsRow } from "../read";
import {
  aboutSchema,
  companyDetailsSchema,
  fieldErrors,
  INVALID_INPUT,
  type AboutInput,
  type CompanyDetailsInput,
} from "../schemas";
import type { SiteSettings } from "../types";
import { removeImage, uploadImage } from "../upload";

const NOT_ADMIN = "Your session has ended. Sign in again as an admin.";

async function isAdmin(): Promise<boolean> {
  try {
    await assertAdmin();
    return true;
  } catch {
    return false;
  }
}

function saveFailed(error: unknown): ActionResult<never> {
  console.error("[cms/site] save failed:", error);
  return fail("Could not save your changes. Please try again.");
}

async function saveSettings(
  supabase: SupabaseClient,
  values: Partial<SettingsRow>,
): Promise<ActionResult<SiteSettings>> {
  const { data, error } = await supabase.from("site_settings").update(values).eq("id", 1).select("*").single();
  if (error || !data) return saveFailed(error);
  updateTag(CMS_TAG);
  return ok(mapSettings(data as SettingsRow));
}

async function currentLogoPath(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase.from("site_settings").select("logo_path").eq("id", 1).maybeSingle();
  return (data?.logo_path as string | null | undefined) ?? null;
}

export async function updateCompanyDetails(input: CompanyDetailsInput): Promise<ActionResult<SiteSettings>> {
  if (!(await isAdmin())) return fail(NOT_ADMIN);
  const parsed = companyDetailsSchema.safeParse(input);
  if (!parsed.success) return fail(INVALID_INPUT, fieldErrors(parsed.error));
  const { companyName, tagline, email, phone, address, socials } = parsed.data;
  return saveSettings(await createClient(), { company_name: companyName, tagline, email, phone, address, socials });
}

export async function uploadLogo(formData: FormData): Promise<ActionResult<SiteSettings>> {
  if (!(await isAdmin())) return fail(NOT_ADMIN);
  const supabase = await createClient();
  const upload = await uploadImage(supabase, formData.get("logo"), "logo");
  if (!upload.ok) return fail(upload.error, { logo: upload.error });
  const oldPath = await currentLogoPath(supabase);
  const result = await saveSettings(supabase, { logo_path: upload.path });
  // Never leave two logos behind: drop the new file if the save failed, the old one if it worked.
  await removeImage(supabase, result.ok ? oldPath : upload.path);
  return result;
}

export async function removeLogo(): Promise<ActionResult<SiteSettings>> {
  if (!(await isAdmin())) return fail(NOT_ADMIN);
  const supabase = await createClient();
  const oldPath = await currentLogoPath(supabase);
  const result = await saveSettings(supabase, { logo_path: null });
  if (result.ok) await removeImage(supabase, oldPath);
  return result;
}

export async function updateAboutMissionVision(input: AboutInput): Promise<ActionResult<SiteSettings>> {
  if (!(await isAdmin())) return fail(NOT_ADMIN);
  const parsed = aboutSchema.safeParse(input);
  if (!parsed.success) return fail(INVALID_INPUT, fieldErrors(parsed.error));
  return saveSettings(await createClient(), parsed.data);
}
