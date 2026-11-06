import { getSite } from "@/lib/cms/read";

/** Logo (or first letter) + company name + "Website admin". Cached site read, so it sits in the static shell. */
export async function Brand() {
  const site = await getSite();
  return <BrandText name={site.companyName} logoUrl={site.logoUrl} />;
}

export function BrandText({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- tiny admin logo, any aspect ratio
          <img src={logoUrl} alt="" className="size-full object-contain p-0.5" />
        ) : (
          <span aria-hidden="true" className="text-sm font-semibold text-stone-500">
            {name.charAt(0)}
          </span>
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-stone-900">{name}</span>
        <span className="block text-xs text-stone-500">Website admin</span>
      </span>
    </div>
  );
}
