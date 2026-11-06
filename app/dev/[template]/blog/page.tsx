import { notFound } from "next/navigation";
import { fixtureBlogIndex, fixtureCase } from "@/lib/cms/fixtures";
import { pageParam, POSTS_PER_PAGE } from "@/lib/templates/utils";
import { devTemplate } from "../fixture-route";

export const instant = false;

/** /dev/<template>/blog?case=full|empty|six|long&page=2 (the "six" case has 12 posts, so two pages). */
export default async function DevBlogPage({ params, searchParams }: PageProps<"/dev/[template]/blog">) {
  const { tpl, basePath } = await devTemplate(params);
  const query = await searchParams;
  const data = fixtureBlogIndex(fixtureCase(query.case), pageParam(query.page), POSTS_PER_PAGE);
  if (!data) notFound();
  return <tpl.BlogIndex data={data} basePath={basePath} />;
}
