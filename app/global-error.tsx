"use client";

import "./globals.css";

// Replaces the root layout when it fails, so it brings its own <html>, <body> and styles.
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-dvh bg-white font-sans text-slate-900">
        <title>Something went wrong</title>
        <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-5 py-16">
          <h1 className="text-3xl font-bold">Something went wrong</h1>
          <p className="mt-4 text-slate-600">The site could not load right now. Please try again in a moment.</p>
          <p className="mt-8">
            <button type="button" onClick={() => retry()} className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700">
              Try again
            </button>
          </p>
        </main>
      </body>
    </html>
  );
}
