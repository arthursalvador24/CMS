import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { BlogIndexData, PostSummary, TemplateProps } from "@/lib/cms/types";
import { href } from "@/lib/templates/utils";
import { Frame } from "./Frame";
import { Meta } from "./Meta";

export function BlogIndex({ data, basePath }: TemplateProps<BlogIndexData>) {
  const { site, posts, page, totalPages } = data;
  const blog = href(basePath, "/blog");
  const pageHref = (n: number) => (n === 1 ? blog : `${blog}?page=${n}`);
  // Page 1 opens with a lead story two columns wide and two rows tall; 1 + 8 fills a 3 x 4 grid.
  const hasLead = page === 1 && posts.length > 1;
  const pagerLink =
    "fo-label inline-flex items-center gap-2 text-(--fo-clay) underline decoration-(--fo-rule) underline-offset-[7px] hover:decoration-(--fo-clay)";

  return (
    <Frame site={site} basePath={basePath} page="blog">
      <div className="fo-wrap pt-12 md:pt-20">
        <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-b border-(--fo-ink) pb-6">
          <div>
            <p className="fo-label text-(--fo-clay)">Blog</p>
            <h1 className="fo-display mt-3 text-[2.75rem] md:text-[4.5rem]">The journal</h1>
          </div>
          {totalPages > 1 && (
            <p className="fo-label mb-2 text-(--fo-ink-soft)">
              Page {page} of {totalPages}
            </p>
          )}
        </header>

        {posts.length === 0 ? (
          <p className="fo-display mx-auto max-w-xl py-24 text-center text-2xl italic text-(--fo-ink-soft)">
            No stories yet.
          </p>
        ) : (
          <ul className="mt-10 grid *:min-w-0 gap-x-10 gap-y-14 md:mt-14 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => {
              const lead = hasLead && i === 0;
              return (
                <li key={post.id} className={lead ? "md:col-span-2 lg:row-span-2" : ""}>
                  <Card post={post} basePath={basePath} lead={lead} />
                </li>
              );
            })}
          </ul>
        )}

        {totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-16 grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-t border-(--fo-rule) pt-6 md:mt-20">
            <div>
              {page > 1 && (
                <Link href={pageHref(page - 1)} rel="prev" className={pagerLink}>
                  <ArrowLeft aria-hidden size={15} />
                  Newer
                  <span className="max-sm:sr-only"> stories</span>
                </Link>
              )}
            </div>
            <p className="text-sm tracking-[0.12em] tabular-nums">
              <span aria-hidden>
                {String(page).padStart(2, "0")} <span className="text-(--fo-ink-soft)">/ {String(totalPages).padStart(2, "0")}</span>
              </span>
              <span className="sr-only">
                Page {page} of {totalPages}
              </span>
            </p>
            <div className="text-right">
              {page < totalPages && (
                <Link href={pageHref(page + 1)} rel="next" className={pagerLink}>
                  Older
                  <span className="max-sm:sr-only"> stories</span>
                  <ArrowRight aria-hidden size={15} />
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </Frame>
  );
}

function Card({ post, basePath, lead }: { post: PostSummary; basePath: string; lead: boolean }) {
  return (
    <article className="group relative">
      <div className="relative aspect-[3/2] overflow-hidden bg-(--fo-paper-deep)">
        {post.coverUrl ? (
          <Image
            src={post.coverUrl}
            alt=""
            fill
            preload={lead}
            sizes={lead ? "(min-width: 1200px) 760px, (min-width: 768px) 90vw, 100vw" : "(min-width: 1200px) 360px, (min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw"}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        ) : (
          // No cover: a quiet typographic plate keeps the grid rhythm.
          <span aria-hidden className="fo-display absolute inset-0 grid place-items-center text-[5rem] text-(--fo-rule) italic">
            {post.title.trim().charAt(0)}
          </span>
        )}
      </div>
      <Meta post={post} className="mt-5" />
      <h2 className={`fo-display mt-2 wrap-break-word ${lead ? "text-[1.875rem] md:text-[2.75rem]" : "text-[1.5rem] md:text-[1.625rem]"}`}>
        <Link
          href={href(basePath, `/blog/${post.slug}`)}
          className="decoration-(--fo-clay) decoration-1 underline-offset-[5px] after:absolute after:inset-0 group-hover:underline"
        >
          {post.title}
        </Link>
      </h2>
      {post.excerpt && (
        <p className={`mt-3 text-(--fo-ink-soft) wrap-break-word ${lead ? "max-w-2xl text-lg leading-relaxed" : "line-clamp-3 leading-relaxed"}`}>{post.excerpt}</p>
      )}
    </article>
  );
}
