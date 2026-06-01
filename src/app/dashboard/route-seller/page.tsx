"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { MapPinned, PackageSearch, Route, TrendingUp } from "lucide-react";
import { Nav } from "@/components/nav";
import { StatusBadge } from "@/components/status-badge";
import { useAtlasStore } from "@/components/local-store";
import { getDocumentAlerts } from "@/lib/documents";

export default function RouteSellerDashboardPage() {
  const { store } = useAtlasStore();
  const routeSeller = store.routeSellers[0];
  const documentAlerts = getDocumentAlerts(store.applications, "route_seller");
  const routeApplication = store.applications.find((application) => application.type === "route_seller");
  const suggestedProducts = store.products.filter((product) => product.status === "approved").slice(0, 3);

  return (
    <>
      <Nav />
      <main className="atlas-container grid gap-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black text-atlas-navy">Route seller dashboard</h1>
            <p className="mt-1 text-slate-600">Territory, route stops, product opportunities, and sales progress.</p>
          </div>
          <Link className="btn-primary" href="/catalog">
            <PackageSearch size={16} />
            Browse catalog
          </Link>
        </div>
        <section className="grid gap-4 md:grid-cols-4">
          <Metric icon={<MapPinned />} label="Territory" value={routeSeller.territory} />
          <Metric icon={<Route />} label="Assigned hub" value={routeSeller.assignedHub} />
          <Metric icon={<TrendingUp />} label="Monthly sales" value={`$${routeSeller.monthlySales.toLocaleString()}`} />
          <Metric icon={<PackageSearch />} label="Active accounts" value={String(routeSeller.activeAccounts)} />
        </section>
        {documentAlerts.length > 0 && (
          <section className="panel p-5">
            <h2 className="text-xl font-black text-atlas-navy">Document alerts</h2>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {documentAlerts.map(({ document, expiration }) => (
                <div key={document.id} className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
                  <p className="font-bold text-atlas-navy">{document.label}</p>
                  <p className={expiration.tone === "danger" ? "font-semibold text-red-700" : "font-semibold text-amber-800"}>
                    {expiration.label}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
        <section className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="panel p-5">
            <h2 className="text-xl font-black text-atlas-navy">Route stops</h2>
            <div className="mt-4 grid gap-3">
              {routeSeller.routeStops.map((stop, index) => (
                <div key={stop} className="flex items-center gap-3 rounded-md bg-atlas-light p-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-atlas-blue text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <span className="font-semibold text-atlas-navy">{stop}</span>
                </div>
              ))}
            </div>
          </div>
          <aside className="grid gap-4">
            <div className="panel p-5">
              <h2 className="text-xl font-black text-atlas-navy">Approval status</h2>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-600">Program</span>
                <span className="font-black text-atlas-navy">{routeSeller.program}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-600">Status</span>
                <StatusBadge status={routeSeller.status} />
              </div>
              <div className="mt-3">
                <span className="text-sm font-semibold text-slate-600">Primary product lane</span>
                <p className="mt-1 font-black text-atlas-navy">{routeSeller.productLane}</p>
              </div>
            </div>
            {routeApplication && (
              <div className="panel p-5">
                <h2 className="text-xl font-black text-atlas-navy">Documents</h2>
                <div className="mt-3 grid gap-2">
                  {routeApplication.documents.map((document) => (
                    <div key={document.id} className="rounded-md bg-atlas-light p-3 text-sm">
                      <p className="font-bold text-atlas-navy">{document.label}</p>
                      <p className="text-slate-600">{document.fileName ?? "No file uploaded"}</p>
                      <StatusBadge status={document.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </section>
        <section className="panel overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-xl font-black text-atlas-navy">Products to pitch this week</h2>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-3">
            {suggestedProducts.map((product) => (
              <div key={product.id} className="rounded-lg border border-slate-200 p-4">
                <img alt={product.description} className="h-24 w-24 rounded-md object-cover" src={product.imageUrl} />
                <h3 className="mt-3 font-black text-atlas-navy">{product.brand}</h3>
                <p className="mt-1 text-sm text-slate-600">{product.description}</p>
                <p className="mt-2 text-sm font-bold text-atlas-blue">MOQ {product.moq} cases • {product.preferredHub}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="panel p-5">
      <div className="text-atlas-blue">{icon}</div>
      <p className="mt-3 text-lg font-black text-atlas-navy">{value}</p>
      <p className="text-sm font-semibold text-slate-600">{label}</p>
    </div>
  );
}
