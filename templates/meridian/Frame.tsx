import { ArrowUpRight } from "lucide-react";
import { Hanken_Grotesk } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { SiteSettings } from "@/lib/cms/types";
import { href, socialLinks, telHref } from "@/lib/templates/utils";
import "./styles.css";

const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-meridian", display: "swap" });

type Current = "home" | "blog";

/** Root element, header and footer shared by every Meridian page. */
export function Frame({
  site,
  basePath,
  current,
  children,
}: {
  site: SiteSettings;
  basePath: string;
  current?: Current;
  children: ReactNode;
}) {
  const hasContact = Boolean(site.email || site.phone || site.address);
  const nav = [
    { label: "Home", to: href(basePath, "/"), key: "home" },
    site.about.trim() && { label: "About", to: href(basePath, "/#about"), key: "about" },
    { label: "Blog", to: href(basePath, "/blog"), key: "blog" },
  ].filter((item): item is { label: string; to: string; key: string } => Boolean(item));
  const contactTo = href(basePath, "/#contact");
  const socials = socialLinks(site.socials);
  const hasFooter = Boolean(site.companyName || site.tagline || hasContact || socials.length);
  const brand = (site.logoUrl || site.companyName) && (
    <Link href={href(basePath, "/")} className="m-focus flex min-w-0 items-center gap-3">
      {site.logoUrl && (
        <span className="relative block size-10 shrink-0">
          <Image src={site.logoUrl} alt={site.companyName ? "" : "Home"} fill sizes="40px" className="object-contain" />
        </span>
      )}
      {site.companyName && (
        <span className="min-w-0 text-[17px] leading-tight font-semibold tracking-[-0.01em] text-balance break-words">
          {site.companyName}
        </span>
      )}
    </Link>
  );

  return (
    <div className={`tpl-meridian ${sans.variable} flex min-h-dvh flex-col`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:font-medium focus:outline-2 focus:outline-blue-800">
        Skip to content
      </a>
      <header className="z-40 border-b border-slate-200 bg-white md:sticky md:top-0">
        <div className="m-wrap flex flex-wrap items-center justify-between gap-x-10 gap-y-3 py-4">
          {brand && <div className="min-w-0 flex-1 basis-64 md:max-w-xl">{brand}</div>}
          <nav aria-label="Main" className="w-full sm:ml-auto sm:w-auto">
            <ul className="-ml-3 flex items-center gap-x-1 text-[15px] font-medium sm:ml-0">
              {nav.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.to}
                    aria-current={item.key === current ? "page" : undefined}
                    className="m-focus m-nav-link inline-flex h-10 items-center px-3 text-slate-600 transition-colors hover:text-slate-900 aria-[current=page]:text-slate-900"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              {hasContact && (
                <li className="ml-auto pl-2 sm:ml-0">
                  <Link href={contactTo} className="m-focus m-btn m-btn-primary h-10 px-4 text-[15px]">
                    Contact
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      {hasFooter && (
        <footer className="border-t border-slate-200 bg-white text-[15px] text-slate-600">
          <div className="m-wrap grid gap-x-10 gap-y-10 py-14 *:min-w-0 sm:grid-cols-2 md:grid-cols-12 md:py-16">
            <div className="sm:col-span-2 md:col-span-5">
              {brand && <div className="text-slate-900">{brand}</div>}
              {site.tagline && <p className="mt-4 max-w-sm leading-relaxed break-words">{site.tagline}</p>}
            </div>
            <nav aria-label="Footer" className="md:col-span-2">
              <p className="m-label text-slate-900">Pages</p>
              <ul className="mt-4 space-y-2.5">
                {nav.map((item) => (
                  <li key={item.key}>
                    <Link href={item.to} className="m-focus hover:text-slate-900">
                      {item.label}
                    </Link>
                  </li>
                ))}
                {hasContact && (
                  <li>
                    <Link href={contactTo} className="m-focus hover:text-slate-900">
                      Contact
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
            {hasContact && (
              <div className="md:col-span-3">
                <p className="m-label text-slate-900">Contact</p>
                <address className="mt-4 space-y-2.5 not-italic">
                  {site.address && <p className="leading-relaxed break-words">{site.address}</p>}
                  {site.phone && (
                    <p className="break-words">
                      <a href={telHref(site.phone)} className="m-focus tabular-nums hover:text-slate-900">
                        {site.phone}
                      </a>
                    </p>
                  )}
                  {site.email && (
                    <p className="wrap-anywhere">
                      <a href={`mailto:${site.email}`} className="m-focus hover:text-slate-900">
                        {site.email}
                      </a>
                    </p>
                  )}
                </address>
              </div>
            )}
            {socials.length > 0 && (
              <div className="md:col-span-2">
                <p className="m-label text-slate-900">Follow</p>
                <ul aria-label="Social links" className="mt-4 space-y-2.5">
                  {socials.map((s) => (
                    <li key={s.key}>
                      <a href={s.url} className="m-focus group inline-flex items-center gap-1 hover:text-slate-900">
                        {s.label}
                        <ArrowUpRight aria-hidden size={15} className="text-slate-400 transition-colors group-hover:text-blue-800" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {site.companyName && (
            <div className="border-t border-slate-200">
              <p className="m-wrap py-6 text-sm break-words text-slate-500">&copy; {site.companyName}</p>
            </div>
          )}
        </footer>
      )}
    </div>
  );
}
