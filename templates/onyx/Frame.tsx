import { ArrowRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { SiteSettings } from "@/lib/cms/types";
import { href, socialLinks, telHref } from "@/lib/templates/utils";
import { archivo } from "./fonts";
import { WRAP, fit } from "./ui";
import "./styles.css";

/** Root element, header and footer shared by every Onyx page. */
export function Frame({ site, basePath, children }: { site: SiteSettings; basePath: string; children: ReactNode }) {
  const hasContact = Boolean(site.email || site.phone || site.address);
  const nav = [
    { label: "Home", to: href(basePath, "/") },
    site.about.trim() && { label: "About", to: href(basePath, "/#about") },
    { label: "Blog", to: href(basePath, "/blog") },
  ].filter((item): item is { label: string; to: string } => Boolean(item));
  const socials = socialLinks(site.socials);
  const hasFooter = Boolean(site.companyName || site.tagline || hasContact || socials.length);

  return (
    <div className={`tpl-onyx ${archivo.variable} flex min-h-dvh flex-col`}>
      <a
        href="#main"
        className="sr-only z-50 bg-stone-100 px-4 py-2 font-semibold text-stone-950 focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <header className="z-40 border-b border-stone-800 bg-stone-950 md:sticky md:top-0">
        <div className={`${WRAP} flex flex-wrap items-center justify-between gap-x-10 gap-y-3 py-4`}>
          {(site.logoUrl || site.companyName) && (
            <Link href={href(basePath, "/")} className="flex min-w-0 items-center gap-3 md:max-w-[32rem]">
              {site.logoUrl && (
                <span className="relative block size-9 shrink-0">
                  <Image src={site.logoUrl} alt={site.companyName ? "" : "Home"} fill sizes="36px" className="object-contain" />
                </span>
              )}
              {site.companyName && <span className="onyx-display min-w-0 text-2xl leading-none wrap-anywhere">{site.companyName}</span>}
            </Link>
          )}
          <nav aria-label="Main" className="ml-auto">
            <ul className="onyx-label flex items-center gap-5 md:gap-8">
              {nav.map((item) => (
                <li key={item.label}>
                  <Link href={item.to} className="decoration-2 underline-offset-[6px] hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
              {hasContact && (
                <li>
                  <Link
                    href={href(basePath, "/#contact")}
                    className="inline-flex items-center gap-2 bg-stone-100 px-4 py-2.5 text-stone-950 transition-colors hover:bg-white"
                  >
                    Contact
                    <ArrowRight aria-hidden size={14} className="hidden sm:block" />
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
        <footer className="border-t border-stone-800 bg-stone-950">
          <div className={`${WRAP} pt-16 md:pt-24`}>
            {site.companyName && (
              <p
                aria-hidden
                className={`onyx-display text-balance wrap-anywhere ${fit(site.companyName, [
                  "text-[clamp(3.5rem,16vw,14.25rem)]",
                  "text-[clamp(2.5rem,7vw,7.5rem)]",
                  "text-[clamp(2rem,4.2vw,4.5rem)]",
                ], [18, 40])}`}
              >
                {site.companyName}
              </p>
            )}
            <div className="mt-12 grid gap-10 border-t border-stone-800 pt-10 *:min-w-0 sm:grid-cols-2 md:mt-16 lg:grid-cols-4">
              {(site.companyName || site.tagline) && (
                <div>
                  {site.companyName && <p className="font-semibold wrap-anywhere">{site.companyName}</p>}
                  {site.tagline && <p className="mt-2 text-pretty text-stone-400 wrap-anywhere">{site.tagline}</p>}
                </div>
              )}
              {site.address && (
                <div>
                  <p className="onyx-label text-stone-400">Studio</p>
                  <p className="mt-3 text-pretty text-stone-200 wrap-anywhere">{site.address}</p>
                </div>
              )}
              {(site.phone || site.email) && (
                <div>
                  <p className="onyx-label text-stone-400">Contact</p>
                  <ul className="mt-3 space-y-1 text-stone-200">
                    {site.phone && (
                      <li className="wrap-anywhere">
                        <a href={telHref(site.phone)} className="underline-offset-4 hover:underline">
                          {site.phone}
                        </a>
                      </li>
                    )}
                    {site.email && (
                      <li className="wrap-anywhere">
                        <a href={`mailto:${site.email}`} className="underline-offset-4 hover:underline">
                          {site.email}
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              )}
              {socials.length > 0 && (
                <div>
                  <p className="onyx-label text-stone-400">Follow</p>
                  <ul aria-label="Social links" className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-stone-200">
                    {socials.map((s) => (
                      <li key={s.key}>
                        <a href={s.url} className="inline-flex items-center gap-1 underline-offset-4 hover:underline">
                          {s.label}
                          <ArrowUpRight aria-hidden size={14} />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <p className="mt-14 min-h-px border-t border-stone-800 py-8 text-sm text-stone-400 wrap-anywhere">
              {site.companyName && <>&copy; {site.companyName}</>}
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
