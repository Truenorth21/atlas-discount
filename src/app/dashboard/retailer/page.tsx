"use client";

import Link from "next/link";
import { RotateCcw, ShoppingBasket } from "lucide-react";
import { Nav } from "@/components/nav";
import { StatusBadge } from "@/components/status-badge";
import { useAtlasStore } from "@/components/local-store";
import { getDocumentAlerts } from "@/lib/documents";

export default function RetailerDashboardPage() {
  const { store, addToCart } = useAtlasStore();
  const buyAgain = store.products.filter((product) => product.status === "approved").slice(0, 3);
  const documentAlerts = getDocumentAlerts(store.applications, "buyer");
  const buyerApplication = store.applications.find((application) => application.type === "buyer");
  const approvedDocs = buyerApplication?.documents.filter((document) => document.status === "approved").length ?? 0;
  const totalDocs = buyerApplication?.documents.length ?? 0;

  return (
    <>
      <Nav />
      <main className="atlas-container grid gap-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black text-atlas-navy">Retailer dashboard</h1>
            <p className="mt-1 text-slate-600">Order history, saved lists, buy again, and quote status.</p>
          </div>
          <Link className="btn-primary" href="/catalog">
            <ShoppingBasket size={16} />
            Shop catalog
          </Link>
        </div>
        {documentAlerts.length > 0 && (
          <section className="panel p-5">
            <h2 className="text-xl font-black text-atlas-navy">Document alerts</h2>
            <div className="mt-3 grid gap-2">
              {documentAlerts.map(({ document, expiration }) => (
                <div key={document.id} className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
                  <p className="font-bold text-atlas-navy">{document.label}</p>
                  <p className={expiration.tone === "danger" ? "text-red-700 font-semibold" : "text-amber-800 font-semibold"}>
                    {expiration.label}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
        <section className="panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-atlas-navy">Verification status</h2>
              <p className="mt-1 text-sm text-slate-600">
                {approvedDocs} of {totalDocs} buyer documents approved
              </p>
            </div>
            <StatusBadge status={approvedDocs === totalDocs && totalDocs > 0 ? "approved" : "pending"} />
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-3">
            {buyerApplication?.documents.map((document) => (
              <div key={document.id} className="rounded-md bg-atlas-light p-3 text-sm">
                <p className="font-bold text-atlas-navy">{document.label}</p>
                <StatusBadge status={document.status} />
              </div>
            ))}
          </div>
        </section>
        <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="panel overflow-hidden">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-xl font-black">Order requests</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[840px] text-left text-sm">
                <thead className="bg-atlas-light text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Request</th>
                    <th className="px-5 py-3">Cases</th>
                    <th className="px-5 py-3">Value</th>
                    <th className="px-5 py-3">Fulfillment</th>
                    <th className="px-5 py-3">Hub route</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {store.orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-5 py-4 font-bold">
                        <Link className="text-atlas-blue underline" href={`/quotes/${order.id}`}>
                          {order.id}
                        </Link>
                      </td>
                      <td className="px-5 py-4">{order.totalCases}</td>
                      <td className="px-5 py-4">${order.estimatedValue.toFixed(2)}</td>
                      <td className="px-5 py-4">{order.fulfillmentType}</td>
                      <td className="px-5 py-4">{order.hubRouting ?? "Atlas routing review"}</td>
                      <td className="px-5 py-4"><StatusBadge status={order.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <aside className="grid gap-4">
            <div className="panel p-5">
              <h2 className="text-xl font-black">Saved list</h2>
              <p className="mt-2 text-sm text-slate-600">Store replenishment staples</p>
              <div className="mt-4 grid gap-2 text-sm">
                <span className="rounded-md bg-atlas-light p-3 font-semibold">Weekly cleaning supply restock</span>
                <span className="rounded-md bg-atlas-light p-3 font-semibold">Pantry margin builders</span>
              </div>
            </div>
            <div className="panel p-5">
              <h2 className="text-xl font-black">Buy again</h2>
              <div className="mt-4 grid gap-3">
                {buyAgain.map((product) => (
                  <button key={product.id} className="btn-secondary justify-between" type="button" onClick={() => addToCart(product)}>
                    {product.brand}
                    <RotateCcw size={16} />
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </main>
    </>
  );
}
