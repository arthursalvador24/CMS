import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { BlogPostData, TemplateProps } from "@/lib/cms/types";
import { formatDate, href } from "@/lib/templates/utils";
import { Frame } from "./Frame";

/** Header and body share one left edge: grid column 3 from 1024px, the full width below. */
const column = "lg:col-start-3";

export function BlogPost({ data, basePath }: TemplateProps<BlogPostData>) {
  const { site, post, prev, next } = data;
  const meta: { term: string; value: ReactNode }[] = [
    ...(post.publishedAt ? [{ term: "Published", value: <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time> }] : []),
    { term: "Reading time", value: `${post.readingMinutes} min` },
    ...(post.status === "draft" ? [{ term: "Status", value: <span className="text-amber-700">Draft</span> }] : []),
  ];

  return (
    <Frame site={site} basePath={basePath} current="blog">
      <article>
        <header className="m-wrap pt-10 md:pt-16 lg:grid lg:grid-cols-12 lg:gap-x-10">
          <div className={`min-w-0 lg:col-span-9 ${column}`}>
            <Link
              href={href(basePath, "/blog")}
              className="m-focus group -ml-0.5 inline-flex min-h-10 items-center gap-2 text-[15px] font-semibold text-blue-800 hover:text-blue-900"
            >
              <ArrowLeft aria-hidden size={18} className="transition-transform motion-safe:group-hover:-translate-x-0.5" />
              All posts
            </Link>
            <h1 className="mt-6 text-[clamp(2.25rem,1.6rem+2.6vw,4rem)] leading-[1.05] font-semibold tracking-[-0.035em] text-balance break-words">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-6 max-w-3xl text-xl leading-relaxed text-pretty break-words text-slate-600 md:text-[1.375rem]">{post.excerpt}</p>
            )}
            <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-4 border-t border-slate-200 pt-5">
              {meta.map((m) => (
                <div key={m.term}>
                  <dt className="m-label text-slate-500">{m.term}</dt>
                  <dd className="mt-1 font-medium tabular-nums">{m.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </header>

        {post.coverUrl && (
          <div className="m-wrap mt-10 md:mt-14">
            <div className="relative aspect-[3/2] overflow-hidden bg-slate-100 md:aspect-[2/1]">
              <Image src={post.coverUrl} alt="" fill preload sizes="(min-width: 1280px) 1200px, 100vw" className="object-cover" />
            </div>
          </div>
        )}

        <div className="m-wrap py-14 md:py-20 lg:grid lg:grid-cols-12 lg:gap-x-10">
          {/* contentHtml is sanitized server-side on save (lib/cms/sanitize.ts allowlist). */}
          <div className={`cms-content min-w-0 max-w-[44rem] lg:col-span-7 ${column}`} dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
        </div>
      </article>

      {(prev || next) && (
        <nav aria-label="More posts" className="border-t border-slate-200">
          <div className="m-wrap grid *:min-w-0 sm:grid-cols-2">
            {prev ? (
              <Link href={href(basePath, `/blog/${prev.slug}`)} className="m-focus group block py-8 sm:pr-10 md:py-12">
                <span className="m-label flex items-center gap-2 text-slate-500">
                  <ArrowLeft aria-hidden size={16} />
                  Older post
                </span>
                <span className="mt-3 block text-xl leading-snug font-semibold tracking-[-0.015em] break-words decoration-blue-800 decoration-2 underline-offset-4 group-hover:underline md:text-2xl">
                  {prev.title}
                </span>
              </Link>
            ) : (
              <span className="hidden sm:block" />
            )}
            {next && (
              <Link
                href={href(basePath, `/blog/${next.slug}`)}
                className="m-focus group block border-t border-slate-200 py-8 sm:border-t-0 sm:border-l sm:pl-10 sm:text-right md:py-12"
              >
                <span className="m-label flex items-center gap-2 text-slate-500 sm:justify-end">
                  Newer post
                  <ArrowRight aria-hidden size={16} />
                </span>
                <span className="mt-3 block text-xl leading-snug font-semibold tracking-[-0.015em] break-words decoration-blue-800 decoration-2 underline-offset-4 group-hover:underline md:text-2xl">
                  {next.title}
                </span>
              </Link>
            )}
          </div>
        </nav>
      )}
    </Frame>
  );
}
