import type { Metadata } from "next";
import { Suspense } from "react";
import { Brand, BrandText } from "@/components/admin/Brand";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-stone-50 px-4 py-12 font-[family-name:var(--font-ed-inter)] text-stone-900">
      <div className="w-full max-w-[400px]">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-7">
            <div className="mb-6">
              <Suspense fallback={<BrandText name="Website admin" />}>
                <Brand />
              </Suspense>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-1.5 text-sm text-stone-600">Use your admin email and password to manage the website.</p>
          </div>
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-sm text-stone-500">Admins only. Ask the site owner if you need access.</p>
      </div>
    </main>
  );
}
