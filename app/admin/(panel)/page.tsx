import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Building2, ExternalLink, FileText, GalleryHorizontal, Newspaper } from "lucide-react";
import { LoadingBlock, PageHeader } from "@/components/admin/PageHeader";
import { currentAdmin } from "@/components/admin/session";
import { buttonPrimary, buttonSecondary, card, focusRing } from "@/components/admin/ui";
import { listAdminPosts } from "@/lib/cms/admin-posts";
import { getAdminSite, getAdminSlides } from "@/lib/cms/admin-read";
import { TEMPLATES } from "@/lib/templates/registry";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Everything on your website in one place. Changes go live as soon as you save." />
      <Suspense
        fallback={
          <div className="space-y-6">
            <LoadingBlock className="h-44" />
            <LoadingBlock className="h-72" />
          </div>
        }
      >
        <Dashboard />
      </Suspense>
    </>
  );
}

const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

async function Dashboard() {
  await currentAdmin();
  const [site, slides, posts] = await Promise.all([getAdminSite(), getAdminSlides(), listAdminPosts()]);
  const template = TEMPLATES[site.activeTemplate];
  const shown = slides.filter((s) => s.isActive).length;
  const published = posts.filter((p) => p.status === "published").length;
  const drafts = posts.length - published;
  const emptyStory = [
    !site.about && "About",
    !site.mission && "Mission",
    !site.vision && "Vision",
  ].filter(Boolean) as string[];

  const rows = [
    {
      href: "/admin/company",
      icon: Building2,
      title: "Company details",
      summary: [site.companyName, site.email, site.phone].filter(Boolean).join(" · "),
      note: site.logoUrl ? "Logo set" : "No logo yet",
    },
    {
      href: "/admin/about",
      icon: FileText,
      title: "About, Mission and Vision",
      summary: site.about ? firstLine(site.about) : "No About text yet",
      note: emptyStory.length ? `${emptyStory.join(", ")} empty` : "All three written",
    },
    {
      href: "/admin/carousel",
      icon: GalleryHorizontal,
      title: "Homepage carousel",
      summary: slides.length ? `${count(slides.length, "slide")}, ${shown} shown on the site` : "No slides. The homepage shows a still hero.",
      note: slides.length && shown < slides.length ? `${slides.length - shown} hidden` : null,
    },
    {
      href: "/admin/blog",
      icon: Newspaper,
      title: "Blog",
      summary: posts.length ? `${count(published, "published post")}, ${count(drafts, "draft")}` : "No posts yet",
      note: posts[0] ? `Last edited: ${posts[0].title}` : null,
    },
  ];

  return (
    <div className="space-y-8">
      <section aria-labelledby="active-template" className={`${card} p-5 sm:p-6`}>
        <p className="text-sm text-stone-500">Live template</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            <h2 id="active-template" className="text-xl font-semibold tracking-tight">
              {template.name}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-pretty text-stone-600">{template.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/" target="_blank" rel="noreferrer" className={buttonSecondary}>
              <ExternalLink aria-hidden="true" className="size-4" />
              View live site
              <span className="sr-only">(opens in a new tab)</span>
            </a>
            <Link href="/admin/template" className={buttonPrimary}>
              Change template
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="content-heading">
        <h2 id="content-heading" className="mb-3 text-base font-semibold">
          Website content
        </h2>
        <ul className={`${card} divide-y divide-stone-200 overflow-hidden`}>
          {rows.map(({ href, icon: Icon, title, summary, note }) => (
            <li key={href}>
              <Link
                href={href}
                className={`group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-stone-50 sm:px-5 ${focusRing} focus-visible:-outline-offset-2`}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-stone-100 text-stone-600">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-stone-900">{title}</span>
                  <span className="mt-0.5 block truncate text-sm text-stone-600">{summary}</span>
                  {note ? <span className="mt-0.5 block truncate text-xs text-stone-500">{note}</span> : null}
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:text-stone-700 motion-reduce:transition-none"
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function firstLine(text: string) {
  return text.split("\n").find((line) => line.trim()) ?? "";
}
