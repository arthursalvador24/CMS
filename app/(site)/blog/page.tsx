import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getSite } from "@/lib/cms/read";
import { readBlogPage } from "@/lib/templates/blog-page";
import { TEMPLATES } from "@/lib/templates/registry";
import { pageParam } from "@/lib/templates/utils";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  const title = site.companyName ? `Blog | ${site.companyName}` : "Blog";
  return { title, description: site.tagline || undefined, openGraph: { type: "website", title, siteName: site.companyName || undefined } };
}

export default function BlogPage({ searchParams }: PageProps<"/blog">) {
  return (
    <Suspense fallback={<p className="p-8">Loading…</p>}>
      <BlogIndexView searchParams={searchParams} />
    </Suspense>
  );
}

async function BlogIndexView({ searchParams }: Pick<PageProps<"/blog">, "searchParams">) {
  const [site, result] = await Promise.all([getSite(), readBlogPage(pageParam((await searchParams).page))]);
  if (!result) notFound();
  const { BlogIndex } = TEMPLATES[site.activeTemplate];
  return <BlogIndex data={{ site, ...result }} basePath="" />;
}
