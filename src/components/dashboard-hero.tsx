import type { ReactNode } from "react";

/** Modern gradient page header used across dashboards and the catalog. */
export function DashboardHero({
  title,
  subtitle,
  action
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-atlas-navy text-white shadow-panel">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_-40%,rgba(10,99,176,0.7),transparent_55%),radial-gradient(circle_at_100%_120%,rgba(10,99,176,0.35),transparent_50%)]" />
      <div className="relative flex flex-wrap items-center justify-between gap-4 p-6 sm:p-8">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-sm text-sky-100/90">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </section>
  );
}
