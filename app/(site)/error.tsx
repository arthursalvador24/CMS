"use client";

import Link from "next/link";

// Plain on purpose: it must work whatever template is active, so it uses no template components.
export default function SiteError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-5 py-16">
      <h1 className="text-3xl font-bold">This page could not load</h1>
      <p className="mt-4 text-slate-600">Something went wrong on our side. Please try again in a moment.</p>
      <p className="mt-8 flex flex-wrap items-center gap-6 font-medium">
        <button type="button" onClick={() => retry()} className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-700">
          Try again
        </button>
        <Link href="/" className="underline underline-offset-2">
          Home
        </Link>
      </p>
    </main>
  );
}
