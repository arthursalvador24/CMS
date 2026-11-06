"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";
import { Building2, FileText, GalleryHorizontal, LayoutDashboard, LayoutTemplate, Menu, Newspaper, X } from "lucide-react";
import { focusRing, iconButton } from "./ui";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/company", label: "Company", icon: Building2 },
  { href: "/admin/about", label: "About & Mission", icon: FileText },
  { href: "/admin/carousel", label: "Carousel", icon: GalleryHorizontal },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/template", label: "Template", icon: LayoutTemplate },
] as const;

const isCurrent = (href: string, pathname: string | null) =>
  pathname !== null && (href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

/** The section links. `pathname` null renders them with no current item (static shell fallback). */
export function NavLinks({ pathname }: { pathname: string | null }) {
  return (
    <ul className="space-y-0.5">
      {NAV.map(({ href, label, icon: Icon }) => {
        const current = isCurrent(href, pathname);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={current ? "page" : undefined}
              className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${focusRing} ${
                current
                  ? "bg-stone-100 font-medium text-stone-900"
                  : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
              }`}
            >
              <Icon aria-hidden="true" className={`size-[18px] ${current ? "text-stone-900" : "text-stone-400"}`} />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function CurrentNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}

/** Phone and tablet: a top bar with a menu button that opens the sidebar as a modal sheet. */
export function MobileNav({ title, end, children }: { title: ReactNode; end?: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();
  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center gap-1 border-b border-stone-200 bg-white/95 px-2 backdrop-blur-sm lg:hidden">
        <button
          type="button"
          className={iconButton}
          aria-label="Open menu"
          aria-haspopup="dialog"
          onClick={() => ref.current?.showModal()}
        >
          <Menu aria-hidden="true" className="size-5" />
        </button>
        <div className="min-w-0 flex-1">{title}</div>
        {end}
      </div>
      <dialog
        ref={ref}
        aria-label="Menu"
        onClick={(e) => {
          // Backdrop click, or any link inside (the page is about to change).
          if (e.target === e.currentTarget || (e.target as Element).closest("a")) close();
        }}
        className="m-0 h-dvh max-h-none w-72 max-w-[85vw] border-r border-stone-200 bg-white p-0 text-stone-900 shadow-xl backdrop:bg-stone-950/40 open:animate-[admin-slide-in_200ms_ease-out] motion-reduce:open:animate-none lg:hidden"
      >
        <div className="flex h-full flex-col">
          <div className="flex justify-end px-2 pt-2">
            <button type="button" className={iconButton} aria-label="Close menu" onClick={close}>
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          {children}
        </div>
      </dialog>
    </>
  );
}
