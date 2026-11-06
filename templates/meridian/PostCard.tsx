import Image from "next/image";
import Link from "next/link";
import type { PostSummary } from "@/lib/cms/types";
import { formatDate, href } from "@/lib/templates/utils";

/** Cover, date and reading time, title and excerpt. The title link stretches over the whole card. */
export function PostCard({
  post,
  basePath,
  level = 3,
  preload = false,
}: {
  post: PostSummary;
  basePath: string;
  level?: 2 | 3;
  preload?: boolean;
}) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative aspect-[3/2] overflow-hidden bg-slate-100">
        {post.coverUrl ? (
          <Image
            src={post.coverUrl}
            alt=""
            fill
            preload={preload}
            sizes="(min-width: 1280px) 400px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.03]"
          />
        ) : (
          <span aria-hidden className="absolute inset-0 grid place-items-center text-7xl font-semibold text-slate-300">
            {post.title.trim().charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <p className="mt-5 flex flex-wrap gap-x-2 text-sm text-slate-500 tabular-nums">
        {post.publishedAt && (
          <>
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            <span aria-hidden>&middot;</span>
          </>
        )}
        <span>{post.readingMinutes} min read</span>
      </p>
      <Heading className="mt-2 text-xl leading-snug font-semibold tracking-[-0.015em] break-words">
        <Link
          href={href(basePath, `/blog/${post.slug}`)}
          className="decoration-blue-800 decoration-2 underline-offset-4 group-hover:underline after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-blue-800"
        >
          {post.title}
        </Link>
      </Heading>
      {post.excerpt && <p className="mt-2 line-clamp-3 leading-relaxed break-words text-slate-600">{post.excerpt}</p>}
    </article>
  );
}
