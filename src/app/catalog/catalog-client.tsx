"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeftRight, CheckCircle2, MapPin, Minus, Plus, Search, ShoppingCart, Sparkles, Tag, Trash2, Warehouse } from "lucide-react";
import { Nav } from "@/components/nav";
import { ProductImage, isPlaceholderImage } from "@/components/product-image";
import { atlasHubs, fulfillmentTypes } from "@/lib/data";
import { useAtlasStore } from "@/components/local-store";
import { useI18n } from "@/lib/i18n";
import { allocateFulfillmentByCases, buyerCasePrice, calculateLinePricing, calculateQuoteFinancials, formatMoney, palletConfigLabel, standardCasePrice, tierLabel } from "@/lib/pricing";
import type { PricingContext } from "@/lib/pricing";
import type { FulfillmentType, OrderRequest, Product } from "@/lib/types";

type ReceivingHub = "Miami hub" | "Orlando hub";

export default function CatalogClient({
  isAuthenticated,
  userId,
  userRole,
  isApproved = false
}: {
  isAuthenticated: boolean;
  userId?: string;
  userRole?: string;
  isApproved?: boolean;
}) {
  const { t } = useI18n();
  const { store, addToCart, addOrder, removeFromCart, updateCartQuantity, verifyDocuments } = useAtlasStore();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [hub, setHub] = useState("All hubs");
  const [buyerRegion, setBuyerRegion] = useState("South Florida");
  const [receivingHub, setReceivingHub] = useState<ReceivingHub>("Miami hub");
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("Pickup");
  const [submittedQuoteId, setSubmittedQuoteId] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState<{ src: string; label: string } | null>(null);
  const canSeePricing = isAuthenticated && (isApproved || store.documentsVerified);
  // Real tier: the admin's per-account assignment wins; otherwise the role default
  // (Atlas Reps buy at the rep tier, everyone else at the retailer reference tier).
  const accountEntry = userId ? (store.pricingSettings.accountPricing ?? []).find((entry) => entry.accountId === userId) : undefined;
  const buyerTierId = accountEntry?.tierId ?? (userRole === "route_seller" ? "atlas_rep" : store.currentTierId);
  // Buyer context drives explicit per-tier pricing; only applied once the buyer can see pricing.
  const pricingCtx: PricingContext | undefined = canSeePricing ? { tierId: buyerTierId, accountId: userId } : undefined;

  function guardAdd(product: Product) {
    if (!isAuthenticated) {
      window.location.href = "/login?next=/catalog";
      return;
    }
    addToCart(product);
  }

  const approved = store.products.filter((product) => product.status === "approved");
  const categories = ["All", ...Array.from(new Set(approved.map((product) => product.category)))];
  const filtered = useMemo(() => {
    const term = query.toLowerCase();
    return approved.filter((product) => {
      const matchesCategory = category === "All" || product.category === category;
      const matchesHub = hub === "All hubs" || product.preferredHub === hub;
      const matchesTerm = [product.brand, product.upc, product.description, product.sku, product.category, product.subcategory]
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
  const receiveAtNote = fulfillmentType === "Supplier direct" ? "" : ` • Receive at: ${receivingHub}`;
  const hubRouting =
    hubSummary.length === 0
      ? t("noHubRoute")
      : hubSummary.map(([hubName, cases]) => `${hubName}: ${cases} ${t("cases")}`).join(" + ") + receiveAtNote;
  const draftOrder: OrderRequest = {
    id: "DRAFT",
    buyer: "Current Retailer",
    buyerRegion,
    totalCases,
    estimatedValue: 0,
    fulfillmentType,
    destinationHub: receivingHub,
    hubRouting,
    lineItems: store.cart,
    status: "Quote requested",
    createdAt: new Date().toISOString().slice(0, 10)
  };
  const quoteFinancials = calculateQuoteFinancials(draftOrder, store.pricingSettings, undefined, pricingCtx);
  const fulfillmentAllocations = allocateFulfillmentByCases(draftOrder, quoteFinancials.fulfillmentFee);
  const estimatedQuoteTotal = quoteFinancials.buyerTotal;
  const hasSupplierDirectItems = store.cart.some((line) => line.product.preferredHub === "Supplier direct");
  const hubPickupAutoPriced = fulfillmentType === "Pickup" && !hasSupplierDirectItems;
  const checkoutMode = hubPickupAutoPriced ? t("hubPickupShelfPricing") : t("atlasQuoteReview");
  const orderActionLabel = hubPickupAutoPriced ? t("submitPickupOrder") : t("requestAtlasQuote");
  const orderActionBody = hubPickupAutoPriced ? t("pickupOrderBody") : t("quoteReviewBody");
  const fulfillmentGuidance = {
    Pickup: t("fulfillmentPickupGuide"),
    "Atlas consolidation hub": t("fulfillmentConsolidationGuide"),
    "Local delivery": t("fulfillmentLocalDeliveryGuide"),
    "Freight quote needed": t("fulfillmentFreightGuide"),
    "Supplier direct": t("fulfillmentSupplierDirectGuide")
  } satisfies Record<FulfillmentType, string>;
  const meetsCaseMinimum = totalCases >= store.pricingSettings.minimumMixedOrderCases;
  const meetsValueMinimum = estimatedQuoteTotal >= store.pricingSettings.minimumOrderValue;
  const canRequestQuote = store.cart.length > 0 && (meetsCaseMinimum || meetsValueMinimum);
  const minimumCaseProgress = Math.min(100, (totalCases / store.pricingSettings.minimumMixedOrderCases) * 100);
  const minimumValueProgress = Math.min(100, (estimatedQuoteTotal / store.pricingSettings.minimumOrderValue) * 100);
  const promotedProducts = approved
    .filter((product) => product.placements?.weeklyDeal || product.promotion)
    .slice(0, 4);
  const weeklyDeals = promotedProducts.length > 0 ? promotedProducts : approved.slice(0, 4);
  const remainingCases = Math.max(0, store.pricingSettings.minimumMixedOrderCases - totalCases);
  const remainingValue = Math.max(0, store.pricingSettings.minimumOrderValue - estimatedQuoteTotal);
  const nextActionTitle =
    store.cart.length === 0
      ? t("startWithProducts")
      : canRequestQuote
        ? hubPickupAutoPriced
          ? t("readyPickupOrder")
          : t("readyQuoteReview")
        : t("keepBuildingOrder");
  const nextActionBody =
    store.cart.length === 0
      ? t("addProductsMinimum")
      : canRequestQuote
        ? hubPickupAutoPriced
          ? t("pickupAutomatic")
          : t("atlasReviewsFinal")
        : `${t("addMoreMinimumPrefix")} ${remainingCases} ${t("addMoreMinimumMiddle")} ${formatMoney(remainingValue)} ${t("addMoreMinimumSuffix")}`;

  function requestQuote() {
    if (!isAuthenticated) {
      window.location.href = "/login?next=/catalog";
      return;
    }
    if (store.cart.length === 0) return;
    const id = `Q-${Math.floor(1000 + Math.random() * 9000)}`;
    addOrder({
      id,
      buyer: "Current Retailer",
      buyerRegion,
      totalCases: store.cart.reduce((sum, line) => sum + line.quantity, 0),
      estimatedValue: estimatedQuoteTotal,
      fulfillmentType,
      destinationHub: receivingHub,
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
        <section className="panel p-5 lg:col-span-2">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-atlas-blue">{t("buyingProcess")}</p>
              <h1 className="mt-1 text-2xl font-black text-atlas-navy">{t("catalogHeadline")}</h1>
            </div>
            <Link className="btn-secondary w-fit" href="/dashboard/retailer">
              {t("viewDashboard")}
            </Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <BuyerFlowStep number="1" title={t("chooseProducts")} body={t("chooseProductsBody")} active />
            <BuyerFlowStep number="2" title={t("pickOrderType")} body={t("pickOrderTypeBody")} active={store.cart.length > 0} />
            <BuyerFlowStep number="3" title={t("atlasConfirms")} body={t("atlasConfirmsBody")} active={canRequestQuote} />
          </div>
        </section>
        {weeklyDeals.length > 0 && (
          <section className="panel p-5 lg:col-span-2">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold uppercase text-atlas-blue">
                  <Sparkles size={16} />
                  {t("weeklyPromos")}
                </p>
                <h2 className="mt-1 text-xl font-black text-atlas-navy">{t("promosShowHere")}</h2>
              </div>
              <p className="max-w-xl text-sm text-slate-600">{t("promosAdminBody")}</p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {weeklyDeals.map((product) => (
                <DealCard key={`deal-${product.id}`} product={product} addToCart={guardAdd} />
              ))}
            </div>
          </section>
        )}
        <section className="grid gap-5">
          <div className="panel grid gap-4 p-5">
            <label className="grid gap-2">
              <span className="label">{t("searchProducts")}</span>
              <span className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input className="field pl-10" value={query} onChange={(event) => setQuery(event.target.value)} />
              </span>
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="grid gap-2">
                <span className="label">{t("category")}</span>
                <select className="field" value={category} onChange={(event) => setCategory(event.target.value)}>
                  {categories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="label">{t("atlasHub")}</span>
                <select className="field" value={hub} onChange={(event) => setHub(event.target.value)}>
                  <option>All hubs</option>
                  {atlasHubs.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="label">{t("buyerRegion")}</span>
                <select className="field" value={buyerRegion} onChange={(event) => setBuyerRegion(event.target.value)}>
                  <option>South Florida</option>
                  <option>Central Florida</option>
                  <option>North Florida</option>
                  <option>Out of state</option>
                </select>
              </label>
            </div>
          </div>
          {!isAuthenticated ? (
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-atlas-navy">
              {t("signInToSeePricing")}
              <Link className="ml-3 font-bold text-atlas-blue underline" href="/login?next=/catalog">
                {t("signIn")}
              </Link>
            </div>
          ) : !store.documentsVerified ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {t("docsHidden")}
              <button className="ml-3 font-bold text-atlas-blue underline" type="button" onClick={verifyDocuments}>
                {t("markDemoDocs")}
              </button>
            </div>
          ) : null}
          <div className="grid gap-4">
            {filtered.map((product) => (
              <article key={product.id} className="panel p-5">
                <div className="grid gap-4 lg:grid-cols-[128px_1fr_180px] lg:items-start">
                  {isPlaceholderImage(product) ? (
                    <div className="h-32 w-32 overflow-hidden rounded-md border border-slate-200">
                      <ProductImage product={product} className="h-full w-full" iconSize={42} />
                    </div>
                  ) : (
                    <button
                      className="h-32 w-32 overflow-hidden rounded-md border border-slate-200 bg-white transition hover:border-atlas-blue focus:outline-none focus:ring-2 focus:ring-atlas-blue"
                      type="button"
                      onClick={() => setExpandedImage({ src: product.imageUrl, label: `${product.brand} ${product.description}` })}
                      aria-label={`Expand ${product.brand} product image`}
                    >
                      <ProductImage product={product} className="h-full w-full" />
                    </button>
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge bg-slate-100 text-slate-600">{product.category} / {product.subcategory}</span>
                      {product.promotion && (
                        <span className="badge bg-red-50 text-atlas-red">
                          <Tag size={13} />
                          {product.promotion}
                        </span>
                      )}
                    </div>
                    <h2 className="mt-3 text-xl font-black text-atlas-navy">{product.brand}</h2>
                    <p className="mt-1 text-slate-700">{product.description}</p>
                    <dl className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                      <div><dt className="font-bold">SKU</dt><dd>{product.sku}</dd></div>
                      <div><dt className="font-bold">UPC</dt><dd>{product.upc}</dd></div>
                    <div><dt className="font-bold">{t("directMoq")}</dt><dd>{product.moq} {t("cases")}</dd></div>
                      <div><dt className="font-bold">{t("productDimensions")}</dt><dd>{product.productDimensions || t("notProvided")}</dd></div>
                      <div><dt className="font-bold">{t("caseDimensions")}</dt><dd>{product.caseDimensions || t("notProvided")}</dd></div>
                      <div><dt className="font-bold">{t("palletConfiguration")}</dt><dd>{palletConfigLabel(product) || t("notProvided")}</dd></div>
                      <div><dt className="font-bold">{t("casePack")}</dt><dd>{product.casePack}</dd></div>
                      <div><dt className="font-bold">{t("inventory")}</dt><dd>{product.inventoryAvailable}</dd></div>
                      <div><dt className="font-bold">{t("location")}</dt><dd>{product.location}</dd></div>
                      <div><dt className="font-bold">{t("atlasHub")}</dt><dd>{product.preferredHub ?? "Orlando hub"}</dd></div>
                    </dl>
                    <p className="mt-3 flex max-w-2xl gap-2 rounded-md bg-atlas-light p-3 text-sm text-slate-700">
                      <MapPin className="mt-0.5 shrink-0 text-atlas-blue" size={17} />
                      {product.routeRecommendation ?? t("defaultRouteRecommendation")}
                    </p>
                  </div>
                  <div className="rounded-lg bg-atlas-light p-4">
                    {(() => {
                      const standard = standardCasePrice(product, store.pricingSettings);
                      const yourPrice = buyerCasePrice({ settings: store.pricingSettings, product, tierId: buyerTierId, accountId: userId });
                      const discounted = yourPrice < standard - 0.001;
                      const msrp = product.suggestedRetail || 0;
                      const marginPct = msrp > 0 && yourPrice > 0 ? Math.round(((msrp - yourPrice) / msrp) * 100) : 0;
                      return (
                        <>
                          <p className="text-xs font-bold uppercase text-slate-500">
                            {canSeePricing ? `${t("yourPrice")} · ${tierLabel(store.pricingSettings, buyerTierId)}` : t("estimatedQuotePrice")}
                          </p>
                          <p className="mt-1 flex items-baseline gap-2 text-2xl font-black text-atlas-navy">
                            {!canSeePricing ? t("locked") : yourPrice > 0 ? `${formatMoney(yourPrice)} / ${t("caseLabel")}` : t("pricePending")}
                            {canSeePricing && discounted && yourPrice > 0 && (
                              <span className="text-sm font-semibold text-slate-400 line-through">{formatMoney(standard)}</span>
                            )}
                          </p>
                          {canSeePricing && msrp > 0 && (
                            <p className="mt-1 text-xs font-semibold text-emerald-700">
                              {t("msrpLabel")} {formatMoney(msrp)}{marginPct > 0 ? ` · ${marginPct}% ${t("marginLabel")}` : ""}
                            </p>
                          )}
                        </>
                      );
                    })()}
                    <p className="mt-1 text-sm text-slate-600">{t("looseEstimate")}</p>
                    <button className="btn-primary mt-4 w-full" type="button" onClick={() => guardAdd(product)}>
                      <ShoppingCart size={16} />
                      {t("quickAdd")}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
        <aside className="panel h-fit p-5">
          <h2 className="text-xl font-black text-atlas-navy">{t("quoteCart")}</h2>
          <div className="mt-4 rounded-md border border-slate-200 bg-atlas-light p-3 text-sm">
            <p className="flex items-center gap-2 font-black text-atlas-navy">
              <CheckCircle2 size={17} className={canRequestQuote ? "text-emerald-600" : "text-atlas-blue"} />
              {nextActionTitle}
            </p>
            <p className="mt-1 text-slate-600">{nextActionBody}</p>
          </div>
          {submittedQuoteId && (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <p className="font-black">{hubPickupAutoPriced ? t("pickupOrderSubmitted") : t("quoteRequestSubmitted")}</p>
              <p className="mt-1">
                {hubPickupAutoPriced
                  ? t("pickupOrderReadyBody")
                  : t("quoteReviewSubmittedBody")}
              </p>
              <Link className="mt-2 inline-block font-bold text-atlas-blue underline" href={`/quotes/${submittedQuoteId}`}>
                {t("viewQuoteDetail")}
              </Link>
            </div>
          )}
          <div className="mt-4 grid gap-3">
            {store.cart.length === 0 ? (
              <p className="text-sm text-slate-600">{t("emptyCart")}</p>
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
                  <p className="text-slate-600">{line.quantity} {t("cases")} • {line.product.sku}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-atlas-blue">
                    {line.product.preferredHub ?? "Orlando hub"}
                    {fulfillmentType !== "Supplier direct" &&
                      (line.product.preferredHub === "Miami hub" || line.product.preferredHub === "Orlando hub") &&
                      line.product.preferredHub !== receivingHub && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                          <ArrowLeftRight size={11} />
                          {t("transfersFrom")} {line.product.preferredHub}
                        </span>
                      )}
                  </p>
                  {(() => {
                    const linePricing = calculateLinePricing(line, store.pricingSettings, undefined, pricingCtx);
                    const allocation = fulfillmentAllocations.find((item) => item.productId === line.product.id)?.allocation ?? 0;
                    const casesToPallet =
                      linePricing.palletSize > 0 && linePricing.looseCases > 0
                        ? linePricing.palletSize - (line.quantity % linePricing.palletSize)
                        : 0;
                    return (
                      <div className="mt-2 rounded-md bg-atlas-light p-2 text-xs text-slate-700">
                        {linePricing.pricingModel === "Supplier direct fulfillment fee" ? (
                          <p>{linePricing.supplierDirectCases} {t("supplierDirectCases")} at {formatMoney(linePricing.casePrice)}</p>
                        ) : (
                          <>
                            <p>{linePricing.palletCases} {t("palletPricedCases")} at {formatMoney(linePricing.palletPrice)}</p>
                            <p>{linePricing.looseCases} {t("looseCases")} at {formatMoney(linePricing.casePrice)}</p>
                            {casesToPallet > 0 && (
                              <p className="mt-1 font-semibold text-emerald-700">
                                +{casesToPallet} {t("toPalletRate")} ({linePricing.palletSize} {t("perPallet")})
                              </p>
                            )}
                          </>
                        )}
                        {quoteFinancials.fulfillmentFee > 0 && (
                          <p className="mt-1 font-semibold text-atlas-blue">{t("fulfillmentShare")}: {formatMoney(allocation)}</p>
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
                      {t("mixedCaseHelp")} {t("directMoq")} {line.product.moq} • {t("available")} {line.product.inventoryAvailable}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 rounded-md bg-atlas-light p-3 text-sm">
            <p className="font-black text-atlas-navy">{t("hubRoute")}</p>
            <p className="mt-1 text-slate-600">{hubRouting}</p>
            <p className="mt-2 text-xs font-semibold text-atlas-blue">{t("buyerRegion")}: {buyerRegion}</p>
          </div>
          <div className={`mt-4 rounded-md border p-3 text-sm ${hubPickupAutoPriced ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
            <p className="font-black">{checkoutMode}</p>
            <p className="mt-1">
              {orderActionBody}
            </p>
          </div>
          <div className="mt-4 rounded-md border border-slate-200 p-3 text-sm">
            <p className="font-black text-atlas-navy">{t("afterSubmit")}</p>
            <div className="mt-3 grid gap-2">
              <BuyerStep
                active
                title={t("submitCart")}
                body={`${totalCases} ${t("cases")} from ${hubSummary.length || 0} ${hubSummary.length === 1 ? t("routeLabel") : t("routesLabel")}`}
              />
              <BuyerStep
                active={!hubPickupAutoPriced}
                title={hubPickupAutoPriced ? t("atlasConfirmsPickup") : t("atlasBuildsQuote")}
                body={hubPickupAutoPriced ? t("pickupConfirmBody") : t("quoteBuildBody")}
              />
              <BuyerStep
                title={hubPickupAutoPriced ? t("pickupReady") : t("receiveFinalQuote")}
                body={hubPickupAutoPriced ? t("pickupFinalStepBody") : t("quoteFinalStepBody")}
              />
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            <span className="label">{t("receiveOrderAt")}</span>
            <div className="grid grid-cols-2 gap-2">
              {(["Miami hub", "Orlando hub"] as ReceivingHub[]).map((hubOption) => (
                <button
                  key={hubOption}
                  className={`flex items-center justify-center gap-2 rounded-md border p-3 text-sm font-black transition ${
                    receivingHub === hubOption
                      ? "border-atlas-blue bg-sky-50 text-atlas-navy"
                      : "border-slate-200 bg-white text-slate-700 hover:border-atlas-blue"
                  }`}
                  type="button"
                  onClick={() => setReceivingHub(hubOption)}
                >
                  <Warehouse size={16} className={receivingHub === hubOption ? "text-atlas-blue" : "text-slate-400"} />
                  {hubOption}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">{t("receiveHubHelp")}</p>
            {quoteFinancials.transferCases > 0 && (
              <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs font-semibold text-amber-900">
                <ArrowLeftRight size={14} className="mt-0.5 shrink-0" />
                {t("crossDockTransfer")}: {quoteFinancials.transferCases} {t("cases")} → {receivingHub} ({formatMoney(quoteFinancials.transferFee)})
              </p>
            )}
          </div>
          <div className="mt-4 grid gap-2">
            <span className="label">{t("chooseFulfillment")}</span>
            <div className="grid gap-2">
              {fulfillmentTypes.map((item) => (
                <button
                  key={item}
                  className={`rounded-md border p-3 text-left text-sm transition ${
                    fulfillmentType === item
                      ? "border-atlas-blue bg-sky-50 text-atlas-navy"
                      : "border-slate-200 bg-white text-slate-700 hover:border-atlas-blue"
                  }`}
                  type="button"
                  onClick={() => setFulfillmentType(item)}
                >
                  <span className="font-black">{item}</span>
                  <span className="mt-1 block text-xs font-semibold">{fulfillmentGuidance[item]}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 font-bold">
            <span>{t("productSubtotal")}</span>
            <span>{formatMoney(quoteFinancials.productRevenue)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm font-bold">
            <span>{fulfillmentType === "Local delivery" ? t("estimatedDeliveryFulfillment") : t("estimatedFulfillment")}</span>
            <span>{formatMoney(quoteFinancials.fulfillmentFee)}</span>
          </div>
          {quoteFinancials.transferFee > 0 && (
            <div className="mt-1 flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>↳ {t("crossDockTransfer")} ({quoteFinancials.transferCases} {t("cases")}, {t("includedInFulfillment")})</span>
              <span>{formatMoney(quoteFinancials.transferFee)}</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between text-lg font-black text-atlas-navy">
            <span>{hubPickupAutoPriced ? t("pickupTotal") : t("estimatedQuoteTotal")}</span>
            <span>{formatMoney(estimatedQuoteTotal)}</span>
          </div>
          <div className="mt-4 rounded-md border border-slate-200 p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold text-atlas-navy">{t("mixedOrderMinimum")}</span>
              <span className={canRequestQuote ? "font-bold text-emerald-700" : "font-bold text-amber-700"}>
                {canRequestQuote ? t("ready") : t("keepAdding")}
              </span>
            </div>
            <div className="mt-3 grid gap-2">
              <MinimumMeter label={`${totalCases}/${store.pricingSettings.minimumMixedOrderCases} cases`} percent={minimumCaseProgress} />
              <MinimumMeter label={`${formatMoney(estimatedQuoteTotal)}/${formatMoney(store.pricingSettings.minimumOrderValue)}`} percent={minimumValueProgress} />
            </div>
            <p className="mt-2 text-xs text-slate-600">
              {t("minimumHelp")}
            </p>
          </div>
          <button className="btn-danger mt-4 w-full" type="button" disabled={!canRequestQuote} onClick={requestQuote}>
            {orderActionLabel}
          </button>
        </aside>
      </main>
      {expandedImage && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-atlas-navy/70 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl rounded-lg bg-white p-4 shadow-panel">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-atlas-navy">{expandedImage.label}</h2>
              <button className="btn-secondary px-3" type="button" onClick={() => setExpandedImage(null)}>
                {t("close")}
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

function BuyerStep({ title, body, active = false }: { title: string; body: string; active?: boolean }) {
  return (
    <div className={`rounded-md p-3 ${active ? "bg-sky-50 text-atlas-navy" : "bg-atlas-light text-slate-700"}`}>
      <p className="font-black">{title}</p>
      <p className="mt-1 text-xs font-semibold">{body}</p>
    </div>
  );
}

function BuyerFlowStep({ number, title, body, active = false }: { number: string; title: string; body: string; active?: boolean }) {
  return (
    <div className={`rounded-md border p-4 ${active ? "border-atlas-blue bg-sky-50" : "border-slate-200 bg-white"}`}>
      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${active ? "bg-atlas-blue text-white" : "bg-slate-100 text-slate-500"}`}>
        {number}
      </span>
      <h2 className="mt-3 text-lg font-black text-atlas-navy">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
    </div>
  );
}

function DealCard({ product, addToCart }: { product: Product; addToCart: (product: Product) => void }) {
  const { t } = useI18n();

  return (
    <article className="rounded-md border border-slate-200 bg-white p-3">
      <div className="flex gap-3">
        <ProductImage product={product} className="h-16 w-16 shrink-0 rounded-md border border-slate-200" iconSize={22} />
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-atlas-navy">{product.brand}</p>
          <p className="line-clamp-2 text-xs font-semibold text-slate-600">{product.description}</p>
          <p className="mt-1 text-xs font-bold text-atlas-blue">{product.preferredHub ?? "Supplier direct"}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="badge bg-red-50 text-atlas-red">
          <Tag size={13} />
          {product.promotion || t("featured")}
        </span>
        <button className="btn-secondary px-3 py-2 text-xs" type="button" onClick={() => addToCart(product)}>
          {t("add")}
        </button>
      </div>
    </article>
  );
}
