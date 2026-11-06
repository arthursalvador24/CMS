import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/**
 * First gate for /admin and /preview: refreshes the Supabase session cookie and sends anyone
 * who is not in `admins` to /admin/login?next=<path>. Pages still call requireAdmin() and
 * actions still call assertAdmin(); this only keeps non-admins away early.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  let isAdmin = false;
  if (userId) {
    const { data: row } = await supabase.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
    isAdmin = Boolean(row);
  }

  // Only page loads are redirected. Server action POSTs pass through: they re-check with
  // assertAdmin() and return a clear error instead of following a redirect they cannot use.
  if (request.method !== "GET" && request.method !== "HEAD") return response;

  const { pathname, search } = request.nextUrl;
  if (pathname === "/admin/login") return isAdmin ? redirectTo(request, "/admin", response) : response;
  if (isAdmin) return response;
  return redirectTo(request, `/admin/login?next=${encodeURIComponent(pathname + search)}`, response);
}

/** Redirect that keeps any refreshed session cookies. */
function redirectTo(request: NextRequest, path: string, from: NextResponse) {
  const redirect = NextResponse.redirect(new URL(path, request.url));
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

// Narrow on purpose: public pages never run the proxy, so they stay static and fast.
export const config = {
  matcher: ["/admin/:path*", "/preview/:path*"],
};
