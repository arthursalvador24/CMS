import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { BlogIndexData, TemplateProps } from "@/lib/cms/types";
import { href } from "@/lib/templates/utils";
import { Frame } from "./Frame";
import { PostCard } from "./PostCard";

export function BlogIndex({ data, basePath }: TemplateProps<BlogIndexData>) {
  const { site, posts, page, totalPages } = data;
  const blog = href(basePath, "/blog");
  const pageHref = (n: number) => (n === 1 ? blog : `${blog}?page=${n}`);
  const step = "m-focus inline-flex min-h-10 items-center gap-2 font-semibold text-blue-800 hover:text-blue-900";

  return (
    <Frame site={site} basePath={basePath} current="blog">
      <div className="border-b border-slate-200 bg-slate-50">
        <div className="m-wrap flex flex-wrap items-end justify-between gap-x-10 gap-y-4 py-14 md:py-20">
          <div className="min-w-0">
            <h1 className="text-[clamp(2.5rem,1.8rem+2.8vw,4.5rem)] leading-[1.02] font-semibold tracking-[-0.035em]">Blog</h1>
            {site.companyName && (
              <p className="mt-4 max-w-2xl text-lg text-pretty break-words text-slate-600 md:text-xl">News and notes from {site.companyName}.</p>
            )}
          </div>
          {totalPages > 1 && (
            <p className="text-sm font-medium text-slate-500 tabular-nums">
              Page {page} of {totalPages}
            </p>
          )}
        </div>
      </div>

      <div className="m-wrap py-14 md:py-20">
        {posts.length === 0 ? (
          <div className="max-w-xl">
            <p className="text-xl font-medium">No posts yet.</p>
            <p className="mt-2 text-slate-600">New posts will appear here as soon as they are published.</p>
            <Link href={href(basePath, "/")} className={`${step} mt-6`}>
              <ArrowLeft aria-hidden size={18} />
              Back to home
            </Link>
          </div>
        ) : (
          <ul className="grid gap-x-8 gap-y-14 *:min-w-0 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <li key={post.id}>
                <PostCard post={post} basePath={basePath} level={2} preload={page === 1 && i < 3} />
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-16 flex items-center justify-between gap-4 border-t border-slate-200 pt-6 md:mt-20">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} rel="prev" className={step}>
                <ArrowLeft aria-hidden size={18} />
                Newer posts
              </Link>
            ) : (
              <span />
            )}
            <ol className="hidden flex-wrap justify-center gap-1 sm:flex">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <li key={n}>
                  <Link
                    href={pageHref(n)}
                    aria-label={`Page ${n}`}
                    aria-current={n === page ? "page" : undefined}
                    className="m-focus grid size-10 place-items-center border border-slate-200 text-sm font-semibold text-slate-600 tabular-nums transition-colors hover:border-slate-900 hover:text-slate-900 aria-[current=page]:border-slate-900 aria-[current=page]:bg-slate-900 aria-[current=page]:text-white"
                  >
                    {n}
                  </Link>
                </li>
              ))}
            </ol>
            <span className="text-sm text-slate-500 tabular-nums sm:hidden">
              {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Link href={pageHref(page + 1)} rel="next" className={step}>
                Older posts
                <ArrowRight aria-hidden size={18} />
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
