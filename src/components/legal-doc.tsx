import type { ReactNode } from "react";

/** Simple, readable shell for legal/policy pages (Terms, Privacy). */
export function LegalDoc({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="bg-atlas-light">
      <section className="relative overflow-hidden bg-atlas-navy text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_-10%,rgba(10,99,176,0.6),transparent_55%)]" />
        <div className="atlas-container relative py-12">
          <h1 className="text-3xl font-black sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm font-semibold text-sky-200">Last updated: {updated}</p>
        </div>
      </section>
      <div className="atlas-container py-10">
        <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-10">
          {children}
        </article>
      </div>
    </main>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="mt-7 first:mt-0">
      <h2 className="text-lg font-black text-atlas-navy">{heading}</h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">{children}</p>
    </section>
  );
}
