import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type AdminUser = { id: string; email: string | null };

/** The signed-in admin, or null. Request-time: call it inside a <Suspense> boundary or a server action. */
export async function getAdmin(): Promise<AdminUser | null> {
  // getClaims() reads the clock, so mark this as request-time work for Cache Components.
  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) return null;
  const { data: row } = await supabase.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (!row) return null;
  const email = typeof data.claims.email === "string" ? data.claims.email : null;
  return { id: userId, email };
}

/** For admin pages: sends non-admins to the login page. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** For server actions: throws instead of redirecting. Every admin action must call this first. */
export async function assertAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) throw new Error("Not authorized");
  return admin;
}
