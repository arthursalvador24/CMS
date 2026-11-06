import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { BlogPostData, PostSummary, TemplateProps } from "@/lib/cms/types";
import { href } from "@/lib/templates/utils";
import { Frame } from "./Frame";
import { Meta } from "./Meta";

export function BlogPost({ data, basePath }: TemplateProps<BlogPostData>) {
  const { site, post, prev, next } = data;

  return (
    <Frame site={site} basePath={basePath} page="blog">
      <article>
        <header className="fo-wrap pt-12 text-center md:pt-20">
          <p className="fo-label flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <Link href={href(basePath, "/blog")} className="text-(--fo-clay) underline decoration-(--fo-rule) underline-offset-[6px] hover:decoration-(--fo-clay)">
              The journal
            </Link>
            {post.status === "draft" && <span className="rounded-full bg-(--fo-clay) px-2.5 py-0.5 text-[#fffaf3]">Draft</span>}
          </p>
          <h1 className="fo-display mx-auto mt-6 max-w-4xl text-[2.375rem] wrap-break-word md:text-[4rem]">{post.title}</h1>
          {post.excerpt && (
            <p className="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-(--fo-ink-soft) italic wrap-break-word md:text-[1.375rem]">{post.excerpt}</p>
          )}
          <Meta post={post} className="mt-7" />
        </header>

        {post.coverUrl && (
          <div className="fo-wrap mt-12 md:mt-16">
            <div className="fo-mat mx-auto max-w-5xl p-2 sm:p-3">
              <div className="relative aspect-[16/9] overflow-hidden bg-(--fo-paper-deep)">
                <Image src={post.coverUrl} alt="" fill preload sizes="(min-width: 1100px) 1000px, 100vw" className="object-cover" />
              </div>
            </div>
          </div>
        )}

        {/* contentHtml is sanitized server-side on save (lib/cms/sanitize.ts allowlist). */}
        <div
          className="cms-content mx-auto mt-12 max-w-[42rem] px-5 md:mt-16 md:px-0"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      </article>

      {(prev || next) && (
        <nav aria-label="More stories" className="fo-wrap mt-20 md:mt-28">
          <div className="grid *:min-w-0 border-y border-(--fo-rule) md:grid-cols-2 md:divide-x md:divide-(--fo-rule)">
            {prev ? <Neighbour post={prev} basePath={basePath} label="Older story" /> : <span className="hidden md:block" />}
            {next && <Neighbour post={next} basePath={basePath} label="Newer story" newer />}
          </div>
        </nav>
      )}
    </Frame>
  );
}

function Neighbour({ post, basePath, label, newer = false }: { post: PostSummary; basePath: string; label: string; newer?: boolean }) {
  const Arrow = newer ? ArrowRight : ArrowLeft;
  return (
    <Link
      href={href(basePath, `/blog/${post.slug}`)}
      rel={newer ? "next" : "prev"}
      className={`group block py-8 md:py-10 ${newer ? "border-t border-(--fo-rule) md:border-t-0 md:pl-12 md:text-right" : "md:pr-12"}`}
    >
      <span className={`fo-label flex items-center gap-2 text-(--fo-clay) ${newer ? "md:justify-end" : ""}`}>
        {!newer && <Arrow aria-hidden size={15} />}
        {label}
        {newer && <Arrow aria-hidden size={15} />}
      </span>
      <span className="fo-display mt-3 block text-[1.5rem] wrap-break-word decoration-(--fo-clay) decoration-1 underline-offset-[5px] group-hover:underline md:text-[1.875rem]">
        {post.title}
      </span>
    </Link>
  );
}
