import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-balance text-stone-900">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm text-pretty text-stone-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/** Settings-style section: title and help on the left (desktop), fields on the right. */
export function FormSection({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-stone-200 py-8 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-10">
      <div>
        <h2 className="text-base font-semibold text-stone-900">{title}</h2>
        {description ? <p className="mt-1 text-sm text-pretty text-stone-500">{description}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** Pulsing placeholder blocks for Suspense fallbacks. */
export function LoadingBlock({ className = "h-40" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-2xl bg-stone-200/60 motion-reduce:animate-none ${className}`} />;
}
