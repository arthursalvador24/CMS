"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { RichTextEditor, type EditorValue } from "@/components/editor/RichTextEditor";
import { useAutosave, type SaveStatus } from "@/components/editor/useAutosave";
import {
  deletePost,
  publishPost,
  removePostCover,
  savePost,
  setPostCover,
  unpublishPost,
  type SavePostInput,
} from "@/lib/cms/actions/posts";
import { slugify } from "@/lib/cms/slug";
import type { Post } from "@/lib/cms/types";

const STATUS_TEXT: Record<SaveStatus, string> = {
  idle: "No changes yet",
  unsaved: "Unsaved changes",
  saving: "Saving...",
  saved: "All changes saved",
  error: "Not saved",
};

const input = "w-full rounded-md border border-neutral-300 px-3 py-2";
const button = "rounded-md border border-neutral-300 px-3 py-2 disabled:opacity-50";

/** Test bench only: the real admin screens (wave 2) wire the same editor, hook and actions. */
export function PostBench({ post, previewHref }: { post: Post; previewHref: string }) {
  const router = useRouter();
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [excerpt, setExcerpt] = useState(post.excerpt);
  const [status, setStatus] = useState(post.status);
  const [coverUrl, setCoverUrl] = useState(post.coverUrl);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const content = useRef({ json: post.contentJson, html: post.contentHtml });

  const autosave = useAutosave(() =>
    savePost({
      id: post.id,
      title,
      slug,
      excerpt,
      contentJson: content.current.json as SavePostInput["contentJson"],
      contentHtml: content.current.html,
    }),
  );
  const errors = autosave.fieldErrors;

  const onContent = (value: EditorValue) => {
    content.current = value;
    autosave.markDirty();
  };

  const togglePublish = async () => {
    setBusy(true);
    setMessage(null);
    if (await autosave.flush()) {
      const result = status === "published" ? await unpublishPost(post.id) : await publishPost(post.id);
      if (result.ok) setStatus(status === "published" ? "draft" : "published");
      else setMessage(result.error);
    } else {
      setMessage("Fix the errors above, then publish.");
    }
    setBusy(false);
  };

  const uploadCover = async (file: File | undefined) => {
    if (!file) return;
    const formData = new FormData();
    formData.set("file", file);
    setBusy(true);
    const result = await setPostCover(post.id, formData);
    if (result.ok) setCoverUrl(result.data.url);
    else setMessage(result.error);
    setBusy(false);
  };

  const dropCover = async () => {
    setBusy(true);
    const result = await removePostCover(post.id);
    if (result.ok) setCoverUrl(null);
    else setMessage(result.error);
    setBusy(false);
  };

  const remove = async () => {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    setBusy(true);
    const result = await deletePost(post.id);
    if (result.ok) router.push("/dev/editor");
    else {
      setMessage(result.error);
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/dev/editor" className="underline">
          All posts
        </Link>
        <span className="ml-auto text-sm text-neutral-600" role="status" aria-live="polite" data-testid="save-status">
          {STATUS_TEXT[autosave.status]}
          {autosave.error ? `: ${autosave.error}` : ""}
        </span>
        <button type="button" className={button} onClick={() => (autosave.markDirty(), void autosave.flush())}>
          Save now
        </button>
        <a href={previewHref} target="_blank" rel="noreferrer" className={button}>
          Preview
        </a>
        <button type="button" className={button} disabled={busy} onClick={togglePublish}>
          {status === "published" ? "Unpublish" : "Publish"}
        </button>
        <button type="button" className={`${button} text-red-700`} disabled={busy} onClick={remove}>
          Delete
        </button>
      </div>

      <p className="text-sm">
        Status: <strong data-testid="post-status">{status}</strong>
        {status === "published" && (
          <>
            {" "}
            <a href={`/blog/${slug}`} target="_blank" rel="noreferrer" className="underline">
              View on site
            </a>
          </>
        )}
      </p>
      {message && (
        <p className="text-sm text-red-700" role="alert">
          {message}
        </p>
      )}

      <label className="grid gap-1">
        <span className="text-sm font-medium">Title</span>
        <input
          name="title"
          className={input}
          value={title}
          onChange={(e) => (setTitle(e.target.value), autosave.markDirty())}
        />
        {errors.title && <span className="text-sm text-red-700">{errors.title}</span>}
      </label>

      <div className="grid gap-1">
        <label htmlFor="slug" className="text-sm font-medium">
          Slug
        </label>
        <div className="flex gap-2">
          <input
            id="slug"
            name="slug"
            className={input}
            value={slug}
            onChange={(e) => (setSlug(e.target.value), autosave.markDirty())}
          />
          <button
            type="button"
            className={`${button} shrink-0`}
            onClick={() => (setSlug(slugify(title)), autosave.markDirty())}
          >
            From title
          </button>
        </div>
        {errors.slug && <span className="text-sm text-red-700">{errors.slug}</span>}
      </div>

      <label className="grid gap-1">
        <span className="text-sm font-medium">Excerpt</span>
        <textarea
          name="excerpt"
          className={input}
          rows={2}
          maxLength={400}
          value={excerpt}
          onChange={(e) => (setExcerpt(e.target.value), autosave.markDirty())}
        />
        {errors.excerpt && <span className="text-sm text-red-700">{errors.excerpt}</span>}
      </label>

      <div className="grid gap-2">
        <span className="text-sm font-medium">Cover image</span>
        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- dev bench preview only
          <img src={coverUrl} alt="" className="h-40 w-full max-w-sm rounded-md object-cover" data-testid="cover" />
        )}
        <div className="flex flex-wrap gap-2">
          <input
            type="file"
            name="cover"
            aria-label="Upload cover image"
            accept="image/png,image/jpeg,image/webp"
            disabled={busy}
            onChange={(e) => {
              void uploadCover(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {coverUrl && (
            <button type="button" className={button} disabled={busy} onClick={dropCover}>
              Remove cover
            </button>
          )}
        </div>
      </div>

      <RichTextEditor initialJson={post.contentJson} initialHtml={post.contentHtml} onChange={onContent} />
    </div>
  );
}
