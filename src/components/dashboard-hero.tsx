import type { ReactNode } from "react";

/** Shared marketplace-style page header for operational workspaces. */
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
    <section className="dashboard-hero overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="h-1 bg-atlas-red" />
      <div className="flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-atlas-red">Atlas Discount workspace</p>
          <h1 className="mt-2 text-2xl font-black text-atlas-navy sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{subtitle}</p>}
        </div>
        {action && <div className="dashboard-hero-action shrink-0">{action}</div>}
      </div>
    </section>
  );
}
