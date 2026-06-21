"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw, ShoppingBasket } from "lucide-react";
import { Nav } from "@/components/nav";
import { StatusBadge } from "@/components/status-badge";
import { useAtlasStore } from "@/components/local-store";
import { DashboardHero } from "@/components/dashboard-hero";
import { CartToast } from "@/components/cart-toast";
import { getDocumentAlerts } from "@/lib/documents";
import { formatMoney } from "@/lib/pricing";
import { useI18n } from "@/lib/i18n";
import type { Product } from "@/lib/types";

export default function RetailerDashboardPage() {
  const { t } = useI18n();
  const { store, addToCart } = useAtlasStore();
  const [added, setAdded] = useState<string | null>(null);
  const favoriteProducts = store.products.filter((product) => store.favorites.includes(product.id));
  function addAndConfirm(product: Product) {
    addToCart(product);
    setAdded(product.brand);
  }
  const buyAgain = store.products.filter((product) => product.status === "approved").slice(0, 3);
  const documentAlerts = getDocumentAlerts(store.applications, "buyer");
  const buyerApplication = store.applications.find((application) => application.type === "buyer");
  const approvedDocs = buyerApplication?.documents.filter((document) => document.status === "approved").length ?? 0;
  const totalDocs = buyerApplication?.documents.length ?? 0;

  return (
    <>
      <Nav />
      <main className="atlas-container grid gap-6 py-8">
        <DashboardHero
          title={t("retailerDashboard")}
          subtitle={t("retailerDashboardBody")}
          action={
            <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-black text-atlas-navy transition hover:bg-sky-50" href="/catalog">
              <ShoppingBasket size={16} />
              {t("shopCatalog")}
            </Link>
          }
        />
        {documentAlerts.length > 0 && (
          <section className="panel p-5">
            <h2 className="text-xl font-black text-atlas-navy">{t("documentAlerts")}</h2>
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
              <h2 className="text-xl font-black text-atlas-navy">{t("verificationStatus")}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {approvedDocs} {t("ofWord")} {totalDocs} {t("buyerDocumentsApproved")}
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
              <h2 className="text-xl font-black">{t("orderRequests")}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[840px] text-left text-sm">
                <thead className="bg-atlas-light text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">{t("request")}</th>
                    <th className="px-5 py-3">{t("casesHeader")}</th>
                    <th className="px-5 py-3">{t("value")}</th>
                    <th className="px-5 py-3">{t("fulfillment")}</th>
                    <th className="px-5 py-3">{t("hubRoute")}</th>
                    <th className="px-5 py-3">{t("status")}</th>
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
                      <td className="px-5 py-4">{formatMoney(order.estimatedValue)}</td>
                      <td className="px-5 py-4">{order.fulfillmentType}</td>
                      <td className="px-5 py-4">{order.hubRouting ?? t("atlasRoutingReview")}</td>
                      <td className="px-5 py-4"><StatusBadge status={order.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <aside className="grid gap-4">
            <div className="panel p-5">
              <h2 className="text-xl font-black">{t("savedList")}</h2>
              <p className="mt-2 text-sm text-slate-600">{t("savedListBody")}</p>
              <div className="mt-4 grid gap-2 text-sm">
                {favoriteProducts.length === 0 ? (
                  <Link href="/catalog" className="flex items-center justify-between rounded-md bg-atlas-light p-3 font-semibold text-atlas-blue hover:bg-sky-50">
                    {t("savedListEmpty")}
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  favoriteProducts.map((product) => (
                    <button
                      key={product.id}
                      className="flex items-center justify-between rounded-md bg-atlas-light p-3 text-left font-semibold text-atlas-navy transition hover:bg-sky-50"
                      type="button"
                      onClick={() => addAndConfirm(product)}
                    >
                      <span className="min-w-0 truncate">{product.brand}</span>
                      <ShoppingBasket size={16} className="shrink-0 text-atlas-blue" />
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="panel p-5">
              <h2 className="text-xl font-black">{t("buyAgain")}</h2>
              <div className="mt-4 grid gap-3">
                {buyAgain.map((product) => (
                  <button key={product.id} className="btn-secondary justify-between" type="button" onClick={() => addAndConfirm(product)}>
                    {product.brand}
                    <RotateCcw size={16} />
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </main>
      <CartToast brand={added} onClose={() => setAdded(null)} />
    </>
  );
}
