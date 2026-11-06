import { SUPABASE_URL } from "@/lib/supabase/env";

export const MEDIA_BUCKET = "cms-media";

/** Public URL for a cms-media path. Absolute URLs and site-relative paths pass through. */
export function mediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path) || path.startsWith("/")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
}
