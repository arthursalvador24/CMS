"use server";
/**
 *   signIn(prev: SignInState, formData: FormData): Promise<SignInState>   for useActionState; fields: email, password, next
 *   signOut(): Promise<never>                                              <form action={signOut}>; ends this browser's session
 */
import { redirect } from "next/navigation";
import { fieldErrors, signInSchema } from "@/lib/cms/schemas";
import { createClient } from "@/lib/supabase/server";

/** null before the first submit. `email` refills the field after a failed attempt. */
export type SignInState = { error: string; email: string; fieldErrors?: Record<string, string> } | null;

const WRONG_CREDENTIALS = "Email or password is incorrect.";

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const rawEmail = formData.get("email");
  const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
  const parsed = signInSchema.safeParse({
    email: rawEmail,
    password: formData.get("password"),
    next: formData.get("next"),
  });
  if (!parsed.success) return { error: "Check the highlighted fields.", email, fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error || !data.user) {
    if (error?.status === 429) return { error: "Too many attempts. Wait a minute and try again.", email };
    return { error: WRONG_CREDENTIALS, email };
  }

  const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
  if (!admin) {
    await supabase.auth.signOut({ scope: "local" });
    return { error: "This account does not have admin access.", email };
  }

  redirect(parsed.data.next);
}

export async function signOut(): Promise<never> {
  const supabase = await createClient();
  // "local" ends only this browser's session; the default ("global") would sign the admin out everywhere.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/admin/login");
}
