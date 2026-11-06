import type { Metadata } from "next";
import { Suspense } from "react";
import { CarouselManager } from "@/components/admin/CarouselManager";
import { LoadingBlock, PageHeader } from "@/components/admin/PageHeader";
import { currentAdmin } from "@/components/admin/session";
import { getAdminSlides } from "@/lib/cms/admin-read";

export const metadata: Metadata = { title: "Carousel" };

export default function CarouselPage() {
  return (
    <>
      <PageHeader
        title="Carousel"
        description="The slides at the top of your homepage, shown in this order. Changes here save right away."
      />
      <Suspense fallback={<LoadingBlock className="h-80" />}>
        <Carousel />
      </Suspense>
    </>
  );
}

async function Carousel() {
  await currentAdmin();
  return <CarouselManager initialSlides={await getAdminSlides()} />;
}
