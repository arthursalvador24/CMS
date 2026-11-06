import type { CookieOptions } from "@supabase/ssr";

/** Session cookies are server-only: no page script can read them, and they need HTTPS in production. */
export function hardenCookie(options: CookieOptions = {}): CookieOptions {
  return {
    ...options,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: options.sameSite ?? "lax",
  };
}
