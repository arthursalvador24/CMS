"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { signIn, type SignInState } from "@/lib/auth/actions";

const input =
  "block h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-base text-stone-900 shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-stone-400 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/10 aria-invalid:border-red-600 aria-invalid:focus:ring-red-600/15";

/** Where to go after sign-in. signIn re-checks it; only /admin and /preview paths are followed. */
function NextInput() {
  return <input type="hidden" name="next" value={useSearchParams().get("next") ?? "/admin"} />;
}

export function LoginForm() {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(signIn, null);
  const emailError = state?.fieldErrors?.email;
  const passwordError = state?.fieldErrors?.password;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {/* Only this input is request-time, so the form itself is in the static shell. */}
      <Suspense fallback={<input type="hidden" name="next" value="/admin" />}>
        <NextInput />
      </Suspense>

      <div aria-live="polite" aria-atomic="true">
        {state?.error ? (
          <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{state.error}</span>
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-stone-800">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          required
          defaultValue={state?.email ?? ""}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "email-error" : undefined}
          className={input}
        />
        {emailError ? (
          <p id="email-error" className="text-sm text-red-700">
            {emailError}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-stone-800">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={passwordError ? true : undefined}
          aria-describedby={passwordError ? "password-error" : undefined}
          className={input}
        />
        {passwordError ? (
          <p id="password-error" className="text-sm text-red-700">
            {passwordError}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 text-base font-medium text-white transition-colors hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 disabled:cursor-wait disabled:bg-stone-700"
      >
        {pending ? (
          <>
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </button>
    </form>
  );
}
