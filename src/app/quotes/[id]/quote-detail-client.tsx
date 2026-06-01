"use client";

import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { Nav } from "@/components/nav";
import { StatusBadge } from "@/components/status-badge";
import { useAtlasStore } from "@/components/local-store";
import { calculateLinePricing, calculateQuoteFinancials, formatMoney } from "@/lib/pricing";

export function QuoteDetailClient({ id }: { id: string }) {
  const { store } = useAtlasStore();
  const order = store.orders.find((item) => item.id === id);
  const adjustment = store.quoteAdjustments.find((item) => item.orderId === id);

  if (!order) {
    return (
      <>
        <Nav />
        <main className="atlas-container py-8">
          <div className="panel p-6">
            <h1 className="text-2xl font-black text-atlas-navy">Quote not found</h1>
            <Link className="btn-primary mt-5" href="/dashboard/retailer">
              <ArrowLeft size={16} />
              Back to dashboard
            </Link>
          </div>
        </main>
      </>
    );
  }

  const financials = calculateQuoteFinancials(order, store.pricingSettings, adjustment);

  return (
    <>
      <Nav />
      <main className="atlas-container grid gap-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-atlas-blue" href="/dashboard/retailer">
              <ArrowLeft size={16} />
              Back to dashboard
            </Link>
            <h1 className="text-3xl font-black text-atlas-navy">{order.id}</h1>
            <p className="mt-1 text-slate-600">Quote detail, supplier lines, hub routing, and fulfillment review.</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Buyer" value={order.buyer} />
          <Metric label="Region" value={order.buyerRegion ?? "Routing review"} />
          <Metric label="Cases" value={String(order.totalCases)} />
          <Metric label="Estimated profit" value={formatMoney(financials.estimatedProfit)} />
        </section>
        <section className="panel p-5">
          <h2 className="text-xl font-black text-atlas-navy">Admin quote economics</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <FinancialCard label="Buyer sell value" value={formatMoney(financials.productRevenue)} />
            <FinancialCard label="Supplier cost" value={formatMoney(financials.supplierCost)} />
            <FinancialCard label="Product margin" value={formatMoney(financials.productMargin)} />
            <FinancialCard label="Supplier-direct cases" value={String(financials.supplierDirectCases)} />
            <FinancialCard label="Full-pallet cases" value={String(financials.palletCases)} />
            <FinancialCard label="Loose cases" value={String(financials.looseCases)} />
            <FinancialCard label="Fulfillment charged" value={formatMoney(financials.fulfillmentFee)} />
            <FinancialCard label="Order discount" value={formatMoney(financials.orderDiscount)} />
            <FinancialCard label="Buyer quote total" value={formatMoney(financials.buyerTotal)} emphasis />
            <FinancialCard label="Estimated fulfillment cost" value={formatMoney(financials.fulfillmentCost)} />
            <FinancialCard label="Route seller commission" value={formatMoney(financials.routeSellerCommission)} />
            <FinancialCard label="Estimated Atlas profit" value={formatMoney(financials.estimatedProfit)} />
            <FinancialCard label="Profit margin" value={`${financials.marginPercent.toFixed(1)}%`} />
            <FinancialCard label="Suggested fulfillment" value={financials.recommendedFulfillmentType} />
          </div>
        </section>
        <section className="panel p-5">
          <h2 className="flex items-center gap-2 text-xl font-black text-atlas-navy">
            <MapPin className="text-atlas-blue" />
            Fulfillment route
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-md bg-atlas-light p-3">
              <p className="text-xs font-bold uppercase text-slate-500">Requested fulfillment</p>
              <p className="mt-1 font-black text-atlas-navy">
                {order.fulfillmentType === "Supplier direct" ? "Supplier direct fulfillment" : order.fulfillmentType}
              </p>
              {order.fulfillmentType === "Supplier direct" && (
                <p className="mt-1 text-sm font-semibold text-atlas-blue">Atlas owns the buyer, quote, reorder, and support.</p>
              )}
            </div>
            <div className="rounded-md bg-atlas-light p-3">
              <p className="text-xs font-bold uppercase text-slate-500">Hub routing</p>
              <p className="mt-1 font-black text-atlas-navy">{order.hubRouting}</p>
              {order.hubRouting !== financials.recommendedHubRouting && (
                <p className="mt-1 text-sm font-semibold text-amber-700">Suggested: {financials.recommendedHubRouting}</p>
              )}
            </div>
          </div>
        </section>
        <section className="panel overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-xl font-black text-atlas-navy">Line items</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="bg-atlas-light text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Supplier</th>
                  <th className="px-5 py-3">Hub</th>
                  <th className="px-5 py-3">Dimensions</th>
                  <th className="px-5 py-3">Cases</th>
                  <th className="px-5 py-3">Price basis</th>
                  <th className="px-5 py-3">Line value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(order.lineItems ?? []).map((line) => {
                  const lineOverride = adjustment?.lineOverrides?.find((override) => override.productId === line.product.id);
                  const linePricing = calculateLinePricing(line, store.pricingSettings, lineOverride);

                  return (
                    <tr key={`${order.id}-${line.product.id}`}>
                      <td className="px-5 py-4 font-bold">{line.product.sku}</td>
                      <td className="px-5 py-4">{line.product.brand} — {line.product.description}</td>
                      <td className="px-5 py-4">{line.product.supplierName}</td>
                      <td className="px-5 py-4">{line.product.preferredHub}</td>
                      <td className="px-5 py-4">
                        <p>Product: {line.product.productDimensions || "Not provided"}</p>
                        <p>Case: {line.product.caseDimensions || "Not provided"}</p>
                        <p>Pallet: {line.product.palletConfiguration || "Not provided"}</p>
                      </td>
                      <td className="px-5 py-4">{line.quantity}</td>
                      <td className="px-5 py-4">
                        {linePricing.pricingModel === "Manual quote price" ? (
                          <p>Manual quote price at {formatMoney(linePricing.casePrice)}</p>
                        ) : linePricing.pricingModel === "Supplier direct fulfillment fee" ? (
                          <p>{linePricing.supplierDirectCases} supplier-direct cases at {formatMoney(linePricing.casePrice)}</p>
                        ) : (
                          <>
                            <p>{linePricing.palletCases} pallet-priced cases at {formatMoney(linePricing.palletPrice)}</p>
                            <p>{linePricing.looseCases} loose cases at {formatMoney(linePricing.casePrice)}</p>
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
