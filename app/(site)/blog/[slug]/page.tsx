import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedPost, getSite } from "@/lib/cms/read";
import { TEMPLATES } from "@/lib/templates/registry";

// Blocking on purpose: the post is read before anything streams, so an unknown or draft slug gets a real 404 status.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [site, found] = await Promise.all([getSite(), getPublishedPost(slug)]);
  if (!found) return {};
  const { post } = found;
  const title = site.companyName ? `${post.title} | ${site.companyName}` : post.title;
  return {
    title,
    description: post.excerpt || undefined,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt || undefined,
      siteName: site.companyName || undefined,
      publishedTime: post.publishedAt ?? undefined,
      images: post.coverUrl ? [post.coverUrl] : undefined,
    },
  };
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const [site, found] = await Promise.all([getSite(), getPublishedPost(slug)]);
  if (!found) notFound();
  const { BlogPost } = TEMPLATES[site.activeTemplate];
  return <BlogPost data={{ site, ...found }} basePath="" />;
}
