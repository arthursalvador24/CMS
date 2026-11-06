"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, Globe, GlobeLock, SquareArrowOutUpRight, Trash2 } from "lucide-react";
import { deletePost, publishPost, unpublishPost } from "@/lib/cms/actions/posts";
import type { PostStatus } from "@/lib/cms/types";
import { ConfirmDialog } from "./ConfirmDialog";
import { NETWORK_ERROR } from "./Field";
import { iconButton } from "./ui";

/** Row quick actions on the post list: preview, view live, publish or unpublish, delete. */
export function PostListActions({
  post,
  previewHref,
}: {
  post: { id: string; title: string; slug: string; status: PostStatus };
  previewHref: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const published = post.status === "published";

  const act = (action: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) =>
    startTransition(async () => {
      setError(null);
      try {
        const result = await action();
        if (result.ok) {
          after?.();
          router.refresh();
        } else setError(result.error ?? "Something went wrong. Please try again.");
      } catch {
        setError(NETWORK_ERROR);
      }
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-0.5">
        <a href={previewHref} target="_blank" rel="noreferrer" className={iconButton} aria-label={`Preview ${post.title} (opens in a new tab)`} title="Preview">
          <Eye aria-hidden="true" className="size-[18px]" />
        </a>
        {published ? (
          <a
            href={`/blog/${post.slug}`}
            target="_blank"
            rel="noreferrer"
            className={iconButton}
            aria-label={`View ${post.title} on the site (opens in a new tab)`}
            title="View on site"
          >
            <SquareArrowOutUpRight aria-hidden="true" className="size-[18px]" />
          </a>
        ) : null}
        <button
          type="button"
          className={iconButton}
          disabled={pending}
          aria-label={published ? `Unpublish ${post.title}` : `Publish ${post.title}`}
          title={published ? "Unpublish" : "Publish"}
          onClick={() => act(() => (published ? unpublishPost(post.id) : publishPost(post.id)))}
        >
          {published ? <GlobeLock aria-hidden="true" className="size-[18px]" /> : <Globe aria-hidden="true" className="size-[18px]" />}
        </button>
        <button
          type="button"
          className={`${iconButton} hover:bg-red-50 hover:text-red-700`}
          disabled={pending}
          aria-label={`Delete ${post.title}`}
          title="Delete"
          onClick={() => {
            setError(null);
            setConfirming(true);
          }}
        >
          <Trash2 aria-hidden="true" className="size-[18px]" />
        </button>
      </div>
      <p role="alert" className="max-w-56 text-right text-xs text-red-700 empty:hidden">
        {confirming ? null : error}
      </p>

      <ConfirmDialog
        open={confirming}
        title="Delete this post?"
        confirmLabel="Delete post"
        danger
        busy={pending}
        error={error}
        onConfirm={() => act(() => deletePost(post.id), () => setConfirming(false))}
        onCancel={() => setConfirming(false)}
      >
        &ldquo;{post.title}&rdquo; and its images will be deleted{published ? ", and it comes off your site" : ""}. This cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
