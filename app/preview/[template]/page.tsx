import { Suspense } from "react";
import { getSiteData } from "@/lib/cms/read";
import { previewTemplate } from "../preview";

export default function PreviewHomePage({ params }: PageProps<"/preview/[template]">) {
  return (
    <Suspense fallback={<p className="p-8">Loading preview…</p>}>
      <PreviewHome params={params} />
    </Suspense>
  );
}

async function PreviewHome({ params }: Pick<PageProps<"/preview/[template]">, "params">) {
  const { tpl, basePath } = await previewTemplate(params);
  return <tpl.Home data={await getSiteData()} basePath={basePath} />;
}
