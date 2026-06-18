"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BadgeCheck, FileText, MapPinned, PackageSearch, Repeat2, Route, ShoppingCart, Sparkles, TrendingUp, Trophy } from "lucide-react";
import { Nav } from "@/components/nav";
import { ProductImage } from "@/components/product-image";
import { StatusBadge } from "@/components/status-badge";
import { useAtlasStore } from "@/components/local-store";
import { DashboardHero } from "@/components/dashboard-hero";
import { getDocumentAlerts } from "@/lib/documents";
import { useI18n } from "@/lib/i18n";

export default function RouteSellerDashboardPage() {
  const { t } = useI18n();
  const { store, addToCart } = useAtlasStore();
  const routeSeller = store.routeSellers[0];
  const commissionPct = store.pricingSettings.routeSellerCommissionPercent ?? 10;
  const estMonthlyCommission = Math.round((routeSeller.monthlySales * commissionPct) / 100);
  const documentAlerts = getDocumentAlerts(store.applications, "route_seller");
  const routeApplication = store.applications.find((application) => application.type === "route_seller");
  const approvedProducts = store.products.filter((product) => product.status === "approved");
  const suggestedProducts = approvedProducts.slice(0, 3);
  const routeStaples = approvedProducts.slice(0, 4);
  const promoted = approvedProducts.find((product) => product.promotion);
  const leaderboard = [...store.routeSellers].sort((a, b) => b.monthlySales - a.monthlySales);
  const insights = [
    ...(promoted ? [`${promoted.brand} ${t("insightRestockSuffix")}`] : []),
    t("insightReorder"),
    t("insightTerms")
  ];

  return (
    <>
      <Nav />
      <main className="atlas-container grid gap-6 py-8">
        <DashboardHero
          title={t("routeSellerDashboard")}
          subtitle={t("routeSellerDashboardBody")}
          action={
            <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-black text-atlas-navy transition hover:bg-sky-50" href="/catalog">
              <PackageSearch size={16} />
              {t("browseCatalog")}
            </Link>
          }
        />
        <section className="grid gap-4 md:grid-cols-4">
          <Metric icon={<MapPinned />} label={t("territory")} value={routeSeller.territory} />
          <Metric icon={<Route />} label={t("assignedHub")} value={routeSeller.assignedHub} />
          <Metric icon={<TrendingUp />} label={t("monthlySales")} value={`$${routeSeller.monthlySales.toLocaleString()}`} />
          <Metric icon={<PackageSearch />} label={t("activeAccounts")} value={String(routeSeller.activeAccounts)} />
        </section>
        <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-atlas-navy">{t("repToolsTitle")}</h2>
                <p className="mt-1 text-sm text-slate-600">{t("repToolsBody")}</p>
              </div>
              <span className="badge bg-emerald-50 text-emerald-700">{t("termsLabel")}: {t("termsNet7")}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link className="btn-primary" href="/dashboard/route-seller/deal-sheet">
                <FileText size={16} />
                {t("createDealSheet")}
              </Link>
              <Link className="btn-secondary" href="/playbooks">
                <BadgeCheck size={16} />
                {t("routePlaybook")}
              </Link>
            </div>
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="flex flex-wrap items-baseline gap-2 text-sm font-black text-atlas-navy">
                <span>{t("repCommissionTitle")}:</span>
                <span className="text-lg">{commissionPct}%</span>
                <span className="font-semibold text-slate-600">{t("repCommissionRateLabel")}</span>
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {t("repCommissionEstLabel")}: <span className="font-black text-atlas-navy">${estMonthlyCommission.toLocaleString()}</span>{" "}
                <span className="text-slate-500">({commissionPct}% × ${routeSeller.monthlySales.toLocaleString()})</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">{t("repCommissionNote")}</p>
            </div>
            <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-4">
              <p className="flex flex-wrap items-center gap-2 text-sm font-black text-atlas-navy">
                <Sparkles size={16} className="text-atlas-blue" />
                {t("repAssistant")}
                <span className="badge bg-white text-atlas-blue">{t("betaLabel")}</span>
              </p>
              <ul className="mt-3 grid gap-2 text-sm text-slate-700">
                {insights.map((insight, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-atlas-blue">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="panel p-5">
            <h2 className="flex items-center gap-2 text-xl font-black text-atlas-navy">
              <Trophy size={18} className="text-amber-500" />
              {t("leaderboardTitle")}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{t("leaderboardBody")}</p>
            <div className="mt-4 grid gap-2">
              {leaderboard.map((seller, index) => {
                const isYou = seller.id === routeSeller.id;
                return (
                  <div key={seller.id} className={`flex items-center gap-3 rounded-md p-3 ${isYou ? "bg-sky-50" : "bg-atlas-light"}`}>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-atlas-navy text-xs font-black text-white">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-atlas-navy">{seller.name}{isYou ? ` (${t("youLabel")})` : ""}</p>
                      <p className="text-xs text-slate-600">{seller.activeAccounts} {t("accountsLabel")} • {seller.territory}</p>
                    </div>
                    <span className="text-sm font-black text-atlas-blue">${seller.monthlySales.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        <section className="panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-atlas-navy">{t("quickReorder")}</h2>
              <p className="mt-1 text-sm text-slate-600">{t("quickReorderBody")}</p>
            </div>
            <Link className="btn-secondary" href="/catalog">
              <ShoppingCart size={16} />
              {t("catalog")}
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {routeStaples.map((product) => (
              <div key={product.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center gap-3">
                  <ProductImage product={product} className="h-12 w-12 shrink-0 rounded-md border border-slate-200" iconSize={20} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-atlas-navy">{product.brand}</p>
                    <p className="truncate text-xs text-slate-600">{product.preferredHub}</p>
                  </div>
                </div>
                <button className="btn-primary mt-3 w-full" type="button" onClick={() => addToCart(product)}>
                  <Repeat2 size={15} />
                  {t("addToCartLabel")}
                </button>
              </div>
            ))}
          </div>
        </section>
        {documentAlerts.length > 0 && (
          <section className="panel p-5">
            <h2 className="text-xl font-black text-atlas-navy">{t("documentAlerts")}</h2>
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
            <h2 className="text-xl font-black text-atlas-navy">{t("routeStops")}</h2>
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
              <h2 className="text-xl font-black text-atlas-navy">{t("approvalStatus")}</h2>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-600">{t("program")}</span>
                <span className="font-black text-atlas-navy">{routeSeller.program}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-600">{t("status")}</span>
                <StatusBadge status={routeSeller.status} />
              </div>
              <div className="mt-3">
                <span className="text-sm font-semibold text-slate-600">{t("primaryProductLane")}</span>
                <p className="mt-1 font-black text-atlas-navy">{routeSeller.productLane}</p>
              </div>
            </div>
            {routeApplication && (
              <div className="panel p-5">
                <h2 className="text-xl font-black text-atlas-navy">{t("documents")}</h2>
                <div className="mt-3 grid gap-2">
                  {routeApplication.documents.map((document) => (
                    <div key={document.id} className="rounded-md bg-atlas-light p-3 text-sm">
                      <p className="font-bold text-atlas-navy">{document.label}</p>
                      <p className="text-slate-600">{document.fileName ?? t("noFileUploaded")}</p>
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
            <h2 className="text-xl font-black text-atlas-navy">{t("productsToPitch")}</h2>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-3">
            {suggestedProducts.map((product) => (
              <div key={product.id} className="rounded-lg border border-slate-200 p-4">
                <ProductImage product={product} className="h-24 w-24 rounded-md" iconSize={34} />
                <h3 className="mt-3 font-black text-atlas-navy">{product.brand}</h3>
                <p className="mt-1 text-sm text-slate-600">{product.description}</p>
                <p className="mt-2 text-sm font-bold text-atlas-blue">{t("moqShort")} {product.moq} {t("cases")} • {product.preferredHub}</p>
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
