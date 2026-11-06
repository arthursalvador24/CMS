import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { BlogIndexData, TemplateProps } from "@/lib/cms/types";
import { href } from "@/lib/templates/utils";
import { Frame } from "./Frame";
import { PostCard } from "./PostCard";
import { WRAP } from "./ui";

const PAGE_LINK =
  "onyx-label inline-flex items-center gap-2 border border-stone-100/35 px-4 py-3 transition-colors hover:border-stone-100 hover:bg-stone-100 hover:text-stone-950 sm:px-5";

/** Card placement: a feature plus two stacked beside it, then rows of three (two columns on tablets). */
function placement(i: number, count: number, hasCover: boolean): string {
  const span =
    count < 3
      ? count === 1
        ? "sm:col-span-2 lg:col-span-12 lg:min-h-[36rem]"
        : "lg:col-span-6 lg:min-h-[36rem]"
      : i === 0
        ? "sm:col-span-2 lg:col-span-8 lg:row-span-2 lg:min-h-[46rem]"
        : "lg:col-span-4 lg:min-h-[22.5rem]";
  // Without a cover a tall card is an empty panel, so phones get a short one.
  return `${span} ${hasCover ? (i === 0 ? "min-h-[30rem]" : "min-h-[24rem]") : "min-h-[15rem]"}`;
}

export function BlogIndex({ data, basePath }: TemplateProps<BlogIndexData>) {
  const { site, posts, page, totalPages } = data;
  const blog = href(basePath, "/blog");
  const pageHref = (n: number) => (n === 1 ? blog : `${blog}?page=${n}`);

  return (
    <Frame site={site} basePath={basePath}>
      <div className={`${WRAP} pt-16 pb-20 md:pt-24 md:pb-28`}>
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
          <h1 className="onyx-display text-[clamp(5rem,17vw,16rem)]">Blog</h1>
          {totalPages > 1 && (
            <p className="onyx-label pb-2 text-stone-400 tabular-nums md:pb-5">
              Page {page} of {totalPages}
            </p>
          )}
        </div>

        {posts.length === 0 ? (
          <p className="mt-12 border-t border-stone-800 pt-10 text-xl text-stone-300 md:text-2xl">No posts yet.</p>
        ) : (
          <ul className="mt-10 grid gap-3 *:min-w-0 sm:grid-cols-2 md:mt-14 md:gap-4 lg:grid-cols-12">
            {posts.map((post, i) => {
              const feature = posts.length >= 3 ? i === 0 : posts.length === 1;
              return (
                <li key={post.id} className={`flex ${placement(i, posts.length, Boolean(post.coverUrl))}`}>
                  <PostCard
                    post={post}
                    basePath={basePath}
                    feature={feature}
                    excerpt
                    heading="h2"
                    className="w-full"
                    sizes={feature ? "(min-width: 1024px) 66vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
                  />
                </li>
              );
            })}
          </ul>
        )}

        {totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-14 flex items-center justify-between gap-4 border-t border-stone-800 pt-8 md:mt-20">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} rel="prev" className={PAGE_LINK}>
                <ArrowLeft aria-hidden size={16} />
                <span>Newer<span className="sr-only sm:not-sr-only"> posts</span></span>
              </Link>
            ) : (
              <span />
            )}
            <span aria-current="page" className="onyx-label text-stone-400 tabular-nums">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link href={pageHref(page + 1)} rel="next" className={PAGE_LINK}>
                <span>Older<span className="sr-only sm:not-sr-only"> posts</span></span>
                <ArrowRight aria-hidden size={16} />
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>
    </Frame>
  );
}
