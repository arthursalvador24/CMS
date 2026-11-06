import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { Newspaper, Search } from "lucide-react";
import { NewPostButton } from "@/components/admin/NewPostButton";
import { LoadingBlock, PageHeader } from "@/components/admin/PageHeader";
import { PostListActions } from "@/components/admin/PostListActions";
import { formatDate, PostStatusBadge } from "@/components/admin/PostStatusBadge";
import { currentAdmin } from "@/components/admin/session";
import { buttonSecondary, card, focusRing, textInput } from "@/components/admin/ui";
import { listAdminPosts } from "@/lib/cms/admin-posts";
import { getAdminSite } from "@/lib/cms/admin-read";

export const metadata: Metadata = { title: "Blog" };

type Filter = "all" | "draft" | "published";
const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "published", label: "Published" },
];

export default function BlogPage({ searchParams }: PageProps<"/admin/blog">) {
  return (
    <>
      <PageHeader
        title="Blog"
        description="Write and publish posts. Drafts stay private until you publish them."
        actions={<NewPostButton />}
      />
      <Suspense fallback={<LoadingBlock className="h-96" />}>
        <Posts searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

async function Posts({ searchParams }: Pick<PageProps<"/admin/blog">, "searchParams">) {
  await currentAdmin();
  const params = await searchParams;
  const q = one(params.q).trim().slice(0, 100);
  const status: Filter = one(params.status) === "draft" ? "draft" : one(params.status) === "published" ? "published" : "all";
  const [posts, site] = await Promise.all([listAdminPosts({ q, status }), getAdminSite()]);
  const href = (next: { q?: string; status?: Filter }) => {
    const sp = new URLSearchParams();
    const nq = next.q ?? q;
    const ns = next.status ?? status;
    if (nq) sp.set("q", nq);
    if (ns !== "all") sp.set("status", ns);
    const s = sp.toString();
    return s ? `/admin/blog?${s}` : "/admin/blog";
  };
  const filtered = Boolean(q) || status !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Form action="/admin/blog" role="search" className="relative w-full sm:max-w-xs">
          <label htmlFor="post-search" className="sr-only">
            Search posts by title
          </label>
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
          <input
            id="post-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search by title"
            className={`${textInput} pl-9`}
          />
          {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
        </Form>
        <nav aria-label="Filter posts" className="inline-flex self-start rounded-lg border border-stone-200 bg-stone-100 p-0.5">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={href({ status: f.value })}
              aria-current={status === f.value ? "page" : undefined}
              className={`inline-flex h-9 items-center rounded-md px-3 text-sm transition-colors ${focusRing} ${
                status === f.value ? "bg-white font-medium text-stone-900 shadow-xs" : "text-stone-600 hover:text-stone-900"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </nav>
      </div>

      <p className="sr-only" role="status">
        {posts.length} {posts.length === 1 ? "post" : "posts"} shown
      </p>

      {posts.length === 0 ? (
        <div className={`${card} flex flex-col items-center px-6 py-14 text-center`}>
          <span className="grid size-12 place-items-center rounded-2xl bg-stone-100 text-stone-500">
            <Newspaper aria-hidden="true" className="size-6" />
          </span>
          {filtered ? (
            <>
              <h2 className="mt-4 text-base font-semibold">No posts match</h2>
              <p className="mt-1 max-w-sm text-sm text-stone-600">
                {q ? <>Nothing with &ldquo;{q}&rdquo; in the title{status !== "all" ? ` among ${status === "draft" ? "drafts" : "published posts"}` : ""}.</> : `No ${status === "draft" ? "drafts" : "published posts"} yet.`}
              </p>
              <Link href="/admin/blog" className={`${buttonSecondary} mt-5`}>
                Show all posts
              </Link>
            </>
          ) : (
            <>
              <h2 className="mt-4 text-base font-semibold">No posts yet</h2>
              <p className="mt-1 max-w-sm text-sm text-stone-600">Your first post shows up on the blog as soon as you publish it.</p>
              <div className="mt-5">
                <NewPostButton label="Write your first post" />
              </div>
            </>
          )}
        </div>
      ) : (
        <ul className={`${card} divide-y divide-stone-200`}>
          {posts.map((post) => (
            <li key={post.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3 sm:flex-nowrap sm:px-4">
              <Link href={`/admin/blog/${post.id}`} className={`group flex min-w-0 flex-1 items-center gap-4 rounded-lg ${focusRing}`}>
                <span className="relative aspect-[4/3] w-16 shrink-0 overflow-hidden rounded-lg bg-stone-100 sm:w-20">
                  {post.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- small cover thumbnail
                    <img src={post.coverUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <Newspaper aria-hidden="true" className="absolute inset-0 m-auto size-5 text-stone-400" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-stone-900 group-hover:underline group-hover:underline-offset-2">
                    {post.title}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500">
                    <PostStatusBadge status={post.status} />
                    <span>
                      {post.status === "published" && post.publishedAt
                        ? `Published ${formatDate(post.publishedAt)}`
                        : `Edited ${formatDate(post.updatedAt)}`}
                    </span>
                  </span>
                  {post.excerpt ? <span className="mt-1 hidden truncate text-sm text-stone-600 sm:block">{post.excerpt}</span> : null}
                </span>
              </Link>
              <div className="ml-auto max-sm:flex max-sm:w-full max-sm:justify-end max-sm:border-t max-sm:border-stone-100 max-sm:pt-1">
                <PostListActions
                  post={{ id: post.id, title: post.title, slug: post.slug, status: post.status }}
                  previewHref={`/preview/${site.activeTemplate}/post/${post.id}`}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
