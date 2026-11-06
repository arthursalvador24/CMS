import { getSite } from "@/lib/cms/read";

// Placeholder until step 6 adds the template routes in app/(site).
export default async function Home() {
  const site = await getSite();
  return (
    <main className="p-10">
      <h1 className="text-3xl font-semibold">{site.companyName}</h1>
      <p className="mt-2">{site.tagline}</p>
      <p className="mt-6 text-sm">Active template: {site.activeTemplate}</p>
    </main>
  );
}
