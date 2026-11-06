import { notFound } from "next/navigation";
import { getTemplate } from "@/lib/templates/registry";

/** Fixture pages exist only in development; unknown template keys 404. */
export async function devTemplate(params: Promise<{ template: string }>) {
  if (process.env.NODE_ENV === "production") notFound();
  const { template } = await params;
  const tpl = getTemplate(template);
  if (!tpl) notFound();
  return { tpl, basePath: `/dev/${tpl.key}` };
}
