import { createClient } from "@/lib/supabase/server";
import { mapSettings, mapSlide, type SettingsRow, type SlideRow } from "./read";
import type { SiteSettings, Slide } from "./types";

/*
 * Request-time reads for admin screens. They use the admin's session (not the public cache),
 * so saved changes show at once and hidden slides are included.
 * Call them after requireAdmin(), inside a <Suspense> boundary.
 */

export async function getAdminSite(): Promise<SiteSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).single();
  if (error) throw new Error(`Could not load site settings: ${error.message}`);
  return mapSettings(data as SettingsRow);
}

/** Every slide, hidden ones included, in carousel order. */
export async function getAdminSlides(): Promise<Slide[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("carousel_slides")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Could not load slides: ${error.message}`);
  return (data as SlideRow[]).map(mapSlide);
}
