import type { PostStatus } from "@/lib/cms/types";

export function PostStatusBadge({ status }: { status: PostStatus }) {
  return status === "published" ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-600" />
      Published
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700 ring-1 ring-stone-200">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-stone-400" />
      Draft
    </span>
  );
}

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium" });
export const formatDate = (iso: string | null) => (iso ? dateFormat.format(new Date(iso)) : "");
