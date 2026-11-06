import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { BlogPostData, TemplateProps } from "@/lib/cms/types";
import { formatDate, href } from "@/lib/templates/utils";
import { Frame } from "./Frame";
import { WRAP, fit } from "./ui";

const NEIGHBOUR_TITLE = "onyx-display mt-4 block text-[clamp(1.75rem,3vw,3rem)] wrap-anywhere decoration-2 underline-offset-[0.12em] group-hover:underline";

export function BlogPost({ data, basePath }: TemplateProps<BlogPostData>) {
  const { site, post, prev, next } = data;

  return (
    <Frame site={site} basePath={basePath}>
      <article className="pb-20 md:pb-28">
        <header className={`${WRAP} pt-10 pb-12 md:pt-16 md:pb-16`}>
          <Link
            href={href(basePath, "/blog")}
            className="onyx-label inline-flex items-center gap-2 text-stone-300 decoration-2 underline-offset-[6px] hover:text-stone-100 hover:underline"
          >
            <ArrowLeft aria-hidden size={16} />
            All posts
          </Link>
          <p className="onyx-label mt-10 flex flex-wrap gap-x-4 gap-y-1 text-stone-400 md:mt-14">
            {post.status === "draft" && <span className="bg-stone-100 px-2 text-stone-950">Draft</span>}
            {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>}
            <span>{post.readingMinutes} min read</span>
          </p>
          <h1
            className={`onyx-display mt-5 max-w-[80rem] text-balance wrap-anywhere ${fit(post.title, [
              "text-[clamp(3.25rem,9vw,9rem)]",
              "text-[clamp(2.75rem,6.2vw,6.5rem)]",
              "text-[clamp(2.25rem,4.4vw,4.75rem)]",
            ], [24, 64])}`}
          >
            {post.title}
          </h1>
          {post.excerpt && <p className="mt-8 max-w-3xl text-xl text-pretty text-stone-300 wrap-anywhere md:text-2xl">{post.excerpt}</p>}
        </header>

        {post.coverUrl && (
          <div className="relative aspect-[4/3] bg-stone-900 md:aspect-[21/9] md:max-h-[48rem] md:w-full">
            <Image src={post.coverUrl} alt="" fill preload sizes="100vw" className="object-cover" />
          </div>
        )}

        {/* A bone reading sheet: the editor is white, so authors pick colors and highlights for a light page.
            Rendering on light keeps every inline color exactly as written instead of recoloring it for dark. */}
        <div className="mx-auto max-w-[90rem] md:px-10">
          <div className={`onyx-light relative mx-auto max-w-[54rem] bg-stone-100 px-5 py-12 sm:px-10 md:px-16 md:py-20 ${post.coverUrl ? "md:-mt-40" : ""}`}>
            {/* contentHtml is sanitized server-side on save (lib/cms/sanitize.ts allowlist). */}
            <div className="cms-content mx-auto max-w-[42rem]" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
          </div>
        </div>

        {(prev || next) && (
          <nav aria-label="More posts" className={`${WRAP} mt-16 md:mt-24`}>
            <div className="grid border-t border-stone-800 *:min-w-0 sm:grid-cols-2">
              {prev && (
                <Link href={href(basePath, `/blog/${prev.slug}`)} className="group block border-b border-stone-800 py-8 sm:border-b-0 sm:pr-10 md:py-12">
                  <span className="onyx-label inline-flex items-center gap-2 text-stone-400">
                    <ArrowLeft aria-hidden size={16} />
                    Older post
                  </span>
                  <span className={NEIGHBOUR_TITLE}>{prev.title}</span>
                </Link>
              )}
              {next && (
                <Link
                  href={href(basePath, `/blog/${next.slug}`)}
                  className="group block py-8 sm:col-start-2 sm:border-l sm:border-stone-800 sm:pl-10 sm:text-right md:py-12"
                >
                  <span className="onyx-label inline-flex items-center gap-2 text-stone-400">
                    Newer post
                    <ArrowRight aria-hidden size={16} />
                  </span>
                  <span className={NEIGHBOUR_TITLE}>{next.title}</span>
                </Link>
              )}
            </div>
          </nav>
        )}
      </article>
    </Frame>
  );
}
