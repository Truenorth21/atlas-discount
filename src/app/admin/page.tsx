"use client";

import { BarChart3, Check, DollarSign, FileCheck2, Megaphone, PackageCheck, Settings, UsersRound, X } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { StatusBadge } from "@/components/status-badge";
import { useAtlasStore } from "@/components/local-store";
import { getDocumentAlerts, getExpirationState } from "@/lib/documents";
import {
  allocateFulfillmentByCases,
  atlasCaseSellPrice,
  atlasPalletSellPrice,
  calculateLinePricing,
  calculateQuoteFinancials,
  casesPerPallet,
  formatMoney
} from "@/lib/pricing";
import { fulfillmentTypes } from "@/lib/data";
import type { OrderRequest, PricingSettings, QuoteAdjustment } from "@/lib/types";

const documentRejectionReasons = [
  "Document is expired",
  "Document is blurry or unreadable",
  "Business name does not match application",
  "Address does not match application",
  "Wrong document type uploaded",
  "Missing required signature",
  "Missing required page",
  "File cannot be opened",
  "Document is incomplete",
  "Additional verification needed"
];

export default function AdminPage() {
  const { store, updateApplicationStatus, updateApplicationDocumentStatus, updateProductStatus, updatePricingSettings, updateQuoteAdjustment } = useAtlasStore();
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [rejectionNotes, setRejectionNotes] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("documents");
  const pendingProducts = store.products.filter((product) => product.status === "pending");
  const documentAlerts = getDocumentAlerts(store.applications);
  const tabs = [
    { id: "documents", label: "Documents", count: store.applications.reduce((sum, item) => sum + item.documents.filter((document) => document.status === "uploaded").length, 0) },
    { id: "users", label: "Users", count: store.applications.filter((item) => item.status === "pending").length },
    { id: "products", label: "Products", count: pendingProducts.length },
    { id: "quotes", label: "Quotes", count: store.orders.length },
    { id: "pricing", label: "Pricing", count: 1 },
    { id: "marketing", label: "Marketing", count: 4 }
  ];

  return (
    <>
      <Nav />
      <main className="atlas-container grid gap-6 py-8">
        <div>
          <h1 className="text-3xl font-black text-atlas-navy">Admin dashboard</h1>
          <p className="mt-1 text-slate-600">Approve users, verify documents, review products, and manage quote/order requests.</p>
        </div>
        <section className="grid gap-4 md:grid-cols-5">
          <Metric icon={<UsersRound />} label="Users pending" value={store.applications.filter((item) => item.status === "pending").length} />
          <Metric icon={<FileCheck2 />} label="Documents" value={store.applications.reduce((sum, item) => sum + item.documents.length, 0)} />
          <Metric icon={<PackageCheck />} label="Product approvals" value={pendingProducts.length} />
          <Metric icon={<Check />} label="Open quotes" value={store.orders.length} />
          <Metric icon={<DollarSign />} label="Case markup %" value={store.pricingSettings.caseMarkupPercent} />
        </section>
        <section className="panel p-2">
          <div className="grid gap-2 md:grid-cols-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`rounded-md px-4 py-3 text-left text-sm font-black ${
                  activeTab === tab.id ? "bg-atlas-navy text-white" : "bg-white text-atlas-navy hover:bg-atlas-light"
                }`}
                type="button"
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${activeTab === tab.id ? "bg-white text-atlas-navy" : "bg-atlas-light text-atlas-blue"}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </section>
        {activeTab === "documents" && documentAlerts.length > 0 && (
          <section className="panel p-5">
            <h2 className="text-xl font-black text-atlas-navy">Document expiration alerts</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {documentAlerts.map(({ application, document, expiration }) => (
                <div key={`${application.id}-${document.id}`} className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
                  <p className="font-black text-atlas-navy">{application.companyName}</p>
                  <p className="mt-1 text-slate-700">{document.label}</p>
                  <p className={expiration.tone === "danger" ? "mt-1 font-bold text-red-700" : "mt-1 font-bold text-amber-800"}>
                    {expiration.label}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
        {activeTab === "documents" && (
          <section className="panel overflow-hidden">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-xl font-black">Document review queue</h2>
            </div>
            <div className="divide-y divide-slate-200">
              {store.applications.map((application) => (
                <article key={application.id} className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="badge bg-slate-100 text-slate-700">{application.type}</span>
                    <StatusBadge status={application.status} />
                  </div>
                  <h3 className="mt-3 text-lg font-black">{application.companyName}</h3>
                  <p className="text-sm text-slate-600">{application.contactName} • {application.email} • {application.phone}</p>
                  <RoutePreferenceCard application={application} applications={store.applications} />
                  <DocumentReviewList
                    application={application}
                    rejectionNotes={rejectionNotes}
                    rejectionReasons={rejectionReasons}
                    setRejectionNotes={setRejectionNotes}
                    setRejectionReasons={setRejectionReasons}
                    updateApplicationDocumentStatus={updateApplicationDocumentStatus}
                  />
                </article>
              ))}
            </div>
          </section>
        )}
        {activeTab === "users" && (
          <section className="panel overflow-hidden">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-xl font-black">Buyer, supplier, and route seller approvals</h2>
            </div>
            <div className="divide-y divide-slate-200">
              {store.applications.map((application) => (
                <article key={application.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="badge bg-slate-100 text-slate-700">{application.type}</span>
                        <StatusBadge status={application.status} />
                      </div>
                      <h3 className="mt-3 text-lg font-black">{application.companyName}</h3>
                      <p className="text-sm text-slate-600">{application.contactName} • {application.email} • {application.phone}</p>
                      <RoutePreferenceCard application={application} applications={store.applications} />
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-secondary px-3" type="button" onClick={() => updateApplicationStatus(application.id, "approved")} aria-label="Approve application">
                        <Check size={16} />
                      </button>
                      <button className="btn-danger px-3" type="button" onClick={() => updateApplicationStatus(application.id, "rejected")} aria-label="Reject application">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
        {activeTab === "products" && (
          <section className="panel overflow-hidden">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-xl font-black">Product approvals</h2>
            </div>
            <div className="divide-y divide-slate-200">
              {pendingProducts.map((product) => (
                <article key={product.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <StatusBadge status={product.status} />
                      <h3 className="mt-3 text-lg font-black">{product.brand} • {product.sku}</h3>
                      <p className="text-sm text-slate-600">{product.description}</p>
                      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                        <div><dt className="font-bold">Supplier cost</dt><dd>{formatMoney(product.supplierCost)}</dd></div>
                        <div><dt className="font-bold">Case sell price</dt><dd>{formatMoney(atlasCaseSellPrice(product.supplierCost, store.pricingSettings))} / loose case</dd></div>
                        <div><dt className="font-bold">Pallet sell price</dt><dd>{formatMoney(atlasPalletSellPrice(product.supplierCost, store.pricingSettings))} / case at {casesPerPallet(product.palletConfiguration) || "full pallet"} cases</dd></div>
                        <div><dt className="font-bold">Loose case margin</dt><dd>{formatMoney(atlasCaseSellPrice(product.supplierCost, store.pricingSettings) - product.supplierCost)}</dd></div>
                        <div><dt className="font-bold">Pallet case margin</dt><dd>{formatMoney(atlasPalletSellPrice(product.supplierCost, store.pricingSettings) - product.supplierCost)}</dd></div>
                        <div><dt className="font-bold">Inventory</dt><dd>{product.inventoryAvailable}</dd></div>
                        <div><dt className="font-bold">Product dimensions</dt><dd>{product.productDimensions || "Not provided"}</dd></div>
                        <div><dt className="font-bold">Case dimensions</dt><dd>{product.caseDimensions || "Not provided"}</dd></div>
                        <div><dt className="font-bold">Pallet configuration</dt><dd>{product.palletConfiguration || "Not provided"}</dd></div>
                        <div><dt className="font-bold">Location</dt><dd>{product.location}</dd></div>
                        <div><dt className="font-bold">Atlas hub</dt><dd>{product.preferredHub ?? "Orlando hub"}</dd></div>
                      </dl>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-secondary px-3" type="button" onClick={() => updateProductStatus(product.id, "approved")} aria-label="Approve product">
                        <Check size={16} />
                      </button>
                      <button className="btn-danger px-3" type="button" onClick={() => updateProductStatus(product.id, "rejected")} aria-label="Reject product">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
        {activeTab === "quotes" && <section className="panel overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-xl font-black">Orders and quote requests</h2>
            <p className="mt-1 text-sm text-slate-600">
              Hub pickup orders come in with shelf pricing already calculated. Delivery, freight, supplier-direct, and special pricing move into quote review.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] text-left text-sm">
              <thead className="bg-atlas-light text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Request</th>
                  <th className="px-5 py-3">Buyer</th>
                  <th className="px-5 py-3">Cases</th>
                  <th className="px-5 py-3">Workflow</th>
                  <th className="px-5 py-3">Sell value</th>
                  <th className="px-5 py-3">Supplier cost</th>
                  <th className="px-5 py-3">Fees / costs</th>
                  <th className="px-5 py-3">Profit</th>
                  <th className="px-5 py-3">Fulfillment</th>
                  <th className="px-5 py-3">Hub route</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {store.orders.map((order) => {
                  const adjustment = store.quoteAdjustments.find((item) => item.orderId === order.id);
                  const financials = calculateQuoteFinancials(order, store.pricingSettings, adjustment);
                  const effectiveFulfillment = adjustment?.fulfillmentType ?? order.fulfillmentType;
                  const profitTone = financials.estimatedProfit >= 0 ? "text-emerald-700" : "text-red-700";
                  const autoPricedPickup =
                    effectiveFulfillment === "Pickup" &&
                    !(order.lineItems ?? []).some((line) => line.product.preferredHub === "Supplier direct");

                  return (
                    <tr key={order.id}>
                      <td className="px-5 py-4 font-bold">
                        <Link className="text-atlas-blue underline" href={`/quotes/${order.id}`}>
                          {order.id}
                        </Link>
                      </td>
                      <td className="px-5 py-4">{order.buyer}</td>
                      <td className="px-5 py-4">{order.totalCases}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2 py-1 text-xs font-black ${autoPricedPickup ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
                          {autoPricedPickup ? "Auto-priced pickup" : "Quote review"}
                        </span>
                      </td>
                      <td className="px-5 py-4">{formatMoney(financials.productRevenue)}</td>
                      <td className="px-5 py-4">{formatMoney(financials.supplierCost)}</td>
                      <td className="px-5 py-4">
                        <p>Charged: {formatMoney(financials.fulfillmentFee)}</p>
                        <p>Est. cost: {formatMoney(financials.fulfillmentCost)}</p>
                      </td>
                      <td className={`px-5 py-4 font-black ${profitTone}`}>
                        <p>{formatMoney(financials.estimatedProfit)}</p>
                        <p className="text-xs">{financials.marginPercent.toFixed(1)}%</p>
                      </td>
                      <td className="px-5 py-4">
                        <p>{effectiveFulfillment === "Supplier direct" ? "Supplier direct fulfillment" : effectiveFulfillment}</p>
                        {effectiveFulfillment === "Supplier direct" && (
                          <p className="mt-1 text-xs font-bold text-atlas-blue">Atlas-owned customer</p>
                        )}
                        {effectiveFulfillment !== financials.recommendedFulfillmentType && (
                          <p className="mt-1 text-xs font-bold text-amber-700">Suggested: {financials.recommendedFulfillmentType}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">{adjustment?.hubRouting ?? order.hubRouting ?? financials.recommendedHubRouting}</td>
                      <td className="px-5 py-4"><StatusBadge status={order.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="grid gap-4 border-t border-slate-200 p-5">
            <h3 className="text-lg font-black text-atlas-navy">Invoice-style quote builder</h3>
            <p className="text-sm text-slate-600">
              Each order starts with suggested prices and fees. Change only what needs judgment for that quotation.
            </p>
            {store.orders.map((order) => (
              <QuoteBuilderCard
                key={order.id}
                adjustment={store.quoteAdjustments.find((item) => item.orderId === order.id)}
                order={order}
                pricingSettings={store.pricingSettings}
                updateQuoteAdjustment={updateQuoteAdjustment}
              />
            ))}
          </div>
        </section>}
        {activeTab === "pricing" && (
          <PricingSettingsPanel settings={store.pricingSettings} updatePricingSettings={updatePricingSettings} />
        )}
        {activeTab === "marketing" && <MarketingPanel />}
      </main>
    </>
  );
}

function QuoteBuilderCard({
  order,
  adjustment,
  pricingSettings,
  updateQuoteAdjustment
}: {
  order: OrderRequest;
  adjustment?: QuoteAdjustment;
  pricingSettings: PricingSettings;
  updateQuoteAdjustment: ReturnType<typeof useAtlasStore>["updateQuoteAdjustment"];
}) {
  const financials = calculateQuoteFinancials(order, pricingSettings, adjustment);
  const effectiveOrder = {
    ...order,
    fulfillmentType: adjustment?.fulfillmentType ?? order.fulfillmentType,
    hubRouting: adjustment?.hubRouting ?? order.hubRouting
  };
  const effectivePricingSettings = {
    ...pricingSettings,
    caseMarkupPercent: adjustment?.caseMarkupPercent ?? pricingSettings.caseMarkupPercent,
    palletMarkupPercent: adjustment?.palletMarkupPercent ?? pricingSettings.palletMarkupPercent,
    supplierDirectFeePercent: adjustment?.supplierDirectFeePercent ?? pricingSettings.supplierDirectFeePercent,
    localDeliveryFee: adjustment?.localDeliveryFee ?? pricingSettings.localDeliveryFee,
    pickupFee: adjustment?.pickupFee ?? pricingSettings.pickupFee,
    freightCoordinationFee: adjustment?.freightCoordinationFee ?? pricingSettings.freightCoordinationFee
  };
  const fulfillmentAllocations = allocateFulfillmentByCases(effectiveOrder, financials.fulfillmentFee);
  const autoPricedPickup =
    effectiveOrder.fulfillmentType === "Pickup" &&
    !(order.lineItems ?? []).some((line) => line.product.preferredHub === "Supplier direct");
  const updateNumber = (key: keyof QuoteAdjustment) => (event: ChangeEvent<HTMLInputElement>) =>
    updateQuoteAdjustment(order.id, { [key]: Number(event.target.value) });
  const updateText = (key: keyof QuoteAdjustment) => (event: ChangeEvent<HTMLInputElement>) =>
    updateQuoteAdjustment(order.id, { [key]: event.target.value });
  const updateLinePrice = (productId: string, sellPricePerCase: number) => {
    const existing = adjustment?.lineOverrides ?? [];
    const nextOverrides = existing.some((override) => override.productId === productId)
      ? existing.map((override) => (override.productId === productId ? { ...override, sellPricePerCase } : override))
      : [...existing, { productId, sellPricePerCase }];

    updateQuoteAdjustment(order.id, { lineOverrides: nextOverrides });
  };

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-black text-atlas-navy">{order.id} • {order.buyer}</p>
          <p className="text-sm text-slate-600">
            {autoPricedPickup
              ? "Hub pickup is pre-priced from product costs, margins, and hub fees."
              : "This order needs a quote review before Atlas sends the buyer a final number."}
          </p>
        </div>
        <div className="text-right">
          <span className={`inline-block rounded-full px-2 py-1 text-xs font-black ${autoPricedPickup ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
            {autoPricedPickup ? "Auto-priced pickup" : "Needs quotation"}
          </span>
          <p className="text-sm font-bold text-slate-600">Estimated profit</p>
          <p className={`text-xl font-black ${financials.estimatedProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}>
            {formatMoney(financials.estimatedProfit)}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <WorkflowStep active title="1. Customer PO" body={`${order.totalCases} cases submitted from catalog`} />
        <WorkflowStep active title="2. Quote worksheet" body="Review costs, edit line prices, and confirm supplier availability" />
        <WorkflowStep title="3. Send quote" body="Buyer sees final price, route, fees, and expiration" />
        <WorkflowStep title="4. Sales order / invoice" body="Accepted quote becomes the order to fulfill and bill" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-slate-200 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h4 className="font-black text-atlas-navy">Customer PO → quote worksheet</h4>
              <p className="mt-1 text-sm text-slate-600">The buyer chose the items and quantities. Atlas can change the sell price per case before sending the quote.</p>
            </div>
            <span className="rounded-full bg-atlas-light px-3 py-1 text-xs font-black text-atlas-blue">PO source: catalog cart</span>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-xs">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2 pr-3">SKU</th>
                  <th className="py-2 pr-3">Cases</th>
                  <th className="py-2 pr-3">Cost / case</th>
                  <th className="py-2 pr-3">Suggested sell / case</th>
                  <th className="py-2 pr-3">Quote sell / case</th>
                  <th className="py-2 pr-3">Pricing basis</th>
                  <th className="py-2 pr-3">Margin</th>
                  <th className="py-2 pr-3">Line total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(order.lineItems ?? []).map((line) => {
                  const lineOverride = adjustment?.lineOverrides?.find((override) => override.productId === line.product.id);
                  const suggestedLinePricing = calculateLinePricing(line, effectivePricingSettings);
                  const linePricing = calculateLinePricing(line, effectivePricingSettings, lineOverride);
                  const pricingBasis =
                    linePricing.pricingModel === "Manual quote price"
                      ? "Manual quote price"
                      : linePricing.pricingModel === "Supplier direct fulfillment fee"
                      ? "Supplier-direct fee"
                      : linePricing.palletCases > 0 && linePricing.looseCases > 0
                        ? "Pallet + loose cases"
                        : linePricing.palletCases > 0
                          ? "Full pallet price"
                          : "Loose case price";
                  const blendedCasePrice = line.quantity > 0 ? linePricing.revenue / line.quantity : 0;
                  const suggestedCasePrice = line.quantity > 0 ? suggestedLinePricing.revenue / line.quantity : 0;

                  return (
                    <tr key={`${order.id}-${line.product.id}-invoice`}>
                      <td className="py-2 pr-3 font-bold text-atlas-navy">{line.product.sku}</td>
                      <td className="py-2 pr-3">{line.quantity}</td>
                      <td className="py-2 pr-3">{formatMoney(line.product.supplierCost)}</td>
                      <td className="py-2 pr-3">{formatMoney(suggestedCasePrice)}</td>
                      <td className="py-2 pr-3">
                        <input
                          className="field h-9 min-h-9 w-28 text-sm"
                          min="0"
                          step="0.01"
                          type="number"
                          value={Number(blendedCasePrice.toFixed(2))}
                          onChange={(event) => updateLinePrice(line.product.id, Number(event.target.value))}
                          aria-label={`${line.product.sku} quote sell price per case`}
                        />
                      </td>
                      <td className="py-2 pr-3">{pricingBasis}</td>
                      <td className={`py-2 pr-3 font-bold ${linePricing.margin >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                        {formatMoney(linePricing.margin)}
                      </td>
                      <td className="py-2 pr-3 font-black">{formatMoney(linePricing.revenue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-lg bg-atlas-light p-4">
          <h4 className="font-black text-atlas-navy">Final quote preview</h4>
          <p className="mt-1 text-sm text-slate-600">This is the number Atlas would send after review.</p>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between gap-3"><dt>Products</dt><dd className="font-bold">{formatMoney(financials.productRevenue)}</dd></div>
            <div className="flex justify-between gap-3"><dt>Fulfillment charged</dt><dd className="font-bold">{formatMoney(financials.fulfillmentFee)}</dd></div>
            <div className="flex justify-between gap-3"><dt>Discount</dt><dd className="font-bold">-{formatMoney(financials.orderDiscount)}</dd></div>
            <div className="flex justify-between gap-3 border-t border-slate-300 pt-2 text-lg font-black text-atlas-navy">
              <dt>Final quote</dt><dd>{formatMoney(financials.buyerTotal)}</dd>
            </div>
          </dl>
          <dl className="mt-4 grid gap-2 border-t border-slate-300 pt-3 text-xs text-slate-600">
            <div className="flex justify-between gap-3"><dt>Supplier cost</dt><dd>{formatMoney(financials.supplierCost)}</dd></div>
            <div className="flex justify-between gap-3"><dt>Fulfillment cost</dt><dd>{formatMoney(financials.fulfillmentCost)}</dd></div>
            <div className="flex justify-between gap-3"><dt>Route seller commission</dt><dd>{formatMoney(financials.routeSellerCommission)}</dd></div>
            <div className="flex justify-between gap-3 font-black text-atlas-navy"><dt>Estimated profit</dt><dd>{formatMoney(financials.estimatedProfit)}</dd></div>
          </dl>
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-slate-200 p-4">
        <h4 className="font-black text-atlas-navy">Adjust this quotation</h4>
        <p className="mt-1 text-sm text-slate-600">
          Use these for order-level changes. Use the worksheet above when the change is product-specific.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <label className="grid gap-2">
            <span className="label">Fulfillment route</span>
            <select
              className="field"
              value={adjustment?.fulfillmentType ?? order.fulfillmentType}
              onChange={(event) => updateQuoteAdjustment(order.id, { fulfillmentType: event.target.value as OrderRequest["fulfillmentType"] })}
            >
              {fulfillmentTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <NumberField label="Loose case markup %" value={adjustment?.caseMarkupPercent ?? pricingSettings.caseMarkupPercent} onChange={updateNumber("caseMarkupPercent")} />
          <NumberField label="Full pallet markup %" value={adjustment?.palletMarkupPercent ?? pricingSettings.palletMarkupPercent} onChange={updateNumber("palletMarkupPercent")} />
          <NumberField label="Supplier direct fee %" value={adjustment?.supplierDirectFeePercent ?? pricingSettings.supplierDirectFeePercent} onChange={updateNumber("supplierDirectFeePercent")} />
          <NumberField label="Local delivery fee" value={adjustment?.localDeliveryFee ?? pricingSettings.localDeliveryFee} onChange={updateNumber("localDeliveryFee")} />
          <NumberField label="Pickup fee" value={adjustment?.pickupFee ?? pricingSettings.pickupFee} onChange={updateNumber("pickupFee")} />
          <NumberField label="Freight coordination fee" value={adjustment?.freightCoordinationFee ?? pricingSettings.freightCoordinationFee} onChange={updateNumber("freightCoordinationFee")} />
          <NumberField label="Other order fee" value={adjustment?.additionalFee ?? 0} onChange={updateNumber("additionalFee")} />
          <NumberField label="Order discount" value={adjustment?.orderDiscount ?? 0} onChange={updateNumber("orderDiscount")} />
        </div>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="flex items-center gap-3 rounded-md border border-slate-200 bg-atlas-light p-3 text-sm font-bold text-atlas-navy">
          <input
            checked={adjustment?.freeDelivery ?? false}
            type="checkbox"
            onChange={(event) => updateQuoteAdjustment(order.id, { freeDelivery: event.target.checked })}
          />
          Waive delivery / pickup / freight fee for this quote
        </label>
        <label className="grid gap-2">
          <span className="label">Free product / bonus note</span>
          <input
            className="field"
            value={adjustment?.freeProductNote ?? ""}
            onChange={updateText("freeProductNote")}
            placeholder="Example: Add 1 bonus case of hand soap"
          />
        </label>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="label">Hub route / admin note to buyer</span>
          <input className="field" value={adjustment?.hubRouting ?? order.hubRouting} onChange={updateText("hubRouting")} />
        </label>
        <label className="grid gap-2">
          <span className="label">Internal margin note</span>
          <input className="field" value={adjustment?.internalNote ?? ""} onChange={updateText("internalNote")} placeholder="Why this quote was adjusted" />
        </label>
      </div>
      <dl className="mt-4 grid gap-2 text-sm md:grid-cols-4">
        <div><dt className="font-bold text-slate-600">Sell value</dt><dd>{formatMoney(financials.productRevenue)}</dd></div>
        <div><dt className="font-bold text-slate-600">Supplier cost</dt><dd>{formatMoney(financials.supplierCost)}</dd></div>
        <div><dt className="font-bold text-slate-600">Fulfillment charged</dt><dd>{formatMoney(financials.fulfillmentFee)}</dd></div>
        <div><dt className="font-bold text-slate-600">Discount</dt><dd>{formatMoney(financials.orderDiscount)}</dd></div>
        <div><dt className="font-bold text-slate-600">Buyer total</dt><dd>{formatMoney(financials.buyerTotal)}</dd></div>
        <div><dt className="font-bold text-slate-600">Profit margin</dt><dd>{financials.marginPercent.toFixed(1)}%</dd></div>
      </dl>
      <div className="mt-4 rounded-lg border border-slate-200 bg-atlas-light p-4">
        <h4 className="font-black text-atlas-navy">How this order is processed</h4>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <ProcessStep title="1. Import buyer PO" body="The cart becomes the customer purchase order request. Atlas should not re-key items unless the buyer changes the order." />
          <ProcessStep title="2. Build quote" body="Admin reviews availability, edits line prices, and applies suggested margins or manual pricing." />
          <ProcessStep title="3. Route fulfillment" body={`${effectiveOrder.fulfillmentType === "Supplier direct" ? "Supplier ships after Atlas approval." : effectiveOrder.fulfillmentType} ${effectiveOrder.hubRouting ? `• ${effectiveOrder.hubRouting}` : ""}`} />
          <ProcessStep title="4. Send / convert" body="Once accepted, the quote becomes the sales order and invoice for fulfillment." />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[940px] text-left text-xs">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2 pr-3">SKU</th>
                <th className="py-2 pr-3">Cases</th>
                <th className="py-2 pr-3">Pallet config</th>
                <th className="py-2 pr-3">Pricing basis</th>
                <th className="py-2 pr-3">Product sell</th>
                <th className="py-2 pr-3">Fulfillment share</th>
                <th className="py-2 pr-3">Line quote</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(order.lineItems ?? []).map((line) => {
                const lineOverride = adjustment?.lineOverrides?.find((override) => override.productId === line.product.id);
                const linePricing = calculateLinePricing(line, effectivePricingSettings, lineOverride);
                const allocation = fulfillmentAllocations.find((item) => item.productId === line.product.id)?.allocation ?? 0;
                const pricingBasis =
                  linePricing.pricingModel === "Manual quote price"
                    ? "manual quote price"
                    : linePricing.pricingModel === "Supplier direct fulfillment fee"
                    ? `${linePricing.supplierDirectCases} supplier-direct cases`
                    : `${linePricing.palletCases} pallet-priced / ${linePricing.looseCases} loose`;

                return (
                  <tr key={`${order.id}-${line.product.id}`}>
                    <td className="py-2 pr-3 font-bold text-atlas-navy">{line.product.sku}</td>
                    <td className="py-2 pr-3">{line.quantity}</td>
                    <td className="py-2 pr-3">{line.product.palletConfiguration}</td>
                    <td className="py-2 pr-3">{pricingBasis}</td>
                    <td className="py-2 pr-3">{formatMoney(linePricing.revenue)}</td>
                    <td className="py-2 pr-3">{formatMoney(allocation)}</td>
                    <td className="py-2 pr-3 font-black">{formatMoney(linePricing.revenue + allocation)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </article>
  );
}

function ProcessStep({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md bg-white p-3">
      <p className="font-black text-atlas-navy">{title}</p>
      <p className="mt-1 text-xs text-slate-600">{body}</p>
    </div>
  );
}

function WorkflowStep({ title, body, active = false }: { title: string; body: string; active?: boolean }) {
  return (
    <div className={`rounded-md border p-3 ${active ? "border-atlas-blue bg-sky-50" : "border-slate-200 bg-white"}`}>
      <p className="font-black text-atlas-navy">{title}</p>
      <p className="mt-1 text-xs text-slate-600">{body}</p>
    </div>
  );
}

function MarketingPanel() {
  const sources = [
    ["Google Search", "42%", "Quote requests from high-intent product and wholesale searches"],
    ["Instagram", "21%", "Route seller and retailer discovery"],
    ["Facebook", "16%", "Local business owner traffic"],
    ["Direct / referral", "21%", "Supplier, route seller, and repeat buyer traffic"]
  ];
  const cities = [
    ["Miami, FL", "31%", "Janitorial, HBA, closeouts"],
    ["Orlando, FL", "24%", "Grocery, pantry, office"],
    ["Tampa, FL", "15%", "Freight and pallet interest"],
    ["Jacksonville, FL", "9%", "Supplier-direct interest"]
  ];
  const campaigns = [
    ["MIAMI-HUB-LAUNCH", "Active", "Miami hub buyer signups"],
    ["ORLANDO-ROUTES", "Draft", "Route seller recruiting"],
    ["PALLET-DEALS-Q3", "Active", "Full-pallet discount offers"],
    ["SUPPLIER-DIRECT", "Testing", "National supplier-direct fulfillment"]
  ];

  return (
    <section className="grid gap-6">
      <div className="panel p-5">
        <div className="flex items-center gap-2">
          <Megaphone className="text-atlas-blue" />
          <h2 className="text-xl font-black text-atlas-navy">Discounts, promotions, and marketing</h2>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Track demand by channel, city/state, campaign, and product lane before spending more marketing money.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <MarketingTable icon={<BarChart3 />} title="Traffic sources" rows={sources} columns={["Source", "Share", "Signal"]} />
        <MarketingTable icon={<BarChart3 />} title="Geography" rows={cities} columns={["City / state", "Share", "Demand"]} />
        <MarketingTable icon={<Megaphone />} title="Campaign tracking" rows={campaigns} columns={["Campaign", "Status", "Goal"]} />
        <div className="panel p-5">
          <h3 className="text-lg font-black text-atlas-navy">Promotion controls to add next</h3>
          <ul className="mt-3 grid gap-2 text-sm text-slate-700">
            <li>Promo code, campaign source, and landing page tracking</li>
            <li>Supplier-funded promotion submissions</li>
            <li>Buyer segment discounts for full-pallet orders</li>
            <li>Route seller campaign attribution by territory</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function MarketingTable({ icon, title, rows, columns }: { icon: React.ReactNode; title: string; rows: string[][]; columns: string[] }) {
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-200 p-5">
        <span className="text-atlas-blue">{icon}</span>
        <h3 className="text-lg font-black text-atlas-navy">{title}</h3>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="bg-atlas-light text-xs uppercase text-slate-500">
          <tr>{columns.map((column) => <th key={column} className="px-4 py-3">{column}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rows.map((row) => (
            <tr key={row.join("-")}>{row.map((cell) => <td key={cell} className="px-4 py-3">{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PricingSettingsPanel({
  settings,
  updatePricingSettings
}: {
  settings: PricingSettings;
  updatePricingSettings: ReturnType<typeof useAtlasStore>["updatePricingSettings"];
}) {
  function updateNumber(key: keyof PricingSettings) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      updatePricingSettings({
        ...settings,
        [key]: Number(event.target.value)
      });
    };
  }

  return (
    <section className="grid gap-6">
      <div className="panel p-5">
        <div className="flex items-center gap-2">
          <Settings className="text-atlas-blue" />
          <h2 className="text-xl font-black text-atlas-navy">Pricing and fulfillment rules</h2>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Use these as default guardrails. Discounts, free delivery, and free product belong on the quote builder, because they should only apply to one customer/order.
        </p>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <RuleStep number="1" title="Buyer builds order" body="Mixed cases can qualify by minimum cases or minimum dollar value. Full pallet lines get better pricing." />
          <RuleStep number="2" title="Atlas reviews route" body="Supplier direct, hub pickup, local delivery, or freight changes the fulfillment charge and internal cost." />
          <RuleStep number="3" title="Admin finalizes quote" body="You can adjust margins, waive delivery, add discounts, or add a free-product note before sending." />
        </div>
        <div className="mt-5 rounded-lg border border-slate-200 bg-atlas-light p-4">
          <h3 className="font-black text-atlas-navy">Example order</h3>
          <div className="mt-3 grid gap-3 text-sm md:grid-cols-4">
            <div><p className="font-bold text-slate-600">Supermarket cart</p><p>1 case + 3 cases + 5 cases + more mixed SKUs</p></div>
            <div><p className="font-bold text-slate-600">Pricing</p><p>Loose-case price until a product reaches its own pallet count.</p></div>
            <div><p className="font-bold text-slate-600">Delivery</p><p>Local delivery can be charged, waived, or allocated across lines by case count.</p></div>
            <div><p className="font-bold text-slate-600">Generosity</p><p>For a $15,000 order, use quote builder for discount, free delivery, or bonus product.</p></div>
          </div>
        </div>
        <div className="mt-5 grid gap-6">
          <div>
            <h3 className="font-black text-atlas-navy">Sales margin rules</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <NumberField label="Supplier direct transaction fee %" value={settings.supplierDirectFeePercent} onChange={updateNumber("supplierDirectFeePercent")} />
              <NumberField label="Supplier direct minimum fee" value={settings.supplierDirectMinimumFee} onChange={updateNumber("supplierDirectMinimumFee")} />
              <NumberField label="Route seller commission %" value={settings.routeSellerCommissionPercent} onChange={updateNumber("routeSellerCommissionPercent")} />
              <NumberField label="Mixed order min cases" value={settings.minimumMixedOrderCases} onChange={updateNumber("minimumMixedOrderCases")} />
              <NumberField label="Mixed order min value" value={settings.minimumOrderValue} onChange={updateNumber("minimumOrderValue")} />
              <NumberField label="Loose case markup %" value={settings.caseMarkupPercent} onChange={updateNumber("caseMarkupPercent")} />
              <NumberField label="Full pallet markup %" value={settings.palletMarkupPercent} onChange={updateNumber("palletMarkupPercent")} />
              <NumberField label="Minimum loose case margin" value={settings.minimumCaseMarginPerCase} onChange={updateNumber("minimumCaseMarginPerCase")} />
              <NumberField label="Minimum pallet case margin" value={settings.minimumPalletMarginPerCase} onChange={updateNumber("minimumPalletMarginPerCase")} />
            </div>
          </div>
          <div>
            <h3 className="font-black text-atlas-navy">Fulfillment cost rules</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <NumberField label="Miami hub fee / case" value={settings.miamiHubHandlingPerCase} onChange={updateNumber("miamiHubHandlingPerCase")} />
              <NumberField label="Miami hub cost / case" value={settings.miamiHubCostPerCase} onChange={updateNumber("miamiHubCostPerCase")} />
              <NumberField label="Orlando hub fee / case" value={settings.orlandoHubHandlingPerCase} onChange={updateNumber("orlandoHubHandlingPerCase")} />
              <NumberField label="Orlando hub cost / case" value={settings.orlandoHubCostPerCase} onChange={updateNumber("orlandoHubCostPerCase")} />
              <NumberField label="Pickup fee" value={settings.pickupFee} onChange={updateNumber("pickupFee")} />
              <NumberField label="Local delivery fee" value={settings.localDeliveryFee} onChange={updateNumber("localDeliveryFee")} />
              <NumberField label="Local delivery cost" value={settings.localDeliveryCost} onChange={updateNumber("localDeliveryCost")} />
              <NumberField label="Freight coordination fee" value={settings.freightCoordinationFee} onChange={updateNumber("freightCoordinationFee")} />
              <NumberField label="Freight cost estimate" value={settings.freightCostEstimate} onChange={updateNumber("freightCostEstimate")} />
              <NumberField label="Freight case threshold" value={settings.freightCaseThreshold} onChange={updateNumber("freightCaseThreshold")} />
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <RateCard title="Supplier direct fulfillment" body="Atlas owns the buyer and quote. Supplier ships, and Atlas earns a transaction fee or minimum fee." />
        <RateCard title="Atlas consolidated hub" body="Atlas prices loose cases and full pallets differently, then adds Miami or Orlando handling economics." />
        <RateCard title="Delivery / freight" body="Adds pickup, local delivery, or freight costs after product-level pricing is calculated." />
      </div>
    </section>
  );
}

function RuleStep({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <span className="text-sm font-black text-atlas-blue">{number}</span>
      <h3 className="mt-2 font-black text-atlas-navy">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="label">{label}</span>
      <input className="field" min="0" step="0.01" type="number" value={value} onChange={onChange} />
    </label>
  );
}

function RateCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="panel p-5">
      <h3 className="font-black text-atlas-navy">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
    </div>
  );
}

function RoutePreferenceCard({
  application,
  applications
}: {
  application: ReturnType<typeof useAtlasStore>["store"]["applications"][number];
  applications: ReturnType<typeof useAtlasStore>["store"]["applications"];
}) {
  if (application.type !== "route_seller" || !application.routePreference) return null;

  const preference = application.routePreference;
  const conflicts = applications.filter(
    (candidate) =>
      candidate.id !== application.id &&
      candidate.type === "route_seller" &&
      candidate.status === "approved" &&
      candidate.routePreference?.hub === preference.hub &&
      candidate.routePreference.territory === preference.territory &&
      candidate.routePreference.productLane === preference.productLane
  );

  return (
    <div className="mt-3 rounded-md border border-slate-200 bg-atlas-light p-3 text-sm">
      <p className="font-black text-atlas-navy">Route preference</p>
      <dl className="mt-2 grid gap-2 sm:grid-cols-2">
        <div><dt className="font-bold text-slate-600">Program</dt><dd>{preference.program}</dd></div>
        <div><dt className="font-bold text-slate-600">Hub</dt><dd>{preference.hub}</dd></div>
        <div><dt className="font-bold text-slate-600">Territory</dt><dd>{preference.territory}</dd></div>
        <div><dt className="font-bold text-slate-600">Product lane</dt><dd>{preference.productLane}</dd></div>
      </dl>
      {conflicts.length > 0 ? (
        <p className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 font-semibold text-red-700">
          Conflict: this territory and product lane already has an approved seller.
        </p>
      ) : (
        <p className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-2 font-semibold text-emerald-700">
          No approved seller conflict for this hub, territory, and product lane.
        </p>
      )}
    </div>
  );
}

function DocumentReviewList({
  application,
  rejectionNotes,
  rejectionReasons,
  setRejectionNotes,
  setRejectionReasons,
  updateApplicationDocumentStatus
}: {
  application: ReturnType<typeof useAtlasStore>["store"]["applications"][number];
  rejectionNotes: Record<string, string>;
  rejectionReasons: Record<string, string>;
  setRejectionNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setRejectionReasons: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  updateApplicationDocumentStatus: ReturnType<typeof useAtlasStore>["updateApplicationDocumentStatus"];
}) {
  return (
    <div className="mt-4 grid gap-3">
      {application.documents.map((document) => {
        const reasonKey = `${application.id}-${document.id}`;
        const expiration = getExpirationState(document);

        return (
          <div key={document.id} className="rounded-md border border-slate-200 bg-atlas-light p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-atlas-navy">{document.label}</p>
                <p className="text-sm text-slate-600">{document.fileName ? `File: ${document.fileName}` : "No file uploaded yet"}</p>
                {document.rejectionReason && (
                  <p className="mt-1 text-sm font-semibold text-red-700">Rejection reason: {document.rejectionReason}</p>
                )}
                {expiration.tone !== "neutral" && (
                  <p className={`mt-1 text-sm font-semibold ${expiration.tone === "danger" ? "text-red-700" : expiration.tone === "warning" ? "text-amber-700" : "text-emerald-700"}`}>
                    {expiration.label}
                  </p>
                )}
              </div>
              <StatusBadge status={document.status} />
            </div>
            <div className="mt-3 grid gap-2">
              <select
                className="field"
                value={rejectionReasons[reasonKey] ?? documentRejectionReasons[0]}
                onChange={(event) =>
                  setRejectionReasons((current) => ({
                    ...current,
                    [reasonKey]: event.target.value
                  }))
                }
              >
                {documentRejectionReasons.map((reason) => (
                  <option key={reason}>{reason}</option>
                ))}
              </select>
              <input
                className="field"
                placeholder="Optional note for applicant"
                value={rejectionNotes[reasonKey] ?? ""}
                onChange={(event) =>
                  setRejectionNotes((current) => ({
                    ...current,
                    [reasonKey]: event.target.value
                  }))
                }
              />
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn-secondary"
                  type="button"
                  disabled={!document.fileName}
                  onClick={() => updateApplicationDocumentStatus(application.id, document.id, "approved")}
                >
                  <Check size={16} />
                  Approve
                </button>
                <button
                  className="btn-danger"
                  type="button"
                  disabled={!document.fileName}
                  onClick={() => {
                    const reason = rejectionReasons[reasonKey] ?? documentRejectionReasons[0];
                    const note = rejectionNotes[reasonKey];
                    updateApplicationDocumentStatus(
                      application.id,
                      document.id,
                      "rejected",
                      note ? `${reason}: ${note}` : reason
                    );
                  }}
                >
                  <X size={16} />
                  Reject
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="panel p-5">
      <div className="text-atlas-blue">{icon}</div>
      <p className="mt-3 text-3xl font-black text-atlas-navy">{value}</p>
      <p className="text-sm font-semibold text-slate-600">{label}</p>
    </div>
  );
}
