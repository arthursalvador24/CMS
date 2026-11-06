"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type MouseEvent } from "react";
import { ArrowLeft, CircleAlert, CircleCheck, Eye, ImageUp, LoaderCircle, SquareArrowOutUpRight, Trash2 } from "lucide-react";
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
import type { Post, TemplateKey } from "@/lib/cms/types";
import { ConfirmDialog } from "./ConfirmDialog";
import { Field, fieldAria, NETWORK_ERROR } from "./Field";
import { checkImageFile, IMAGE_ACCEPT } from "./LogoField";
import { formatDate, PostStatusBadge } from "./PostStatusBadge";
import { buttonGhost, buttonPrimary, buttonSecondary, card, focusRing, textarea, textInput } from "./ui";
import { useUnsavedWarning } from "./useUnsavedWarning";

const titleInput =
  "block min-h-12 w-full resize-none rounded-lg border border-stone-300 bg-white px-3 py-2 text-xl leading-snug font-semibold tracking-tight text-balance text-stone-900 shadow-xs outline-none transition-[border-color,box-shadow] [field-sizing:content] placeholder:text-stone-400 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/10 aria-invalid:border-red-600";

/** New drafts start as "untitled-post"; until the first publish their slug follows the title. */
const followsTitle = (post: Post) =>
  post.publishedAt === null && (post.slug === slugify(post.title) || /^untitled-post(-\d+)?$/.test(post.slug));

type Message = { kind: "ok" | "error"; text: string } | null;

export function PostEditor({ post, activeTemplate }: { post: Post; activeTemplate: TemplateKey }) {
  const router = useRouter();
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [slugLinked, setSlugLinked] = useState(() => followsTitle(post));
  const [excerpt, setExcerpt] = useState(post.excerpt);
  const [status, setStatus] = useState(post.status);
  const [publishedAt, setPublishedAt] = useState(post.publishedAt);
  const [coverUrl, setCoverUrl] = useState(post.coverUrl);
  const [busy, setBusy] = useState<null | "publish" | "update" | "cover" | "delete">(null);
  const [message, setMessage] = useState<Message>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const content = useRef({ json: post.contentJson, html: post.contentHtml });
  const coverInput = useRef<HTMLInputElement>(null);

  const published = status === "published";
  // Drafts autosave. A published post keeps edits on screen until "Update post", so half-typed text never goes live.
  const autosave = useAutosave(
    () =>
      savePost({
        id: post.id,
        title,
        slug,
        excerpt,
        contentJson: content.current.json as SavePostInput["contentJson"],
        contentHtml: content.current.html,
      }),
    { auto: !published },
  );
  const errors = autosave.fieldErrors;
  const hasEdits = autosave.status === "unsaved" || autosave.status === "error";
  useUnsavedWarning(hasEdits || autosave.status === "saving" || busy !== null);

  const previewHref = `/preview/${activeTemplate}/post/${post.id}`;
  // Saving a published post puts it live, so Preview waits until the edits are saved with "Update post".
  const previewOff = published && hasEdits;

  /** Every edit: an old "Published" or "Updated" note no longer describes what is on screen. */
  const edited = () => {
    setMessage(null);
    autosave.markDirty();
  };

  const onTitle = (value: string) => {
    setTitle(value);
    if (slugLinked && value.trim()) setSlug(slugify(value));
    edited();
  };

  const onContent = (value: EditorValue) => {
    content.current = value;
    edited();
  };

  /** Drafts save first, then open the preview, so it shows what is on screen. */
  const openPreview = async (event: MouseEvent<HTMLAnchorElement>) => {
    if (!hasEdits) return; // nothing pending: plain link
    event.preventDefault();
    const tab = window.open("", "_blank");
    await autosave.flush();
    if (tab) tab.location.href = previewHref;
  };

  async function togglePublish() {
    setBusy("publish");
    setMessage(null);
    try {
      if (published) {
        const result = await unpublishPost(post.id);
        if (!result.ok) return setMessage({ kind: "error", text: result.error });
        setStatus("draft");
        setMessage({ kind: "ok", text: "Moved back to drafts. It is no longer on your site." });
        await autosave.flush(); // edits that never went live are kept in the draft
      } else {
        if (!(await autosave.flush())) {
          setMessage({ kind: "error", text: "This post has unsaved changes with errors. Fix them, then try again." });
          return;
        }
        const result = await publishPost(post.id);
        if (!result.ok) return setMessage({ kind: "error", text: result.error });
        setStatus("published");
        setPublishedAt(result.data.publishedAt);
        setSlugLinked(false);
        setMessage({ kind: "ok", text: "Published. The post is live on your blog." });
      }
    } catch {
      setMessage({ kind: "error", text: NETWORK_ERROR });
    } finally {
      setBusy(null);
    }
  }

  /** Published posts only: saves the edits on screen, which puts them on the site. */
  async function updateLive() {
    setBusy("update");
    setMessage(null);
    if (await autosave.flush()) setMessage({ kind: "ok", text: "Updated. Your changes are live on your site." });
    setBusy(null);
  }

  async function uploadCover(file: File | undefined) {
    if (!file) return;
    const problem = checkImageFile(file);
    if (problem) return setCoverError(problem);
    setCoverError(null);
    setBusy("cover");
    const formData = new FormData();
    formData.set("file", file);
    try {
      const result = await setPostCover(post.id, formData);
      if (result.ok) setCoverUrl(result.data.url);
      else setCoverError(result.error);
    } catch {
      setCoverError(NETWORK_ERROR);
    }
    setBusy(null);
  }

  async function dropCover() {
    setCoverError(null);
    setBusy("cover");
    try {
      const result = await removePostCover(post.id);
      if (result.ok) setCoverUrl(null);
      else setCoverError(result.error);
    } catch {
      setCoverError(NETWORK_ERROR);
    }
    setBusy(null);
  }

  async function remove() {
    setBusy("delete");
    try {
      const result = await deletePost(post.id);
      if (result.ok) {
        router.push("/admin/blog");
        return;
      }
      setMessage({ kind: "error", text: result.error });
    } catch {
      setMessage({ kind: "error", text: NETWORK_ERROR });
    }
    setBusy(null);
    setConfirmDelete(false);
  }

  return (
    <div>
      <Link href="/admin/blog" className={`mb-5 inline-flex items-center gap-1.5 rounded-md text-sm text-stone-600 hover:text-stone-900 ${focusRing}`}>
        <ArrowLeft aria-hidden="true" className="size-4" />
        All posts
      </Link>

      <div className="grid gap-6 [grid-template-areas:'status'_'main'_'details'] lg:grid-cols-[minmax(0,1fr)_18rem] lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:[grid-template-areas:'main_status'_'main_details']">
        {/* ---------- status and publishing ---------- */}
        <section aria-label="Publishing" className={`${card} space-y-4 p-4 [grid-area:status] sm:p-5 lg:self-start`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <PostStatusBadge status={status} />
            <SaveStatusText status={autosave.status} error={autosave.error} onRetry={() => void autosave.flush()} />
          </div>
          {autosave.status === "error" && autosave.error ? <p className="text-sm text-red-700">{autosave.error}</p> : null}
          {published && publishedAt ? <p className="text-sm text-stone-600">Published {formatDate(publishedAt)}</p> : null}
          {previewOff ? (
            <p id="update-hint" className="text-sm text-pretty text-stone-600">
              Your edits are not on your site yet. Click Update post to publish them. Preview works again after that.
            </p>
          ) : null}
          <div className="grid gap-2 max-lg:grid-cols-2">
            {published ? (
              <button type="button" className={`${buttonPrimary} max-lg:col-span-2`} onClick={updateLive} disabled={busy !== null || !hasEdits}>
                {busy === "update" ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" /> : null}
                Update post
              </button>
            ) : null}
            <button
              type="button"
              className={published ? buttonSecondary : buttonPrimary}
              onClick={togglePublish}
              disabled={busy !== null}
            >
              {busy === "publish" ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" /> : null}
              {published ? "Unpublish" : "Publish"}
            </button>
            {previewOff ? (
              <button type="button" disabled aria-describedby="update-hint" className={buttonSecondary}>
                <Eye aria-hidden="true" className="size-4" />
                Preview
              </button>
            ) : (
              <a href={previewHref} target="_blank" rel="noreferrer" onClick={openPreview} className={buttonSecondary}>
                <Eye aria-hidden="true" className="size-4" />
                Preview<span className="sr-only"> in the live template (opens in a new tab)</span>
              </a>
            )}
            {published ? (
              <a href={`/blog/${slug}`} target="_blank" rel="noreferrer" className={`${buttonGhost} max-lg:col-span-2`}>
                <SquareArrowOutUpRight aria-hidden="true" className="size-4" />
                View on site<span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : null}
          </div>
          <p role="status" aria-live="polite" className="text-sm empty:hidden">
            {message ? (
              <span className={`flex items-start gap-2 ${message.kind === "ok" ? "text-emerald-700" : "text-red-700"}`}>
                {message.kind === "ok" ? (
                  <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                ) : (
                  <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                )}
                {message.text}
              </span>
            ) : null}
          </p>
        </section>

        {/* ---------- title and body ---------- */}
        <div className="min-w-0 space-y-5 [grid-area:main]">
          <Field id="title" label="Title" error={errors.title}>
            {/* A one-line textarea so long titles wrap on phones; Enter and pasted line breaks are ignored. */}
            <textarea
              {...fieldAria("title", errors.title)}
              name="title"
              rows={1}
              maxLength={200}
              value={title}
              onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
              onChange={(e) => onTitle(e.target.value.replace(/[\r\n]+/g, " "))}
              className={titleInput}
            />
          </Field>
          <div className="space-y-1.5">
            <p id="body-label" className="text-sm font-medium text-stone-800">
              Content
            </p>
            {errors.contentHtml || errors.contentJson ? (
              <p className="text-sm text-red-700">{errors.contentHtml ?? errors.contentJson}</p>
            ) : null}
            <RichTextEditor initialJson={post.contentJson} initialHtml={post.contentHtml} onChange={onContent} label="Post content" />
          </div>
        </div>

        {/* ---------- details ---------- */}
        <div className="space-y-6 [grid-area:details] lg:self-start">
          <section aria-labelledby="details-heading" className={`${card} space-y-5 p-4 sm:p-5`}>
            <h2 id="details-heading" className="text-sm font-semibold text-stone-900">
              Post details
            </h2>
            <Field
              id="slug"
              label="Web address"
              error={errors.slug}
              hint={
                <>
                  /blog/{slug || "…"}
                  {published ? (
                    " · Unpublish to change the web address."
                  ) : !slugLinked ? (
                    <>
                      {" · "}
                      <button
                        type="button"
                        className={`rounded font-medium text-stone-700 underline underline-offset-2 hover:text-stone-900 ${focusRing}`}
                        onClick={() => {
                          setSlug(slugify(title));
                          setSlugLinked(true);
                          edited();
                        }}
                      >
                        Match the title
                      </button>
                    </>
                  ) : null}
                </>
              }
            >
              <input
                {...fieldAria("slug", errors.slug, true)}
                name="slug"
                maxLength={120}
                autoCapitalize="none"
                spellCheck={false}
                disabled={published}
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugLinked(false);
                  edited();
                }}
                className={textInput}
              />
            </Field>
            <Field
              id="excerpt"
              label="Excerpt"
              error={errors.excerpt}
              hint="A sentence or two for the blog list and link previews."
              aside={<span className="text-xs tabular-nums text-stone-500">{excerpt.length} / 400</span>}
            >
              <textarea
                {...fieldAria("excerpt", errors.excerpt, true)}
                name="excerpt"
                maxLength={400}
                value={excerpt}
                onChange={(e) => {
                  setExcerpt(e.target.value);
                  edited();
                }}
                className={`${textarea} min-h-24`}
              />
            </Field>
          </section>

          <section aria-labelledby="cover-heading" className={`${card} space-y-3 p-4 sm:p-5`}>
            <h2 id="cover-heading" className="text-sm font-semibold text-stone-900">
              Cover image
            </h2>
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- stored cover preview
                <img src={coverUrl} alt="Current cover" className="size-full object-cover" data-testid="cover" />
              ) : (
                <span className="absolute inset-0 grid place-items-center text-sm text-stone-500">No cover image</span>
              )}
              {busy === "cover" ? (
                <span className="absolute inset-0 grid place-items-center bg-white/70">
                  <LoaderCircle aria-hidden="true" className="size-6 animate-spin text-stone-700 motion-reduce:animate-none" />
                </span>
              ) : null}
            </div>
            <input
              ref={coverInput}
              type="file"
              accept={IMAGE_ACCEPT}
              className="sr-only"
              tabIndex={-1}
              aria-label="Cover image file"
              onChange={(e) => {
                void uploadCover(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" className={buttonSecondary} disabled={busy !== null} onClick={() => coverInput.current?.click()}>
                <ImageUp aria-hidden="true" className="size-4" />
                {coverUrl ? "Replace" : "Upload cover"}
              </button>
              {coverUrl ? (
                <button type="button" className={buttonGhost} disabled={busy !== null} onClick={dropCover}>
                  Remove
                </button>
              ) : null}
            </div>
            <p role="status" aria-live="polite" className="text-sm text-red-700 empty:hidden">
              {coverError}
            </p>
            <p className="text-sm text-stone-500">Saves right away. PNG, JPG or WebP up to 4 MB.</p>
          </section>

          <button
            type="button"
            className={`${buttonGhost} w-full text-red-700 hover:bg-red-50 hover:text-red-800`}
            disabled={busy !== null}
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 aria-hidden="true" className="size-4" />
            Delete post
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this post?"
        confirmLabel="Delete post"
        danger
        busy={busy === "delete"}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      >
        &ldquo;{title}&rdquo; and its images will be deleted{published ? ", and it comes off your site" : ""}. This cannot be undone.
      </ConfirmDialog>
    </div>
  );
}

function SaveStatusText({ status, error, onRetry }: { status: SaveStatus; error: string | null; onRetry: () => void }) {
  return (
    <p role="status" aria-live="polite" className="flex min-w-0 items-center gap-1.5 text-sm" data-testid="save-status">
      {status === "saving" ? (
        <>
          <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin text-stone-500 motion-reduce:animate-none" />
          <span className="text-stone-600">Saving…</span>
        </>
      ) : status === "unsaved" ? (
        <>
          <span aria-hidden="true" className="size-2 rounded-full bg-amber-500" />
          <span className="text-amber-800">Unsaved changes</span>
        </>
      ) : status === "error" ? (
        <>
          <CircleAlert aria-hidden="true" className="size-3.5 shrink-0 text-red-700" />
          <span className="text-red-700" title={error ?? undefined}>
            Not saved
          </span>
          <button type="button" onClick={onRetry} className={`rounded font-medium text-stone-800 underline underline-offset-2 ${focusRing}`}>
            Retry
          </button>
        </>
      ) : (
        <>
          <CircleCheck aria-hidden="true" className="size-3.5 text-emerald-700" />
          <span className="text-stone-600">All changes saved</span>
        </>
      )}
    </p>
  );
}
