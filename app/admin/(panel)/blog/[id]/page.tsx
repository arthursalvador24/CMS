import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LoadingBlock } from "@/components/admin/PageHeader";
import { PostEditor } from "@/components/admin/PostEditor";
import { currentAdmin } from "@/components/admin/session";
import { getAdminPost } from "@/lib/cms/admin-posts";
import { getAdminSite } from "@/lib/cms/admin-read";

export const metadata: Metadata = { title: "Edit post" };

export default function EditPostPage({ params }: PageProps<"/admin/blog/[id]">) {
  return (
    <>
      <h1 className="sr-only">Edit post</h1>
      <Suspense
        fallback={
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <LoadingBlock className="h-[32rem]" />
            <LoadingBlock className="h-64" />
          </div>
        }
      >
        <Editor params={params} />
      </Suspense>
    </>
  );
}

async function Editor({ params }: Pick<PageProps<"/admin/blog/[id]">, "params">) {
  await currentAdmin();
  const { id } = await params;
  const [post, site] = await Promise.all([getAdminPost(id), getAdminSite()]);
  if (!post) notFound();
  return <PostEditor key={post.id} post={post} activeTemplate={site.activeTemplate} />;
}
