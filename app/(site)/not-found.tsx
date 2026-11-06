import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-5 py-16">
      <p className="text-sm font-medium text-slate-500">404</p>
      <h1 className="mt-2 text-3xl font-bold">Page not found</h1>
      <p className="mt-4 text-slate-600">The page you are looking for does not exist or is no longer available.</p>
      <p className="mt-8 flex gap-6 font-medium">
        <Link href="/" className="underline underline-offset-2">
          Home
        </Link>
        <Link href="/blog" className="underline underline-offset-2">
          Blog
        </Link>
      </p>
    </main>
  );
}
