import { ArrowRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { SiteData, TemplateProps } from "@/lib/cms/types";
import { href, paragraphs, telHref } from "@/lib/templates/utils";
import { Carousel } from "./Carousel";
import { Frame } from "./Frame";
import { PostCard } from "./PostCard";
import { WRAP, fit } from "./ui";

/** Grid placement for the latest posts: one feature plus two, or an even split when there are fewer. */
const POST_LAYOUT: Record<number, string[]> = {
  1: ["md:col-span-12 min-h-[28rem] md:min-h-[36rem]"],
  2: ["md:col-span-6 min-h-[26rem] md:min-h-[38rem]", "md:col-span-6 min-h-[26rem] md:min-h-[38rem]"],
  3: ["md:col-span-7 md:row-span-2 min-h-[30rem] md:min-h-[44rem]", "md:col-span-5 min-h-[22rem]", "md:col-span-5 min-h-[22rem]"],
};

export function Home({ data, basePath }: TemplateProps<SiteData>) {
  const { site, slides, latestPosts } = data;
  const about = paragraphs(site.about);
  const statements = [
    { title: "Our mission", text: paragraphs(site.mission) },
    { title: "Our vision", text: paragraphs(site.vision) },
  ].filter((s) => s.text.length > 0);
  // About has no image field: borrow a slide photo the admin already chose (the second, so it differs from the hero).
  const aboutImage = slides[1]?.imageUrl ?? slides[0]?.imageUrl ?? null;
  const posts = latestPosts.slice(0, 3);
  const primary = site.email
    ? { label: site.email, to: `mailto:${site.email}` }
    : site.phone
      ? { label: site.phone, to: telHref(site.phone) }
      : null;
  const showPhone = Boolean(site.phone && site.email);

  return (
    <Frame site={site} basePath={basePath}>
      {slides.length > 0 ? (
        <>
          {site.companyName && <h1 className="sr-only">{site.companyName}</h1>}
          <Carousel slides={slides} basePath={basePath} />
        </>
      ) : (
        (site.companyName || site.tagline) && (
          <section className="border-b border-stone-800">
            <div className={`${WRAP} pt-20 pb-16 md:pt-36 md:pb-28`}>
              {site.companyName && (
                <h1
                  className={`onyx-display text-balance wrap-anywhere ${fit(site.companyName, [
                    "text-[clamp(3.5rem,13vw,13rem)]",
                    "text-[clamp(2.75rem,7.5vw,8rem)]",
                    "text-[clamp(2.25rem,5vw,5.5rem)]",
                  ], [18, 40])}`}
                >
                  {site.companyName}
                </h1>
              )}
              {site.tagline && (
                <p className="mt-8 max-w-3xl text-xl text-pretty text-stone-300 wrap-anywhere md:mt-10 md:text-2xl">{site.tagline}</p>
              )}
            </div>
          </section>
        )
      )}

      {about.length > 0 && (
        <section id="about" aria-labelledby="about-title" className="scroll-mt-0 border-b border-stone-800 md:scroll-mt-[4.5rem]">
          <div className={aboutImage ? "md:grid md:grid-cols-2" : ""}>
            {aboutImage && (
              <div className="relative aspect-[4/3] md:aspect-auto">
                <div className="relative h-full md:sticky md:top-[4.5rem] md:h-[calc(100svh_-_4.5rem)] md:max-h-[60rem]">
                  <div className="absolute inset-0">
                    <Image src={aboutImage} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
                  </div>
                </div>
              </div>
            )}
            <div className={aboutImage ? "px-5 py-16 md:px-12 md:py-28 lg:px-20" : `${WRAP} py-20 md:py-28`}>
              <h2 id="about-title" className="onyx-display text-[clamp(3rem,7vw,7rem)]">
                Who we are
              </h2>
              <div className="mt-10 max-w-[38rem] space-y-6 text-lg leading-relaxed text-stone-300 md:mt-14">
                {about.map((p, i) => (
                  <p
                    key={i}
                    className={`whitespace-pre-line text-pretty wrap-anywhere ${
                      i === 0 ? "text-2xl leading-snug font-medium tracking-[-0.01em] text-stone-100 md:text-[1.75rem]" : ""
                    }`}
                  >
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {statements.length > 0 && (
        <section aria-label="Mission and vision" className="border-b border-stone-800">
          <div className={WRAP}>
            {statements.map((s) => (
              <div key={s.title} className="grid gap-6 border-b border-stone-800 py-16 last:border-0 md:grid-cols-12 md:gap-10 md:py-28">
                <h2 className="onyx-label text-stone-400 md:col-span-3 md:pt-4">{s.title}</h2>
                <div className="space-y-6 md:col-span-9">
                  {s.text.map((p, i) => (
                    <p
                      key={i}
                      className={`font-medium tracking-[-0.025em] text-pretty whitespace-pre-line wrap-anywhere ${
                        p.length > 220 ? "text-[clamp(1.5rem,2.5vw,2.5rem)] leading-[1.12]" : "text-[clamp(1.875rem,3.6vw,3.5rem)] leading-[1.06]"
                      }`}
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

      {posts.length > 0 && (
        <section aria-labelledby="latest-title" className={`${WRAP} py-20 md:py-28`}>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <h2 id="latest-title" className="onyx-display text-[clamp(3rem,7vw,7rem)]">
              Latest posts
            </h2>
            <Link href={href(basePath, "/blog")} className="onyx-label inline-flex items-center gap-2 pb-2 decoration-2 underline-offset-[6px] hover:underline">
              All posts
              <ArrowRight aria-hidden size={16} />
            </Link>
          </div>
          <div className="mt-10 grid gap-3 *:min-w-0 md:mt-14 md:grid-cols-12 md:gap-4">
            {posts.map((post, i) => (
              <PostCard
                key={post.id}
                post={post}
                basePath={basePath}
                feature={posts.length === 3 ? i === 0 : posts.length === 1}
                className={POST_LAYOUT[posts.length][i]}
                sizes={posts.length === 1 ? "100vw" : i === 0 ? "(min-width: 768px) 58vw, 100vw" : "(min-width: 768px) 42vw, 100vw"}
              />
            ))}
          </div>
        </section>
      )}

      {(primary || site.address) && (
        <section id="contact" aria-labelledby="contact-title" className="onyx-light scroll-mt-0 bg-stone-100 md:scroll-mt-[4.5rem]">
          <div className={`${WRAP} py-20 md:py-32`}>
            <h2 id="contact-title" className="onyx-display text-[clamp(3.5rem,11vw,11rem)]">
              Get in touch
            </h2>
            {primary && (
            <a
              href={primary.to}
              className="group mt-10 inline-flex max-w-full items-start gap-3 text-[clamp(1.5rem,3.6vw,3.25rem)] leading-tight font-semibold tracking-[-0.02em] underline decoration-2 underline-offset-[0.18em] hover:decoration-[3px] md:mt-14"
            >
              <span className="min-w-0 wrap-anywhere">{primary.label}</span>
              <ArrowUpRight
                aria-hidden
                className="mt-[0.15em] size-[0.9em] shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 motion-reduce:transition-none"
              />
            </a>
            )}
            {(showPhone || site.address) && (
              <address className="mt-14 grid gap-8 border-t border-stone-950/15 pt-8 not-italic *:min-w-0 md:mt-20 md:grid-cols-12">
                {showPhone && (
                  <div className="md:col-span-4">
                    <p className="onyx-label text-stone-600">Phone</p>
                    <p className="mt-2 text-lg wrap-anywhere md:text-xl">
                      <a href={telHref(site.phone)} className="underline decoration-1 underline-offset-4 hover:decoration-2">
                        {site.phone}
                      </a>
                    </p>
                  </div>
                )}
                {site.address && (
                  <div className="md:col-span-8">
                    <p className="onyx-label text-stone-600">Studio</p>
                    <p className="mt-2 max-w-xl text-lg text-pretty wrap-anywhere md:text-xl">{site.address}</p>
                  </div>
                )}
              </address>
            )}
          </div>
        </section>
      )}
    </Frame>
  );
}
