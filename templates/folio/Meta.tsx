import type { PostSummary } from "@/lib/cms/types";
import { formatDate } from "@/lib/templates/utils";

/** "OCT 28, 2026 · 4 MIN READ" in Folio's small label style. */
export function Meta({ post, className = "" }: { post: PostSummary; className?: string }) {
  return (
    <p className={`fo-label text-(--fo-ink-soft) ${className}`}>
      {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>}
      {post.publishedAt && <span aria-hidden> &middot; </span>}
      {post.readingMinutes} min read
    </p>
  );
}
