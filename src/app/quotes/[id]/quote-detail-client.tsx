"use client";

import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { Nav } from "@/components/nav";
import { ProductImage } from "@/components/product-image";
import { StatusBadge } from "@/components/status-badge";
import { useAtlasStore } from "@/components/local-store";
import { calculateLinePricing, calculateQuoteFinancials, formatMoney } from "@/lib/pricing";
import { planOrderPallets } from "@/lib/pallets";
import { useI18n } from "@/lib/i18n";

export function QuoteDetailClient({ id }: { id: string }) {
  const { t } = useI18n();
  const { store } = useAtlasStore();
  const order = store.orders.find((item) => item.id === id);
  const adjustment = store.quoteAdjustments.find((item) => item.orderId === id);

  if (!order) {
    return (
      <>
        <Nav />
        <main className="atlas-container py-8">
          <div className="panel p-6">
            <h1 className="text-2xl font-black text-atlas-navy">{t("quoteNotFound")}</h1>
            <Link className="btn-primary mt-5" href="/dashboard/retailer">
              <ArrowLeft size={16} />
              {t("backToDashboard")}
            </Link>
          </div>
        </main>
      </>
    );
  }

  const financials = calculateQuoteFinancials(order, store.pricingSettings, adjustment);
  const palletPlan = planOrderPallets(order.lineItems ?? [], { maxPalletWeightLb: store.pricingSettings.maxPalletWeightLb });

  return (
    <>
      <Nav />
      <main className="atlas-container grid gap-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-atlas-blue" href="/dashboard/retailer">
              <ArrowLeft size={16} />
              {t("backToDashboard")}
            </Link>
            <h1 className="text-3xl font-black text-atlas-navy">{order.id}</h1>
            <p className="mt-1 text-slate-600">{t("quoteDetailBody")}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <section className="grid gap-4 md:grid-cols-4">
          <Metric label={t("buyer")} value={order.buyer} />
          <Metric label={t("region")} value={order.buyerRegion ?? t("routingReview")} />
          <Metric label={t("casesHeader")} value={String(order.totalCases)} />
          <Metric label={t("estimatedProfit")} value={formatMoney(financials.estimatedProfit)} />
        </section>
        <section className="panel p-5">
          <h2 className="text-xl font-black text-atlas-navy">{t("adminQuoteEconomics")}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <FinancialCard label={t("buyerSellValue")} value={formatMoney(financials.productRevenue)} />
            <FinancialCard label={t("supplierCost")} value={formatMoney(financials.supplierCost)} />
            <FinancialCard label={t("productMargin")} value={formatMoney(financials.productMargin)} />
            <FinancialCard label={t("supplierDirectCasesLabel")} value={String(financials.supplierDirectCases)} />
            <FinancialCard label={t("fullPalletCases")} value={String(financials.palletCases)} />
            <FinancialCard label={t("looseCasesLabel")} value={String(financials.looseCases)} />
            <FinancialCard label={t("fulfillmentCharged")} value={formatMoney(financials.fulfillmentFee)} />
            <FinancialCard label={t("orderDiscount")} value={formatMoney(financials.orderDiscount)} />
            <FinancialCard label={t("buyerQuoteTotal")} value={formatMoney(financials.buyerTotal)} emphasis />
            <FinancialCard label={t("estimatedFulfillmentCost")} value={formatMoney(financials.fulfillmentCost)} />
            <FinancialCard label={t("routeSellerCommission")} value={formatMoney(financials.routeSellerCommission)} />
            <FinancialCard label={t("estimatedAtlasProfit")} value={formatMoney(financials.estimatedProfit)} />
            <FinancialCard label={t("profitMargin")} value={`${financials.marginPercent.toFixed(1)}%`} />
            <FinancialCard label={t("suggestedFulfillment")} value={financials.recommendedFulfillmentType} />
          </div>
        </section>
        <section className="panel p-5">
          <h2 className="flex items-center gap-2 text-xl font-black text-atlas-navy">
            <MapPin className="text-atlas-blue" />
            {t("fulfillmentRoute")}
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-md bg-atlas-light p-3">
              <p className="text-xs font-bold uppercase text-slate-500">{t("requestedFulfillment")}</p>
              <p className="mt-1 font-black text-atlas-navy">
                {order.fulfillmentType === "Supplier direct" ? t("supplierDirectFulfillment") : order.fulfillmentType}
              </p>
              {order.fulfillmentType === "Supplier direct" && (
                <p className="mt-1 text-sm font-semibold text-atlas-blue">{t("atlasOwnsBuyer")}</p>
              )}
            </div>
            <div className="rounded-md bg-atlas-light p-3">
              <p className="text-xs font-bold uppercase text-slate-500">{t("hubRoutingLabel")}</p>
              <p className="mt-1 font-black text-atlas-navy">{order.hubRouting}</p>
              {order.hubRouting !== financials.recommendedHubRouting && (
                <p className="mt-1 text-sm font-semibold text-amber-700">{t("suggestedPrefix")}: {financials.recommendedHubRouting}</p>
              )}
            </div>
          </div>
        </section>
        {palletPlan.totalPallets > 0 && (
          <section className="panel p-5">
            <h2 className="text-xl font-black text-atlas-navy">{t("palletLoad")}</h2>
            <p className="mt-1 text-sm text-slate-600">{t("palletLoadBody")}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <FinancialCard label={t("estimatedPallets")} value={String(palletPlan.totalPallets)} emphasis />
              <FinancialCard label={t("fullMixedPallets")} value={`${palletPlan.fullPallets} / ${palletPlan.mixedPallets}`} />
              <FinancialCard label={t("estimatedPalletWeight")} value={`${palletPlan.totalWeightLb.toLocaleString()} lb`} />
            </div>
            {palletPlan.supplierDirect.length > 0 && (
              <p className="mt-3 text-xs text-slate-500">
                {t("palletSupplierDirectNote")} {palletPlan.supplierDirect.reduce((sum, item) => sum + item.cases, 0)}
              </p>
            )}
          </section>
        )}
        <section className="panel overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-xl font-black text-atlas-navy">{t("lineItems")}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="bg-atlas-light text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">{t("productHeader")}</th>
                  <th className="px-5 py-3">{t("supplier")}</th>
                  <th className="px-5 py-3">{t("hub")}</th>
                  <th className="px-5 py-3">{t("dimensions")}</th>
                  <th className="px-5 py-3">{t("casesHeader")}</th>
                  <th className="px-5 py-3">{t("priceBasis")}</th>
                  <th className="px-5 py-3">{t("lineValue")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(order.lineItems ?? []).map((line) => {
                  const lineOverride = adjustment?.lineOverrides?.find((override) => override.productId === line.product.id);
                  const linePricing = calculateLinePricing(line, store.pricingSettings, lineOverride);

                  return (
                    <tr key={`${order.id}-${line.product.id}`}>
                      <td className="px-5 py-4 font-bold">{line.product.sku}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <ProductImage product={line.product} className="h-9 w-9 shrink-0 rounded-md border border-slate-200" iconSize={16} />
                          <span>{line.product.brand} — {line.product.description}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">{line.product.supplierName}</td>
                      <td className="px-5 py-4">{line.product.preferredHub}</td>
                      <td className="px-5 py-4">
                        <p>{t("dimProduct")}: {line.product.productDimensions || t("notProvided")}</p>
                        <p>{t("dimCase")}: {line.product.caseDimensions || t("notProvided")}</p>
                        <p>{t("dimPallet")}: {line.product.palletConfiguration || t("notProvided")}</p>
                      </td>
                      <td className="px-5 py-4">{line.quantity}</td>
                      <td className="px-5 py-4">
                        {linePricing.pricingModel === "Manual quote price" ? (
                          <p>{t("manualQuotePriceAt")} {formatMoney(linePricing.casePrice)}</p>
                        ) : linePricing.pricingModel === "Supplier direct fulfillment fee" ? (
                          <p>{linePricing.supplierDirectCases} {t("supplierDirectCasesAt")} {formatMoney(linePricing.casePrice)}</p>
                        ) : (
                          <>
                            <p>{linePricing.palletCases} {t("palletPricedCasesAt")} {formatMoney(linePricing.palletPrice)}</p>
                            <p>{linePricing.looseCases} {t("looseCasesAt")} {formatMoney(linePricing.casePrice)}</p>
                          </>
                        )}
                      </td>
                      <td className="px-5 py-4">{formatMoney(linePricing.revenue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-5">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-black text-atlas-navy">{value}</p>
    </div>
  );
}

function FinancialCard({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="rounded-md bg-atlas-light p-3">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className={`mt-1 font-black ${emphasis ? "text-2xl text-atlas-blue" : "text-atlas-navy"}`}>{value}</p>
    </div>
  );
}
