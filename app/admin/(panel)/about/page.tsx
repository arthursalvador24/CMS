import type { Metadata } from "next";
import { Suspense } from "react";
import { AboutForm } from "@/components/admin/AboutForm";
import { LoadingBlock, PageHeader } from "@/components/admin/PageHeader";
import { currentAdmin } from "@/components/admin/session";
import { getAdminSite } from "@/lib/cms/admin-read";

export const metadata: Metadata = { title: "About & Mission" };

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="About & Mission"
        description="The story sections of your homepage, in plain text. The template sets the fonts and layout, and an empty section is hidden."
      />
      <Suspense fallback={<LoadingBlock className="h-96" />}>
        <About />
      </Suspense>
    </>
  );
}

async function About() {
  await currentAdmin();
  return <AboutForm site={await getAdminSite()} />;
}
