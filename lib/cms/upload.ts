import type { SupabaseClient } from "@supabase/supabase-js";
import { MEDIA_BUCKET } from "./media";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export type UploadFolder = "logo" | "slides" | "posts" | "inline";

const EXTENSIONS = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" } as const;
type ImageType = keyof typeof EXTENSIONS;

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const startsWith = (b: Uint8Array, sig: number[], offset = 0) =>
  b.length >= offset + sig.length && sig.every((v, i) => b[offset + i] === v);

/** Detects the real image type from the file's first bytes (ignores the file name and browser type). */
export function sniffImageType(bytes: Uint8Array): ImageType | null {
  if (startsWith(bytes, PNG)) return "image/png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  return null;
}

export type ImageCheck = { ok: true; type: ImageType; ext: string } | { ok: false; error: string };

export async function validateImage(file: unknown): Promise<ImageCheck> {
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose an image to upload." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "Images must be 5 MB or smaller." };
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const type = sniffImageType(head);
  if (!type) return { ok: false, error: "Use a PNG, JPG or WebP image." };
  return { ok: true, type, ext: EXTENSIONS[type] };
}

/** Validates and uploads an image under a random name. Pass the cookie-aware server client (admin session). */
export async function uploadImage(
  supabase: SupabaseClient,
  file: unknown,
  folder: UploadFolder,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  const check = await validateImage(file);
  if (!check.ok) return check;
  const path = folder + "/" + crypto.randomUUID() + "." + check.ext;
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file as File, { contentType: check.type, upsert: false });
  if (error) return { ok: false, error: "Upload failed. Please try again." };
  return { ok: true, path };
}

/** Best-effort delete of a replaced image. Sample images under seed/ are kept. */
export async function removeImage(supabase: SupabaseClient, path: string | null | undefined): Promise<void> {
  if (!path || path.startsWith("seed/") || /^https?:\/\//.test(path) || path.startsWith("/")) return;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([path]);
  if (error) console.error("removeImage(" + path + "): " + error.message);
}
