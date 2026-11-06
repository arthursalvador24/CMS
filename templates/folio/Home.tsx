import { ArrowRight, Mail, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { PostSummary, SiteData, TemplateProps } from "@/lib/cms/types";
import { href, paragraphs, telHref } from "@/lib/templates/utils";
import { Carousel } from "./Carousel";
import { Frame } from "./Frame";
import { Meta } from "./Meta";

/** Split the About text into its opening sentence (the lede) and the rest of the story. */
function splitStory(about: string[]): { lede: string; body: string[] } {
  if (about.length === 0) return { lede: "", body: [] };
  const match = /^([\s\S]+?[.!?]["”’)]*)(?:\s+([\s\S]+))?$/.exec(about[0]);
  const lede = match ? match[1] : about[0];
  const rest = match?.[2]?.trim();
  return { lede, body: rest ? [rest, ...about.slice(1)] : about.slice(1) };
}

/** Words wrapped for the scroll-driven "ink in" (see .fo-ink in styles.css). */
function inked(text: string): ReactNode[] {
  return text.split(/(\s+)/).map((part, i) => (part.trim() ? <span key={i} className="fo-ink">{part}</span> : part));
}

/** Section label: small caps with a hairline running to the edge. */
function Label({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2 id={id} className="fo-label flex items-center gap-5 text-(--fo-clay)">
      <span className="shrink-0">{children}</span>
      <span aria-hidden className="h-px flex-1 bg-(--fo-rule)" />
    </h2>
  );
}

const sizeBy = (text: string, short: string, mid: string, long: string, limits = [140, 240]) =>
  text.length <= limits[0] ? short : text.length <= limits[1] ? mid : long;

export function Home({ data, basePath }: TemplateProps<SiteData>) {
  const { site, slides, latestPosts } = data;
  const { lede, body } = splitStory(paragraphs(site.about));
  const mission = paragraphs(site.mission);
  const vision = paragraphs(site.vision);
  const hasContact = Boolean(site.email || site.phone || site.address);
  const [lead, ...more] = latestPosts;

  return (
    <Frame site={site} basePath={basePath} page="home">
      {!site.companyName && <h1 className="sr-only">Home</h1>}

      {slides.length > 0 ? (
        <div className="fo-wrap pt-10 md:pt-14">
          {site.tagline && (
            <p
              className={`fo-display mx-auto mb-10 max-w-3xl text-center italic text-(--fo-ink-soft) md:mb-14 ${sizeBy(site.tagline, "text-[1.5rem] md:text-[2rem]", "text-[1.25rem] md:text-[1.5rem]", "text-[1.125rem] md:text-[1.375rem]", [90, 160])}`}
            >
              {site.tagline}
            </p>
          )}
          <Carousel slides={slides} basePath={basePath} />
        </div>
      ) : (
        site.tagline && (
          <section aria-label="Introduction" className="fo-wrap py-20 text-center md:py-32">
            <p
              className={`fo-display mx-auto max-w-4xl italic ${sizeBy(site.tagline, "text-[2.25rem] md:text-[4rem]", "text-[1.875rem] md:text-[3rem]", "text-[1.5rem] md:text-[2.25rem]", [90, 160])}`}
            >
              {site.tagline}
            </p>
            <div aria-hidden className="mx-auto mt-10 flex w-40 items-center gap-3 text-(--fo-clay)">
              <span className="h-px flex-1 bg-(--fo-rule)" />
              <span className="size-1.5 rotate-45 bg-current" />
              <span className="h-px flex-1 bg-(--fo-rule)" />
            </div>
          </section>
        )
      )}

      {lede && (
        <section id="about" aria-labelledby="about-title" className="fo-wrap scroll-mt-6 pt-20 md:pt-32">
          <Label id="about-title">Our story</Label>
          <p
            className={`fo-display relative mt-10 max-w-5xl md:mt-14 ${sizeBy(lede, "text-[1.875rem] md:text-[3.25rem]", "text-[1.625rem] md:text-[2.5rem]", "text-[1.375rem] md:text-[2rem]")}`}
          >
            <span aria-hidden className="mb-2 block h-[0.55em] text-[2.4em] leading-none text-(--fo-clay) md:absolute md:-left-[0.62em] md:top-0 md:mb-0 md:h-auto md:text-[1.6em] md:leading-[0.8]">
              &ldquo;
            </span>
            {inked(lede)}
          </p>
          {body.length > 0 && (
            <div className="mt-12 grid md:mt-16 lg:grid-cols-12">
              <div className="space-y-5 text-lg leading-[1.75] lg:col-span-7 lg:col-start-5">
                {body.map((p, i) => (
                  <p key={i} className={`whitespace-pre-line wrap-break-word ${i === 0 ? "fo-dropcap" : ""}`}>
                    {p}
                  </p>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {(mission.length > 0 || vision.length > 0) && (
        <section aria-label="Mission and vision" className="mt-20 border-y border-(--fo-rule) bg-(--fo-paper-deep) md:mt-32">
          <div className={`fo-wrap grid *:min-w-0 ${mission.length && vision.length ? "fo-spread md:grid-cols-2" : "max-w-4xl!"}`}>
            {[
              { title: "Our mission", text: mission },
              { title: "Our vision", text: vision },
            ]
              .filter((page) => page.text.length > 0)
              .map((page, i) => (
                <div
                  key={page.title}
                  className={`py-14 md:py-24 ${i === 0 ? "md:pr-14 lg:pr-20" : "border-t border-(--fo-rule) md:border-t-0 md:pl-14 lg:pl-20"}`}
                >
                  <h2 className="fo-label flex items-center gap-3 text-(--fo-clay)">
                    <span aria-hidden className="h-px w-8 bg-current" />
                    {page.title}
                  </h2>
                  <div className="mt-7 space-y-4">
                    {page.text.map((p, j) => (
                      <p
                        key={j}
                        className={`fo-display whitespace-pre-line wrap-break-word ${sizeBy(page.text.join(" "), "text-[1.625rem] md:text-[2.125rem]", "text-[1.375rem] md:text-[1.625rem]", "text-[1.25rem] md:text-[1.375rem]", [160, 280])}`}
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {lead && (
        <section aria-labelledby="journal-title" className="fo-wrap pt-20 md:pt-32">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-b border-(--fo-ink) pb-5">
            <h2 id="journal-title" className="fo-display text-[2.25rem] md:text-[3.25rem]">
              From the journal
            </h2>
            <Link
              href={href(basePath, "/blog")}
              className="fo-label mb-1.5 inline-flex items-center gap-2 text-(--fo-clay) underline decoration-(--fo-rule) underline-offset-[7px] hover:decoration-(--fo-clay)"
            >
              All stories
              <ArrowRight aria-hidden size={15} />
            </Link>
          </div>
          <div className="mt-10 grid *:min-w-0 gap-x-14 gap-y-12 md:mt-12 lg:grid-cols-12">
            <LeadStory post={lead} basePath={basePath} solo={more.length === 0} />
            {more.length > 0 && (
              <ul className="divide-y divide-(--fo-rule) border-t border-(--fo-rule) lg:col-span-5 lg:border-t-0 *:py-7 lg:*:first:pt-0">
                {more.map((post) => (
                  <li key={post.id}>
                    <SideStory post={post} basePath={basePath} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {hasContact && (
        <section id="contact" aria-labelledby="contact-title" className="fo-wrap scroll-mt-6 pt-20 md:pt-32">
          <div className={`fo-mat grid *:min-w-0 ${site.email || site.phone ? "md:grid-cols-[minmax(0,1.15fr)_1px_minmax(0,1fr)]" : ""}`}>
            <div className="p-7 sm:p-10 lg:p-14">
              <p className="fo-label text-(--fo-clay)">Contact</p>
              <h2 id="contact-title" className="fo-display mt-4 text-[2.25rem] md:text-[3rem]">
                {site.address && (site.email || site.phone) ? "Visit or write to us" : site.address ? "Come and visit" : "Write to us"}
              </h2>
              {site.address && (
                <address className="mt-6 max-w-md text-xl leading-relaxed not-italic wrap-break-word text-(--fo-ink-soft)">{site.address}</address>
              )}
            </div>
            {(site.email || site.phone) && <span aria-hidden className="mx-7 h-px bg-(--fo-rule) sm:mx-10 md:mx-0 md:my-10 md:h-auto md:w-px" />}
            {(site.email || site.phone) && (
              <div className="flex flex-col justify-center gap-6 p-7 sm:p-10 lg:p-14">
                {site.email && (
                  <div>
                    <a
                      href={`mailto:${site.email}`}
                      className="inline-flex min-h-12 items-center gap-3 rounded-full bg-(--fo-clay) px-7 text-[1.0625rem] font-medium text-[#fffaf3] transition-colors hover:bg-(--fo-clay-deep)"
                    >
                      <Mail aria-hidden size={18} />
                      Email the studio
                    </a>
                    <p className="mt-3 text-(--fo-ink-soft) wrap-anywhere">{site.email}</p>
                  </div>
                )}
                {site.phone && (
                  <a href={telHref(site.phone)} className="group inline-flex items-start gap-3 self-start text-lg">
                    <Phone aria-hidden size={18} className="mt-1 shrink-0 text-(--fo-clay)" />
                    <span className="wrap-anywhere underline decoration-(--fo-rule) underline-offset-[6px] group-hover:decoration-(--fo-clay)">
                      {site.phone}
                    </span>
                  </a>
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </Frame>
  );
}

function LeadStory({ post, basePath, solo }: { post: PostSummary; basePath: string; solo: boolean }) {
  return (
    <article className={`group relative grid *:min-w-0 gap-x-14 gap-y-7 ${solo ? "lg:col-span-12 lg:grid-cols-12 lg:items-center" : "lg:col-span-7"}`}>
      {post.coverUrl && (
        <div className={`relative aspect-[3/2] overflow-hidden bg-(--fo-paper-deep) ${solo ? "lg:col-span-7" : ""}`}>
          <Image
            src={post.coverUrl}
            alt=""
            fill
            sizes="(min-width: 1200px) 640px, (min-width: 1024px) 55vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        </div>
      )}
      <div className={solo && post.coverUrl ? "lg:col-span-5" : solo ? "lg:col-span-8" : ""}>
        <p className="fo-label text-(--fo-clay)">Latest story</p>
        <h3 className="fo-display mt-3 text-[1.875rem] wrap-break-word md:text-[2.5rem]">
          <Link
            href={href(basePath, `/blog/${post.slug}`)}
            className="decoration-(--fo-clay) decoration-1 underline-offset-[6px] after:absolute after:inset-0 group-hover:underline"
          >
            {post.title}
          </Link>
        </h3>
        {post.excerpt && <p className="mt-4 text-lg leading-relaxed text-(--fo-ink-soft) wrap-break-word">{post.excerpt}</p>}
        <div className="mt-5">
          <Meta post={post} />
        </div>
      </div>
    </article>
  );
}

function SideStory({ post, basePath }: { post: PostSummary; basePath: string }) {
  return (
    <article className={`group relative grid *:min-w-0 items-start gap-5 ${post.coverUrl ? "grid-cols-[7rem_1fr] sm:grid-cols-[10rem_1fr]" : ""}`}>
      {post.coverUrl && (
        <div className="relative aspect-[4/5] overflow-hidden bg-(--fo-paper-deep)">
          <Image
            src={post.coverUrl}
            alt=""
            fill
            sizes="160px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
          />
        </div>
      )}
      <div>
        <h3 className="fo-display text-[1.375rem] wrap-break-word md:text-[1.625rem]">
          <Link
            href={href(basePath, `/blog/${post.slug}`)}
            className="decoration-(--fo-clay) decoration-1 underline-offset-[5px] after:absolute after:inset-0 group-hover:underline"
          >
            {post.title}
          </Link>
        </h3>
        {post.excerpt && <p className="mt-2 line-clamp-3 text-(--fo-ink-soft) wrap-break-word">{post.excerpt}</p>}
        <div className="mt-3">
          <Meta post={post} />
        </div>
      </div>
    </article>
  );
}
