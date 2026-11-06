import { fixtureCase, fixtureSiteData } from "@/lib/cms/fixtures";
import { devTemplate } from "./fixture-route";

// Dev-only fixture page; blocking is fine here and gives real 404s.
export const instant = false;

/** /dev/<template>?case=full|empty|six|long */
export default async function DevHomePage({ params, searchParams }: PageProps<"/dev/[template]">) {
  const { tpl, basePath } = await devTemplate(params);
  const data = fixtureSiteData(fixtureCase((await searchParams).case));
  return <tpl.Home data={data} basePath={basePath} />;
}
