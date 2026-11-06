import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { SiteSettings } from "@/lib/cms/types";
import { href, socialLinks, telHref } from "@/lib/templates/utils";
import { folioFont } from "./fonts";
import "./styles.css";

type Page = "home" | "blog";

/** Root element, masthead and colophon footer shared by every Folio page. */
export function Frame({
  site,
  basePath,
  page,
  children,
}: {
  site: SiteSettings;
  basePath: string;
  page: Page;
  children: ReactNode;
}) {
  const hasContact = Boolean(site.email || site.phone || site.address);
  const nav = [
    { label: "Home", to: href(basePath, "/"), current: page === "home" },
    site.about.trim() && { label: "About", to: href(basePath, "/#about"), current: false },
    { label: "Blog", to: href(basePath, "/blog"), current: page === "blog" },
    hasContact && { label: "Contact", to: href(basePath, "/#contact"), current: false },
  ].filter((item): item is { label: string; to: string; current: boolean } => Boolean(item));
  const socials = socialLinks(site.socials);
  const hasFooter = Boolean(site.companyName || site.tagline || hasContact || socials.length);
  // On the home page the masthead name is the page's h1; elsewhere the page title is.
  const NameTag = page === "home" ? "h1" : "p";

  return (
    <div className={`tpl-folio ${folioFont.variable} flex min-h-dvh flex-col`}>
      <a
        href="#main"
        className="fo-label sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-(--fo-mat) focus:px-4 focus:py-3"
      >
        Skip to content
      </a>

      <header className="fo-wrap">
        {(site.logoUrl || site.companyName) && (
          <div className="flex justify-center pt-7 pb-5 md:pt-10 md:pb-7">
            <Link
              href={href(basePath, "/")}
              className="flex min-w-0 max-w-4xl flex-col items-center gap-3 text-center sm:flex-row sm:gap-4"
            >
              {site.logoUrl && (
                <span className="relative block size-11 shrink-0 md:size-12">
                  <Image src={site.logoUrl} alt={site.companyName ? "" : "Home"} fill sizes="48px" className="object-contain" />
                </span>
              )}
              {site.companyName && (
                <NameTag className="fo-display min-w-0 text-[1.625rem] wrap-anywhere md:text-[2.125rem]">{site.companyName}</NameTag>
              )}
            </Link>
          </div>
        )}
        <nav aria-label="Main" className={`border-y border-(--fo-rule) ${site.logoUrl || site.companyName ? "" : "mt-8"}`}>
          <ul className="flex flex-wrap justify-center gap-x-7 gap-y-1 py-2.5 md:gap-x-12">
            {nav.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.to}
                  aria-current={item.current ? "page" : undefined}
                  className="fo-label inline-block py-1.5 underline-offset-[6px] decoration-(--fo-clay) hover:text-(--fo-clay) hover:underline aria-[current=page]:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      {hasFooter && (
        <footer className="mt-20 border-t border-(--fo-rule) bg-(--fo-paper-deep) md:mt-28">
          <div className="fo-wrap flex flex-col items-center py-14 text-center md:py-16">
            {site.companyName && <p className="fo-display max-w-3xl text-2xl italic wrap-anywhere">{site.companyName}</p>}
            {site.tagline && <p className="mt-2 max-w-xl text-(--fo-ink-soft) italic text-balance">{site.tagline}</p>}

            {hasContact && (
              <ul className="mt-8 flex max-w-3xl flex-col items-center gap-y-1.5 text-[0.9375rem] md:flex-row md:flex-wrap md:justify-center md:gap-x-0">
                {[
                  site.address && <span>{site.address}</span>,
                  site.phone && (
                    <a href={telHref(site.phone)} className="hover:text-(--fo-clay) hover:underline">
                      {site.phone}
                    </a>
                  ),
                  site.email && (
                    <a href={`mailto:${site.email}`} className="hover:text-(--fo-clay) hover:underline">
                      {site.email}
                    </a>
                  ),
                ]
                  .filter(Boolean)
                  .map((item, i) => (
                    <li key={i} className="wrap-anywhere md:before:mx-3 md:before:text-(--fo-rule) md:before:content-['/'] md:first:before:hidden">
                      {item}
                    </li>
                  ))}
              </ul>
            )}

            {socials.length > 0 && (
              <ul aria-label="Social links" className="mt-7 flex flex-wrap justify-center gap-x-7 gap-y-2">
                {socials.map((s) => (
                  <li key={s.key}>
                    <a href={s.url} className="fo-label inline-block py-1 underline decoration-(--fo-rule) underline-offset-[6px] hover:text-(--fo-clay) hover:decoration-(--fo-clay)">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {site.companyName && (
              <p className="mt-10 w-full border-t border-(--fo-rule) pt-6 text-sm text-(--fo-ink-soft) wrap-anywhere">
                &copy; {site.companyName}
              </p>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
