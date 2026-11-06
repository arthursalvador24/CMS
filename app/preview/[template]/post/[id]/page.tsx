import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getSite, mapPost, type PostRow } from "@/lib/cms/read";
import { createClient } from "@/lib/supabase/server";
import { previewTemplate } from "../../../preview";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Any post by id, drafts included: the admin blog editor's "Preview" button opens this. */
export default function PreviewPostByIdPage({ params }: PageProps<"/preview/[template]/post/[id]">) {
  return (
    <Suspense fallback={<p className="p-8">Loading preview…</p>}>
      <PreviewPostById params={params} />
    </Suspense>
  );
}

async function PreviewPostById({ params }: Pick<PageProps<"/preview/[template]/post/[id]">, "params">) {
  const { tpl, basePath } = await previewTemplate(params);
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  // Cookie-aware client: the admin's session lets the database rules return drafts.
  const supabase = await createClient();
  const [site, { data, error }] = await Promise.all([
    getSite(),
    supabase.from("posts").select("*").eq("id", id).maybeSingle(),
  ]);
  if (error) throw new Error(`Could not load post: ${error.message}`);
  if (!data) notFound();
  return <tpl.BlogPost data={{ site, post: mapPost(data as PostRow), prev: null, next: null }} basePath={basePath} />;
}
