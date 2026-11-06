import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPublishedPost, getSite } from "@/lib/cms/read";
import { previewTemplate } from "../../../preview";

export default function PreviewPostPage({ params }: PageProps<"/preview/[template]/blog/[slug]">) {
  return (
    <Suspense fallback={<p className="p-8">Loading preview…</p>}>
      <PreviewPost params={params} />
    </Suspense>
  );
}

async function PreviewPost({ params }: Pick<PageProps<"/preview/[template]/blog/[slug]">, "params">) {
  const { tpl, basePath } = await previewTemplate(params);
  const { slug } = await params;
  const [site, found] = await Promise.all([getSite(), getPublishedPost(slug)]);
  if (!found) notFound();
  return <tpl.BlogPost data={{ site, ...found }} basePath={basePath} />;
}
