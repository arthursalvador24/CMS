import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getSite } from "@/lib/cms/read";
import { readBlogPage } from "@/lib/templates/blog-page";
import { pageParam } from "@/lib/templates/utils";
import { previewTemplate } from "../../preview";

export default function PreviewBlogPage(props: PageProps<"/preview/[template]/blog">) {
  return (
    <Suspense fallback={<p className="p-8">Loading preview…</p>}>
      <PreviewBlog {...props} />
    </Suspense>
  );
}

async function PreviewBlog({ params, searchParams }: PageProps<"/preview/[template]/blog">) {
  const { tpl, basePath } = await previewTemplate(params);
  const [site, result] = await Promise.all([getSite(), readBlogPage(pageParam((await searchParams).page))]);
  if (!result) notFound();
  return <tpl.BlogIndex data={{ site, ...result }} basePath={basePath} />;
}
