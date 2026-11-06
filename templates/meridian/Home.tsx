import { ArrowRight, Mail, Phone } from "lucide-react";
import Link from "next/link";
import type { SiteData, TemplateProps } from "@/lib/cms/types";
import { href, paragraphs, telHref } from "@/lib/templates/utils";
import { Carousel } from "./Carousel";
import { Frame } from "./Frame";
import { PostCard } from "./PostCard";

const sectionTitle = "text-[clamp(1.875rem,1.4rem+1.4vw,2.75rem)] leading-[1.1] font-semibold tracking-[-0.025em]";

export function Home({ data, basePath }: TemplateProps<SiteData>) {
  const { site, slides, latestPosts } = data;
  const about = paragraphs(site.about);
  const mission = paragraphs(site.mission);
  const vision = paragraphs(site.vision);
  const hasContact = Boolean(site.email || site.phone || site.address);
  const statements = [
    mission.length > 0 && { title: "Our mission", text: mission },
    vision.length > 0 && { title: "Our vision", text: vision },
  ].filter((s): s is { title: string; text: string[] } => Boolean(s));

  return (
    <Frame site={site} basePath={basePath} current="home">
      {slides.length > 0 ? (
        <>
          {site.companyName && <h1 className="sr-only">{site.companyName}</h1>}
          <Carousel slides={slides} basePath={basePath} />
        </>
      ) : (
        (site.companyName || site.tagline) && (
          <section className="border-b border-slate-200 bg-slate-50">
            <div className="m-wrap grid gap-10 py-20 *:min-w-0 md:grid-cols-12 md:items-end md:py-32">
              <div className="md:col-span-9">
                {site.companyName && (
                  <h1 className="text-[clamp(2.5rem,1.6rem+3.6vw,5rem)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance break-words">
                    {site.companyName}
                  </h1>
                )}
                {site.tagline && (
                  <p className={`${site.companyName ? "mt-6" : ""} max-w-2xl text-xl leading-relaxed text-pretty break-words text-slate-600 md:text-2xl`}>
                    {site.tagline}
                  </p>
                )}
              </div>
              {hasContact && (
                <div className="md:col-span-3 md:justify-self-end">
                  <Link href={href(basePath, "/#contact")} className="m-focus m-btn m-btn-primary min-h-12 px-5 py-3">
                    Contact us
                    <ArrowRight aria-hidden size={18} />
                  </Link>
                </div>
              )}
            </div>
          </section>
        )
      )}

      {about.length > 0 && (
        <section id="about" aria-labelledby="about-title" className="m-wrap scroll-mt-4 py-20 md:scroll-mt-24 md:py-28">
          <div className="grid gap-x-10 gap-y-8 *:min-w-0 md:grid-cols-12">
            <h2 id="about-title" className={`${sectionTitle} md:col-span-4`}>
              About us
            </h2>
            <div className="md:col-span-8 lg:col-span-7">
              <p className="text-[clamp(1.25rem,1.1rem+0.6vw,1.625rem)] leading-snug font-medium tracking-[-0.01em] text-pretty whitespace-pre-line break-words">
                {about[0]}
              </p>
              {about.length > 1 && (
                <div className="mt-8 space-y-5 border-t border-slate-200 pt-8 text-[17px] leading-relaxed text-slate-600">
                  {about.slice(1).map((p, i) => (
                    <p key={i} className="text-pretty whitespace-pre-line break-words">
                      {p}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {statements.length > 0 && (
        <section aria-label="Mission and vision" className="border-y border-slate-200 bg-slate-50">
          <div className={`m-wrap grid *:min-w-0 ${statements.length > 1 ? "md:grid-cols-2" : ""}`}>
            {statements.map((s, i) => (
              <div
                key={s.title}
                className={`py-14 md:py-24 ${i > 0 ? "border-t border-slate-200 md:border-t-0 md:border-l md:pl-12 lg:pl-16" : statements.length > 1 ? "md:pr-12 lg:pr-16" : "max-w-4xl"}`}
              >
                <h2 className="m-label flex items-center gap-3 text-blue-800">
                  <span aria-hidden className="h-0.5 w-8 bg-blue-800" />
                  {s.title}
                </h2>
                <div className="mt-6 space-y-4 text-[clamp(1.375rem,1.2rem+0.7vw,1.875rem)] leading-[1.3] font-medium tracking-[-0.015em]">
                  {s.text.map((p, j) => (
                    <p key={j} className="text-pretty whitespace-pre-line break-words">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {latestPosts.length > 0 && (
        <section aria-labelledby="latest-title" className="m-wrap py-20 md:py-28">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-slate-200 pb-6">
            <h2 id="latest-title" className={sectionTitle}>
              Latest posts
            </h2>
            <Link href={href(basePath, "/blog")} className="m-focus group inline-flex items-center gap-2 font-semibold text-blue-800 hover:text-blue-900">
              View all posts
              <ArrowRight aria-hidden size={18} className="transition-transform motion-safe:group-hover:translate-x-0.5" />
            </Link>
          </div>
          <ul className="mt-10 grid gap-x-8 gap-y-14 *:min-w-0 md:grid-cols-3">
            {latestPosts.map((post) => (
              <li key={post.id}>
                <PostCard post={post} basePath={basePath} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasContact && (
        <section id="contact" aria-labelledby="contact-title" className="m-on-accent scroll-mt-4 bg-blue-800 text-white md:scroll-mt-24">
          <div className="m-wrap grid gap-x-10 gap-y-12 py-20 *:min-w-0 md:grid-cols-12 md:py-28">
            <div className="md:col-span-5">
              <h2 id="contact-title" className="text-[clamp(2.25rem,1.6rem+2.4vw,3.75rem)] leading-[1.02] font-semibold tracking-[-0.035em]">
                Get in touch
              </h2>
              {(site.email || site.phone) && (
                <div className="mt-10 flex flex-wrap gap-3">
                  {site.email && (
                    <a href={`mailto:${site.email}`} className="m-focus m-btn m-btn-light min-h-12 px-5 py-3">
                      <Mail aria-hidden size={18} />
                      Email us
                    </a>
                  )}
                  {site.phone && (
                    <a href={telHref(site.phone)} className="m-focus m-btn m-btn-ghost min-h-12 px-5 py-3">
                      <Phone aria-hidden size={18} />
                      Call us
                    </a>
                  )}
                </div>
              )}
            </div>
            <address className="not-italic md:col-span-7">
              <dl className="divide-y divide-white/20 border-y border-white/20">
                {site.email && (
                  <div className="grid gap-1 py-6 sm:grid-cols-[7rem_1fr] sm:gap-6">
                    <dt className="m-label pt-1 text-blue-200">Email</dt>
                    <dd className="text-lg wrap-anywhere md:text-xl">
                      <a href={`mailto:${site.email}`} className="m-focus underline decoration-white/40 underline-offset-4 hover:decoration-white">
                        {site.email}
                      </a>
                    </dd>
                  </div>
                )}
                {site.phone && (
                  <div className="grid gap-1 py-6 sm:grid-cols-[7rem_1fr] sm:gap-6">
                    <dt className="m-label pt-1 text-blue-200">Phone</dt>
                    <dd className="text-lg break-words tabular-nums md:text-xl">
                      <a href={telHref(site.phone)} className="m-focus underline decoration-white/40 underline-offset-4 hover:decoration-white">
                        {site.phone}
                      </a>
                    </dd>
                  </div>
                )}
                {site.address && (
                  <div className="grid gap-1 py-6 sm:grid-cols-[7rem_1fr] sm:gap-6">
                    <dt className="m-label pt-1 text-blue-200">Address</dt>
                    <dd className="text-lg leading-relaxed break-words md:text-xl">{site.address}</dd>
                  </div>
                )}
              </dl>
            </address>
          </div>
        </section>
      )}
    </Frame>
  );
}
