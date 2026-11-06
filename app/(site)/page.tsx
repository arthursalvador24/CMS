import type { Metadata } from "next";
import { getActiveSlides, getSite, getSiteData } from "@/lib/cms/read";
import { TEMPLATES } from "@/lib/templates/registry";

export async function generateMetadata(): Promise<Metadata> {
  const [site, slides] = await Promise.all([getSite(), getActiveSlides()]);
  const image = slides[0]?.imageUrl || site.logoUrl;
  return {
    title: site.companyName || undefined,
    description: site.tagline || undefined,
    openGraph: {
      type: "website",
      siteName: site.companyName || undefined,
      title: site.companyName || undefined,
      description: site.tagline || undefined,
      images: image ? [image] : undefined,
    },
  };
}

export default async function HomePage() {
  const data = await getSiteData();
  const { Home } = TEMPLATES[data.site.activeTemplate];
  return <Home data={data} basePath="" />;
}
