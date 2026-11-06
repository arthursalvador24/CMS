import Image from "next/image";
import Link from "next/link";
import type { PostSummary } from "@/lib/cms/types";
import { formatDate, href } from "@/lib/templates/utils";

type Props = {
  post: PostSummary;
  basePath: string;
  /** Larger title. */
  feature?: boolean;
  /** Show the excerpt (defaults to feature cards only). */
  excerpt?: boolean;
  className?: string;
  sizes: string;
  heading?: "h2" | "h3";
};

/** Image-led card: the cover fills the card and the text sits on a scrim. The whole card is the link. */
export function PostCard({ post, basePath, feature = false, excerpt = feature, className = "", sizes, heading: H = "h3" }: Props) {
  return (
    <article
      className={`group relative isolate flex flex-col justify-end overflow-hidden bg-stone-900 ${post.coverUrl ? "" : "border border-stone-800"} ${className}`}
    >
      {post.coverUrl && (
        <Image
          src={post.coverUrl}
          alt=""
          fill
          sizes={sizes}
          className="-z-10 object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
        />
      )}
      <div className={`p-5 md:p-8 ${post.coverUrl ? "onyx-card-scrim pt-24 md:pt-28" : ""}`}>
        <p className="onyx-label flex flex-wrap gap-x-3 text-stone-300">
          {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>}
          <span>{post.readingMinutes} min read</span>
        </p>
        <H
          className={`onyx-display mt-3 wrap-anywhere ${
            feature ? "text-[clamp(2.25rem,4.4vw,4.5rem)]" : "text-[clamp(1.75rem,2.5vw,2.625rem)]"
          }`}
        >
          <Link
            href={href(basePath, `/blog/${post.slug}`)}
            className="decoration-2 underline-offset-[0.12em] after:absolute after:inset-0 after:content-[''] group-hover:underline"
          >
            {post.title}
          </Link>
        </H>
        {excerpt && post.excerpt && <p className="mt-4 line-clamp-3 max-w-xl text-pretty text-stone-300 wrap-anywhere">{post.excerpt}</p>}
      </div>
    </article>
  );
}
