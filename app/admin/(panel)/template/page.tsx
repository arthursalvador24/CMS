import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingBlock, PageHeader } from "@/components/admin/PageHeader";
import { currentAdmin } from "@/components/admin/session";
import { TemplatePicker } from "@/components/admin/TemplatePicker";
import { getAdminSite } from "@/lib/cms/admin-read";
import { TEMPLATE_KEYS } from "@/lib/cms/types";
import { TEMPLATES } from "@/lib/templates/registry";

export const metadata: Metadata = { title: "Template" };

export default function TemplatePage() {
  return (
    <>
      <PageHeader
        title="Template"
        description="Choose how your website looks. Each preview shows your real content, so what you see is what visitors get. You can switch back at any time."
      />
      <Suspense
        fallback={
          <div className="space-y-6">
            <LoadingBlock className="h-80" />
            <LoadingBlock className="h-80" />
          </div>
        }
      >
        <Picker />
      </Suspense>
    </>
  );
}

async function Picker() {
  await currentAdmin();
  const site = await getAdminSite();
  const templates = TEMPLATE_KEYS.map((key) => ({ key, name: TEMPLATES[key].name, description: TEMPLATES[key].description }));
  return <TemplatePicker templates={templates} initialActive={site.activeTemplate} />;
}
