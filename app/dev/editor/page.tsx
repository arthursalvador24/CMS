import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createPost } from "@/lib/cms/actions/posts";
import { getAdminPost, listAdminPosts } from "@/lib/cms/admin-posts";
import { getSite } from "@/lib/cms/read";
import { PostBench } from "./PostBench";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Dev-only test bench for the blog editor and post actions: /dev/editor and /dev/editor?id=<post id>. */
export default function DevEditorPage({ searchParams }: Props) {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-8">
      <Suspense fallback={<p>Loading...</p>}>
        <Bench searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function newPost() {
  "use server";
  const result = await createPost();
  if (!result.ok) throw new Error(result.error);
  redirect(`/dev/editor?id=${result.data.id}`);
}

async function Bench({ searchParams }: Props) {
  await requireAdmin();
  const { id } = await searchParams;
  if (typeof id === "string") {
    const [post, site] = await Promise.all([getAdminPost(id), getSite()]);
    if (!post) notFound();
    return <PostBench key={post.id} post={post} previewHref={`/preview/${site.activeTemplate}/post/${post.id}`} />;
  }

  const posts = await listAdminPosts();
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Editor test bench</h1>
        <form action={newPost}>
          <button type="submit" className="rounded-md bg-neutral-900 px-4 py-2 text-white">
            New post
          </button>
        </form>
      </div>
      <ul className="divide-y rounded-md border">
        {posts.map((post) => (
          <li key={post.id} className="flex items-center justify-between gap-2 p-3">
            <Link href={`/dev/editor?id=${post.id}`} className="underline">
              {post.title}
            </Link>
            <span className="text-sm text-neutral-500">{post.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
