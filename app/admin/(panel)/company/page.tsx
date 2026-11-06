import type { Metadata } from "next";
import { Suspense } from "react";
import { CompanyForm } from "@/components/admin/CompanyForm";
import { LogoField } from "@/components/admin/LogoField";
import { FormSection, LoadingBlock, PageHeader } from "@/components/admin/PageHeader";
import { currentAdmin } from "@/components/admin/session";
import { getAdminSite } from "@/lib/cms/admin-read";

export const metadata: Metadata = { title: "Company" };

export default function CompanyPage() {
  return (
    <>
      <PageHeader
        title="Company"
        description="Your logo, name, contact details and social links. Every template shows them in the header, contact section and footer."
      />
      <Suspense fallback={<LoadingBlock className="h-96" />}>
        <Company />
      </Suspense>
    </>
  );
}

async function Company() {
  await currentAdmin();
  const site = await getAdminSite();
  return (
    <>
      <FormSection title="Logo" description="Shown in the header of every page.">
        <LogoField initialUrl={site.logoUrl} />
      </FormSection>
      <CompanyForm site={site} />
    </>
  );
}
