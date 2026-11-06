"use client";

import { CircleAlert } from "lucide-react";
import { buttonPrimary, card } from "@/components/admin/ui";

export default function AdminError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className={`${card} flex flex-col items-center px-6 py-14 text-center`}>
      <span className="grid size-12 place-items-center rounded-2xl bg-stone-100 text-stone-500">
        <CircleAlert aria-hidden="true" className="size-6" />
      </span>
      <h1 className="mt-4 text-base font-semibold">This page could not load</h1>
      <p className="mt-1 max-w-sm text-sm text-stone-600">
        The server or the database did not answer. Your saved work is safe. Please try again in a moment.
      </p>
      <button type="button" onClick={() => retry()} className={`${buttonPrimary} mt-5`}>
        Try again
      </button>
    </div>
  );
}
