"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { Nav } from "@/components/nav";
import { StatusBadge } from "@/components/status-badge";
import { atlasHubs, fulfillmentTypes } from "@/lib/data";
import { useAtlasStore } from "@/components/local-store";
import { allocateFulfillmentByCases, calculateLinePricing, calculateQuoteFinancials, casesPerPallet, formatMoney } from "@/lib/pricing";
import type { FulfillmentType, OrderRequest } from "@/lib/types";

export default function CatalogClient() {
  const { store, addToCart, addOrder, removeFromCart, updateCartQuantity, verifyDocuments } = useAtlasStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [hub, setHub] = useState("All hubs");
  const [buyerRegion, setBuyerRegion] = useState("South Florida");
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("Pickup");
  const [submittedQuoteId, setSubmittedQuoteId] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState<{ src: string; label: string } | null>(null);

  const approved = store.products.filter((product) => product.status === "approved");
  const categories = ["All", ...Array.from(new Set(approved.map((product) => product.category)))];
  const filtered = useMemo(() => {
    const term = query.toLowerCase();
    return approved.filter((product) => {
      const matchesCategory = category === "All" || product.category === category;
      const matchesHub = hub === "All hubs" || product.preferredHub === hub;
      const matchesTerm = [product.brand, product.upc, product.description, product.sku]
        .join(" ")
        .toLowerCase()
        .includes(term);
      return matchesCategory && matchesHub && matchesTerm;
    });
  }, [approved, category, hub, query]);

  const totalCases = store.cart.reduce((sum, line) => sum + line.quantity, 0);
  const hubSummary = Array.from(
    store.cart.reduce((summary, line) => {
      const hubName = line.product.preferredHub ?? "Supplier direct";
      summary.set(hubName, (summary.get(hubName) ?? 0) + line.quantity);
      return summary;
    }, new Map<string, number>())
  );
  const hubRouting =
    hubSummary.length === 0
      ? "No hub route selected yet"
      : hubSummary.map(([hubName, cases]) => `${hubName}: ${cases} cases`).join(" + ");
  const draftOrder: OrderRequest = {
    id: "DRAFT",
    buyer: "Current Retailer",
    buyerRegion,
    totalCases,
    estimatedValue: 0,
    fulfillmentType,
    hubRouting,
    lineItems: store.cart,
    status: "Quote requested",
    createdAt: new Date().toISOString().slice(0, 10)
  };
  const quoteFinancials = calculateQuoteFinancials(draftOrder, store.pricingSettings);
  const fulfillmentAllocations = allocateFulfillmentByCases(draftOrder, quoteFinancials.fulfillmentFee);
  const estimatedQuoteTotal = quoteFinancials.buyerTotal;
  const hasSupplierDirectItems = store.cart.some((line) => line.product.preferredHub === "Supplier direct");
  const hubPickupAutoPriced = fulfillmentType === "Pickup" && !hasSupplierDirectItems;
  const checkoutMode = hubPickupAutoPriced ? "Hub pickup shelf pricing" : "Atlas quote review";
  const meetsCaseMinimum = totalCases >= store.pricingSettings.minimumMixedOrderCases;
  const meetsValueMinimum = estimatedQuoteTotal >= store.pricingSettings.minimumOrderValue;
  const canRequestQuote = store.cart.length > 0 && (meetsCaseMinimum || meetsValueMinimum);
  const minimumCaseProgress = Math.min(100, (totalCases / store.pricingSettings.minimumMixedOrderCases) * 100);
  const minimumValueProgress = Math.min(100, (estimatedQuoteTotal / store.pricingSettings.minimumOrderValue) * 100);

  function requestQuote() {
    if (store.cart.length === 0) return;
    const id = `Q-${Math.floor(1000 + Math.random() * 9000)}`;
    addOrder({
      id,
      buyer: "Current Retailer",
      buyerRegion,
      totalCases: store.cart.reduce((sum, line) => sum + line.quantity, 0),
      estimatedValue: estimatedQuoteTotal,
      fulfillmentType,
      hubRouting,
      lineItems: store.cart,
      status: hubPickupAutoPriced ? "Ready to confirm" : "Quote requested",
      createdAt: new Date().toISOString().slice(0, 10)
    });
    setSubmittedQuoteId(id);
  }

  return (
    <>
      <Nav />
      <main className="atlas-container grid gap-6 py-8 lg:grid-cols-[1fr_360px]">
        <section className="grid gap-5">
          <div className="panel p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <label className="grid flex-1 gap-2">
                <span className="label">Search UPC, brand, SKU, product</span>
                <span className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input className="field pl-10" value={query} onChange={(event) => setQuery(event.target.value)} />
                </span>
              </label>
              <label className="grid gap-2 md:w-56">
                <span className="label">Category</span>
                <select className="field" value={category} onChange={(event) => setCategory(event.target.value)}>
                  {categories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 md:w-56">
                <span className="label">Atlas hub</span>
                <select className="field" value={hub} onChange={(event) => setHub(event.target.value)}>
                  <option>All hubs</option>
                  {atlasHubs.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 md:w-56">
                <span className="label">Buyer region</span>
                <select className="field" value={buyerRegion} onChange={(event) => setBuyerRegion(event.target.value)}>
                  <option>South Florida</option>
                  <option>Central Florida</option>
                  <option>North Florida</option>
                  <option>Out of state</option>
                </select>
              </label>
            </div>
          </div>
          {!store.documentsVerified && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Wholesale pricing is hidden until resale certificate/business documents are verified.
              <button className="ml-3 font-bold text-atlas-blue underline" type="button" onClick={verifyDocuments}>
                Mark demo documents verified
              </button>
            </div>
          )}
          <div className="grid gap-4">
            {filtered.map((product) => (
              <article key={product.id} className="panel p-5">
                <div className="grid gap-4 lg:grid-cols-[128px_1fr_180px] lg:items-start">
                  <button
                    className="h-32 w-32 overflow-hidden rounded-md border border-slate-200 bg-white transition hover:border-atlas-blue focus:outline-none focus:ring-2 focus:ring-atlas-blue"
                    type="button"
                    onClick={() =>
                      setExpandedImage({
                        src: product.imageUrl || "/product-images/disinfecting-wipes.svg",
                        label: `${product.brand} ${product.description}`
                      })
                    }
                    aria-label={`Expand ${product.brand} product image`}
                  >
                    <img
                      alt={`${product.brand} ${product.description}`}
                      className="h-full w-full object-cover"
                      src={product.imageUrl || "/product-images/disinfecting-wipes.svg"}
                    />
                  </button>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={product.status} />
                      <span className="badge bg-slate-100 text-slate-700">{product.category} / {product.subcategory}</span>
                    </div>
                    <h2 className="mt-3 text-xl font-black text-atlas-navy">{product.brand}</h2>
                    <p className="mt-1 text-slate-700">{product.description}</p>
                    <dl className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                      <div><dt className="font-bold">SKU</dt><dd>{product.sku}</dd></div>
                      <div><dt className="font-bold">UPC</dt><dd>{product.upc}</dd></div>
                    <div><dt className="font-bold">Direct MOQ</dt><dd>{product.moq} cases</dd></div>
                      <div><dt className="font-bold">Product dimensions</dt><dd>{product.productDimensions || "Not provided"}</dd></div>
                      <div><dt className="font-bold">Case dimensions</dt><dd>{product.caseDimensions || "Not provided"}</dd></div>
                      <div><dt className="font-bold">Pallet configuration</dt><dd>{product.palletConfiguration || "Not provided"}</dd></div>
                      <div><dt className="font-bold">Case pack</dt><dd>{product.casePack}</dd></div>
                      <div><dt className="font-bold">Inventory</dt><dd>{product.inventoryAvailable}</dd></div>
                      <div><dt className="font-bold">Location</dt><dd>{product.location}</dd></div>
                      <div><dt className="font-bold">Atlas hub</dt><dd>{product.preferredHub ?? "Orlando hub"}</dd></div>
                    </dl>
                    <p className="mt-3 flex max-w-2xl gap-2 rounded-md bg-atlas-light p-3 text-sm text-slate-700">
                      <MapPin className="mt-0.5 shrink-0 text-atlas-blue" size={17} />
                      {product.routeRecommendation ?? "Atlas will route this item through the nearest available hub or supplier-direct lane."}
                    </p>
                  </div>
                  <div className="rounded-lg bg-atlas-light p-4">
                    <p className="text-xs font-bold uppercase text-slate-500">Estimated quote price</p>
                    <p className="mt-1 text-2xl font-black text-atlas-navy">
                      {store.documentsVerified ? formatMoney(calculateLinePricing({ product, quantity: 1 }, store.pricingSettings).casePrice) : "Locked"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">Loose case estimate. Final quote reviewed by Atlas.</p>
                    <button className="btn-primary mt-4 w-full" type="button" onClick={() => addToCart(product)}>
                      <ShoppingCart size={16} />
                      Quick add
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
        <aside className="panel h-fit p-5">
          <h2 className="text-xl font-black text-atlas-navy">Quote cart</h2>
          {submittedQuoteId && (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <p className="font-black">{hubPickupAutoPriced ? "Pickup order submitted" : "Quote request submitted"}</p>
              <p className="mt-1">
                {hubPickupAutoPriced
                  ? "Atlas has the hub pickup price ready for final confirmation."
                  : "Atlas will review supplier availability, hub routing, and freight needs."}
              </p>
              <Link className="mt-2 inline-block font-bold text-atlas-blue underline" href={`/quotes/${submittedQuoteId}`}>
                View quote detail
              </Link>
            </div>
          )}
          <div className="mt-4 grid gap-3">
            {store.cart.length === 0 ? (
              <p className="text-sm text-slate-600">Add products to create a quote/order request.</p>
            ) : (
              store.cart.map((line) => (
                <div key={line.product.id} className="rounded-md border border-slate-200 p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold">{line.product.brand}</p>
                    <button
                      className="rounded-md p-1 text-slate-500 hover:bg-red-50 hover:text-atlas-red"
                      type="button"
                      onClick={() => removeFromCart(line.product.id)}
                      aria-label={`Remove ${line.product.brand}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <p className="text-slate-600">{line.quantity} cases • {line.product.sku}</p>
                  <p className="mt-1 text-xs font-semibold text-atlas-blue">{line.product.preferredHub ?? "Orlando hub"}</p>
                  {(() => {
                    const linePricing = calculateLinePricing(line, store.pricingSettings);
                    const allocation = fulfillmentAllocations.find((item) => item.productId === line.product.id)?.allocation ?? 0;
                    return (
                      <div className="mt-2 rounded-md bg-atlas-light p-2 text-xs text-slate-700">
                        {linePricing.pricingModel === "Supplier direct fulfillment fee" ? (
                          <p>{linePricing.supplierDirectCases} supplier-direct cases at {formatMoney(linePricing.casePrice)}</p>
                        ) : (
                          <>
                            <p>{linePricing.palletCases} pallet-priced cases at {formatMoney(linePricing.palletPrice)}</p>
                            <p>{linePricing.looseCases} loose cases at {formatMoney(linePricing.casePrice)}</p>
                          </>
                        )}
                        {quoteFinancials.fulfillmentFee > 0 && (
                          <p className="mt-1 font-semibold text-atlas-blue">Fulfillment share: {formatMoney(allocation)}</p>
                        )}
                      </div>
                    );
                  })()}
                  <div className="mt-3 grid gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        className="btn-secondary h-9 min-h-9 w-9 px-0"
                        type="button"
                        onClick={() => updateCartQuantity(line.product.id, line.quantity - 1)}
                        aria-label={`Decrease ${line.product.brand} quantity`}
                      >
                        <Minus size={15} />
                      </button>
                      <input
                        className="field h-9 min-h-9 w-20 text-center"
                        min={1}
                        max={line.product.inventoryAvailable}
                        step={1}
                        type="number"
                        value={line.quantity}
                        onChange={(event) => updateCartQuantity(line.product.id, Number(event.target.value))}
                        aria-label={`${line.product.brand} case quantity`}
                      />
                      <button
                        className="btn-secondary h-9 min-h-9 w-9 px-0"
                        type="button"
                        onClick={() => updateCartQuantity(line.product.id, line.quantity + 1)}
                        aria-label={`Increase ${line.product.brand} quantity`}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">
                      Mixed-case orders can add 1 case at a time. Supplier-direct MOQ {line.product.moq} • Available {line.product.inventoryAvailable}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 rounded-md bg-atlas-light p-3 text-sm">
            <p className="font-black text-atlas-navy">Hub route</p>
            <p className="mt-1 text-slate-600">{hubRouting}</p>
            <p className="mt-2 text-xs font-semibold text-atlas-blue">Buyer region: {buyerRegion}</p>
          </div>
          <div className={`mt-4 rounded-md border p-3 text-sm ${hubPickupAutoPriced ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
            <p className="font-black">{checkoutMode}</p>
            <p className="mt-1">
              {hubPickupAutoPriced
                ? "Pickup at a Miami or Orlando hub uses the posted case prices automatically, like buying from warehouse shelves. Admin can still review before confirming."
                : "Delivery, freight, supplier-direct, and mixed routes need Atlas to finalize margin and logistics before the buyer confirms."}
            </p>
          </div>
          <label className="mt-4 grid gap-2">
            <span className="label">Fulfillment type</span>
            <select className="field" value={fulfillmentType} onChange={(event) => setFulfillmentType(event.target.value as typeof fulfillmentType)}>
              {fulfillmentTypes.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 font-bold">
            <span>Product subtotal</span>
            <span>{formatMoney(quoteFinancials.productRevenue)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm font-bold">
            <span>{fulfillmentType === "Local delivery" ? "Estimated delivery / fulfillment" : "Estimated fulfillment"}</span>
            <span>{formatMoney(quoteFinancials.fulfillmentFee)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-lg font-black text-atlas-navy">
            <span>{hubPickupAutoPriced ? "Pickup total" : "Estimated quote total"}</span>
            <span>{formatMoney(estimatedQuoteTotal)}</span>
          </div>
          <div className="mt-4 rounded-md border border-slate-200 p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold text-atlas-navy">Mixed order minimum</span>
              <span className={canRequestQuote ? "font-bold text-emerald-700" : "font-bold text-amber-700"}>
                {canRequestQuote ? "Ready" : "Keep adding"}
              </span>
            </div>
            <div className="mt-3 grid gap-2">
              <MinimumMeter label={`${totalCases}/${store.pricingSettings.minimumMixedOrderCases} cases`} percent={minimumCaseProgress} />
              <MinimumMeter label={`${formatMoney(estimatedQuoteTotal)}/${formatMoney(store.pricingSettings.minimumOrderValue)}`} percent={minimumValueProgress} />
            </div>
            <p className="mt-2 text-xs text-slate-600">
              Meet either the case minimum or value minimum. Full-pallet lines receive better per-case pricing than loose mixed cases.
            </p>
          </div>
          <button className="btn-danger mt-4 w-full" type="button" disabled={!canRequestQuote} onClick={requestQuote}>
            {hubPickupAutoPriced ? "Submit pickup order" : "Request quote"}
          </button>
        </aside>
      </main>
      {expandedImage && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-atlas-navy/70 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl rounded-lg bg-white p-4 shadow-panel">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-atlas-navy">{expandedImage.label}</h2>
              <button className="btn-secondary px-3" type="button" onClick={() => setExpandedImage(null)}>
                Close
              </button>
            </div>
            <img alt={expandedImage.label} className="mx-auto mt-4 max-h-[58vh] w-full max-w-xl rounded-md object-contain" src={expandedImage.src} />
          </div>
        </div>
      )}
    </>
  );
}

function MinimumMeter({ label, percent }: { label: string; percent: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs font-semibold text-slate-600">
        <span>{label}</span>
        <span>{Math.round(percent)}%</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-atlas-blue" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
