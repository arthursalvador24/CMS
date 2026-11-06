import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { ExternalLink, LogOut } from "lucide-react";
import { CurrentNavLinks, MobileNav, NavLinks } from "@/components/admin/AdminNav";
import { Brand, BrandText } from "@/components/admin/Brand";
import { currentAdmin } from "@/components/admin/session";
import { focusRing, iconButton } from "@/components/admin/ui";
import { signOut } from "@/lib/auth/actions";
import "@/components/admin/admin.css";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default function PanelLayout({ children }: { children: ReactNode }) {
  const sidebar = (
    <>
      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4">
        <Suspense fallback={<NavLinks pathname={null} />}>
          <CurrentNavLinks />
        </Suspense>
      </nav>
      <div className="space-y-1 border-t border-stone-200 p-3">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900 ${focusRing}`}
        >
          <ExternalLink aria-hidden="true" className="size-[18px] text-stone-400" />
          View live site
          <span className="sr-only">(opens in a new tab)</span>
        </a>
        <Suspense fallback={<div className="h-[60px]" />}>
          <Account />
        </Suspense>
      </div>
    </>
  );

  return (
    <div className="admin-root min-h-dvh bg-stone-50 font-[family-name:var(--font-ed-inter)] text-stone-900">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-stone-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-stone-200 px-4">
          <Suspense fallback={<BrandText name="Website admin" />}>
            <Brand />
          </Suspense>
        </div>
        {sidebar}
      </aside>

      <MobileNav
        title={
          <Suspense fallback={<BrandText name="Website admin" />}>
            <Brand />
          </Suspense>
        }
        end={
          <a href="/" target="_blank" rel="noreferrer" className={iconButton} aria-label="View live site (opens in a new tab)">
            <ExternalLink aria-hidden="true" className="size-5" />
          </a>
        }
      >
        {sidebar}
      </MobileNav>

      <main id="main" tabIndex={-1} className="outline-none lg:pl-64">
        <div className="mx-auto w-full max-w-5xl px-4 pt-6 pb-10 sm:px-8 sm:pt-10">{children}</div>
      </main>
    </div>
  );
}

async function Account() {
  const admin = await currentAdmin();
  return (
    <>
      <form action={signOut} data-leaves-page>
        <button
          type="submit"
          className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900 ${focusRing}`}
        >
          <LogOut aria-hidden="true" className="size-[18px] text-stone-400" />
          Sign out
        </button>
      </form>
      <p className="truncate px-3 pt-1 text-xs text-stone-500" title={admin.email ?? undefined}>
        Signed in as {admin.email ?? "admin"}
      </p>
    </>
  );
}
