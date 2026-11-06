import { notFound } from "next/navigation";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getTemplate } from "@/lib/templates/registry";

/**
 * Every preview page starts here: admins only (others go to /admin/login), unknown template keys 404.
 * Request-time (reads the session cookie), so call it inside a <Suspense> boundary.
 */
export async function previewTemplate(params: Promise<{ template: string }>) {
  // Supabase's getClaims() calls Date.now(); connection() keeps it out of the prerender (Next flags it otherwise).
  await connection();
  await requireAdmin();
  const { template } = await params;
  const tpl = getTemplate(template);
  if (!tpl) notFound();
  return { tpl, basePath: `/preview/${tpl.key}` };
}
