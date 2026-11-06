import { cache } from "react";
import { requireAdmin } from "@/lib/auth/require-admin";

/** requireAdmin() once per request, shared by the shell and the page. Call inside <Suspense>. */
export const currentAdmin = cache(requireAdmin);
