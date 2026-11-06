import { notFound } from "next/navigation";
import { fixtureBlogPost, fixtureCase } from "@/lib/cms/fixtures";
import { devTemplate } from "../../fixture-route";

export const instant = false;

/** /dev/<template>/blog/every-editor-feature (optionally ?case=long or ?case=six). */
export default async function DevPostPage({ params, searchParams }: PageProps<"/dev/[template]/blog/[slug]">) {
  const { tpl, basePath } = await devTemplate(params);
  const { slug } = await params;
  const data = fixtureBlogPost(fixtureCase((await searchParams).case), slug);
  if (!data) notFound();
  return <tpl.BlogPost data={data} basePath={basePath} />;
}
