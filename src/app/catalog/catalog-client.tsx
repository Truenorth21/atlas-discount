"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeftRight, Boxes, CheckCircle2, Heart, MessageCircle, Minus, Plus, Search, ShoppingCart, Snowflake, Sparkles, Tag, Trash2, Truck, Warehouse, X } from "lucide-react";
import { Nav } from "@/components/nav";
import { ProductImage, isPlaceholderImage } from "@/components/product-image";
import { DashboardHero } from "@/components/dashboard-hero";
import { atlasHubs, fulfillmentTypes, isSingleHub, productCategories, productCollections, readHomeHub, whatsappLink, writeHomeHub } from "@/lib/data";

// Short chip labels for the full category names.
const categoryChipLabels: Record<string, string> = {
  "Janitorial / Cleaning Supplies": "Cleaning",
  "Grocery / Pantry": "Grocery / Pantry",
  "Health & Beauty (HBA)": "Health & Beauty",
  "Office / Paper": "Office / Paper",
  "Foodservice / Disposables": "Foodservice",
  "Closeout / Special buys": "Closeout buys"
};
import { useAtlasStore } from "@/components/local-store";
import { useI18n } from "@/lib/i18n";
import { buyerCasePrice, calculateLinePricing, calculateQuoteFinancials, formatMoney, palletConfigLabel, standardCasePrice, tierLabel, tierMarginPct } from "@/lib/pricing";
import type { PricingContext } from "@/lib/pricing";
import { caseWeightLb, planOrderPallets, resolvedCasesPerPallet } from "@/lib/pallets";
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
  const { store, addToCart, addOrder, removeFromCart, updateCartQuantity, verifyDocuments, toggleFavorite, reorder, setCurrentTier } = useAtlasStore();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [subcategory, setSubcategory] = useState("All");
  const [brand, setBrand] = useState("All");
  const [collection, setCollection] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [hub, setHub] = useState("All hubs");
  const [buyerRegion, setBuyerRegion] = useState("South Florida");
  const [receivingHub, setReceivingHub] = useState<ReceivingHub>("Miami hub");
  // The receiving hub IS the home hub picked in the top bar — one source of truth.
  useEffect(() => {
    setReceivingHub(readHomeHub());
    const onHubChange = (event: Event) => {
      const next = (event as CustomEvent<ReceivingHub>).detail;
      if (next === "Miami hub" || next === "Orlando hub") setReceivingHub(next);
    };
    window.addEventListener("atlas-home-hub", onHubChange);
    return () => window.removeEventListener("atlas-home-hub", onHubChange);
  }, []);
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("Pickup");
  const [submittedQuoteId, setSubmittedQuoteId] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  // Admins can preview the buyer catalog: they see pricing and can switch the buyer tier.
  const isAdminPreview = userRole === "admin";
  const canSeePricing = (isAuthenticated && (isApproved || store.documentsVerified)) || isAdminPreview;
  // Buy tier: the admin's per-account assignment wins; otherwise the role default.
  // Sales reps don't buy at a rep price — if they shop, they use retailer pricing.
  const accountEntry = userId ? (store.pricingSettings.accountPricing ?? []).find((entry) => entry.accountId === userId) : undefined;
  const buyerTierId = accountEntry?.tierId ?? (userRole === "route_seller" ? "retailer" : store.currentTierId);
  // Buyer context drives explicit per-tier pricing; only applied once the buyer can see pricing.
  const pricingCtx: PricingContext | undefined = canSeePricing ? { tierId: buyerTierId, accountId: userId } : undefined;

  // Display label for the hub a product lives at: drop-ship items skip the hubs.
  const hubText = (hub?: string | null) => (hub === "Supplier direct" ? t("dropShip") : hub ?? "Orlando hub");

  function guardAdd(product: Product, quantity = 1) {
    if (!isAuthenticated) {
      window.location.href = "/login?next=/catalog";
      return;
    }
    addToCart(product, Math.max(1, Math.floor(quantity) || 1));
    setCartOpen(true);
  }

  const approved = store.products.filter((product) => product.status === "approved");
  const categories = ["All", ...Array.from(new Set(approved.map((product) => product.category)))];
  // Subcategories for the selected category; brands present in the current category.
  const subcategories = ["All", ...Array.from(new Set(approved.filter((p) => category === "All" || p.category === category).map((p) => p.subcategory).filter(Boolean)))];
  const brands = ["All", ...Array.from(new Set(approved.map((p) => p.brand).filter(Boolean))).sort((a, b) => a.localeCompare(b))];

  const filtered = useMemo(() => {
    const term = query.toLowerCase();
    const activeCollection = productCollections.find((c) => c.id === collection);
    const list = approved.filter((product) => {
      const matchesCategory = category === "All" || product.category === category;
      const matchesSub = subcategory === "All" || product.subcategory === subcategory;
      const matchesBrand = brand === "All" || product.brand === brand;
      const matchesHub = hub === "All hubs" || product.preferredHub === hub;
      // Full text (incl. description) powers free-text search.
      const searchHaystack = [product.brand, product.upc, product.description, product.sku, product.category, product.subcategory, product.productName]
        .join(" ")
        .toLowerCase();
      // Collection keyword matching uses only structured fields — never the long
      // marketing description — so a soap isn't tagged a "beverage" for saying "water".
      const collectionHaystack = [product.brand, product.productName, product.category, product.subcategory]
        .join(" ")
        .toLowerCase();
      const matchesTerm = searchHaystack.includes(term);
      const matchesCollection =
        collection === "all" ||
        (collection === "favorites" ? store.favorites.includes(product.id) : !!activeCollection?.keywords.some((k) => collectionHaystack.includes(k)));
      return matchesCategory && matchesSub && matchesBrand && matchesHub && matchesTerm && matchesCollection;
    });
    const price = (p: Product) => buyerCasePrice({ settings: store.pricingSettings, product: p, tierId: buyerTierId, accountId: userId });
    const sorted = [...list];
    if (sortBy === "priceAsc") sorted.sort((a, b) => price(a) - price(b));
    else if (sortBy === "priceDesc") sorted.sort((a, b) => price(b) - price(a));
    else if (sortBy === "name") sorted.sort((a, b) => a.brand.localeCompare(b.brand));
    else if (sortBy === "newest") sorted.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    else sorted.sort((a, b) => Number(Boolean(b.placements?.homepageFeatured)) - Number(Boolean(a.placements?.homepageFeatured)));
    return sorted;
  }, [approved, category, subcategory, brand, hub, query, sortBy, collection, store.favorites, store.pricingSettings, buyerTierId, userId]);

  const lastOrder = store.orders.find((order) => (order.lineItems?.length ?? 0) > 0);
  const totalCases = store.cart.reduce((sum, line) => sum + line.quantity, 0);
  // Buyer-facing pallet + weight read. Cases-per-pallet comes from each product's
  // config or its case dimensions; weight from case weights.
  const palletOpts = {
    maxPalletWeightLb: store.pricingSettings.maxPalletWeightLb,
    maxPalletHeightIn: store.pricingSettings.maxPalletHeightIn,
    palletBaseHeightIn: store.pricingSettings.palletBaseHeightIn,
    palletLengthIn: store.pricingSettings.palletLengthIn,
    palletWidthIn: store.pricingSettings.palletWidthIn
  };
  const cartPalletPlan = planOrderPallets(store.cart, palletOpts);
  const cartTotalWeightLb = Math.round(store.cart.reduce((sum, line) => sum + caseWeightLb(line.product) * line.quantity, 0));
  const hubSummary = Array.from(
    store.cart.reduce((summary, line) => {
      const hubName = line.product.preferredHub ?? "Supplier direct";
      summary.set(hubName, (summary.get(hubName) ?? 0) + line.quantity);
      return summary;
    }, new Map<string, number>())
  );
  // No hub "receive at" when the whole cart drop-ships (nothing is staged at a hub).
  const cartAllDropShip = store.cart.length > 0 && store.cart.every((line) => line.product.preferredHub === "Supplier direct");
  const receiveAtNote = fulfillmentType === "Supplier direct" || cartAllDropShip ? "" : ` • Receive at: ${receivingHub}`;
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
  const baseFinancials = calculateQuoteFinancials(draftOrder, store.pricingSettings, undefined, pricingCtx);
  const freeDeliveryThreshold = store.pricingSettings.freeDeliveryThreshold ?? 0;
  const qualifiesFreeDelivery = freeDeliveryThreshold > 0 && baseFinancials.productRevenue >= freeDeliveryThreshold;
  const freeDeliveryRemaining = Math.max(0, freeDeliveryThreshold - baseFinancials.productRevenue);
  const quoteFinancials =
    qualifiesFreeDelivery && fulfillmentType === "Local delivery"
      ? calculateQuoteFinancials(draftOrder, store.pricingSettings, { orderId: "DRAFT", freeDelivery: true }, pricingCtx)
      : baseFinancials;
  const estimatedQuoteTotal = quoteFinancials.buyerTotal;
  const hasSupplierDirectItems = store.cart.some((line) => line.product.preferredHub === "Supplier direct");
  const allDropShip = cartAllDropShip;
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
  // Each product carries its own minimum (cases and/or value). A line passes if it
  // meets the case minimum OR the dollar-value minimum.
  function lineMeetsMinimum(line: { product: Product; quantity: number }) {
    const minCases = line.product.moq || 1;
    const minValue = line.product.minOrderValue || 0;
    if (line.quantity >= minCases) return true;
    if (minValue > 0) {
      const price = buyerCasePrice({ settings: store.pricingSettings, product: line.product, tierId: buyerTierId, accountId: userId });
      return price > 0 && line.quantity * price >= minValue;
    }
    return false;
  }
  const linesBelowMin = store.cart.filter((line) => !lineMeetsMinimum(line));
  const canRequestQuote = store.cart.length > 0 && linesBelowMin.length === 0;
  const promotedProducts = approved
    .filter((product) => product.placements?.weeklyDeal || product.promotion)
    .slice(0, 4);
  const weeklyDeals = promotedProducts.length > 0 ? promotedProducts : approved.slice(0, 4);
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
        : `${linesBelowMin.length} ${linesBelowMin.length === 1 ? t("itemBelowMin") : t("itemsBelowMin")}`;

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
      <main className="atlas-container grid gap-6 py-8">
        {isAdminPreview && (
          <section className="rounded-lg border border-atlas-blue bg-sky-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-atlas-blue">Admin preview</p>
                <p className="mt-0.5 text-sm text-slate-700">
                  You&apos;re viewing the buyer catalog as a customer. Switch the price level to see exactly what each tier sees.
                </p>
              </div>
              <Link className="btn-secondary w-fit" href="/admin">
                Back to admin
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Viewing as:</span>
              {(store.pricingSettings.customerTiers ?? []).map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setCurrentTier(tier.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-black ${
                    buyerTierId === tier.id ? "border-atlas-blue bg-atlas-blue text-white" : "border-slate-300 bg-white text-atlas-navy hover:border-atlas-blue"
                  }`}
                >
                  {tier.label}
                </button>
              ))}
              <span className="mx-1 h-4 w-px bg-slate-300" />
              <Link className="text-xs font-bold text-atlas-blue hover:underline" href="/dashboard/retailer">Buyer dashboard</Link>
              <Link className="text-xs font-bold text-atlas-blue hover:underline" href="/dashboard/supplier">Supplier dashboard</Link>
              <Link className="text-xs font-bold text-atlas-blue hover:underline" href="/dashboard/route-seller">Sales rep dashboard</Link>
            </div>
          </section>
        )}
        <DashboardHero
          title={t("shopWholesale")}
          action={
            <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/30 bg-white/5 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-white/15" href="/dashboard/retailer">
              {t("viewDashboard")}
            </Link>
          }
        />
        {weeklyDeals.length > 0 && (
          <section className="panel p-5">
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
        <section className="grid gap-4">
          <div className="panel p-3">
            <span className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input className="field pl-10" placeholder={t("searchProducts")} value={query} onChange={(event) => setQuery(event.target.value)} />
            </span>
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

          {/* Buy again — reorder the most recent order */}
          {isAuthenticated && lastOrder && (
            <div className="panel flex flex-wrap items-center justify-between gap-3 border-atlas-blue/30 bg-sky-50 p-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-black text-atlas-navy">
                  <ShoppingCart size={16} className="text-atlas-blue" />
                  {t("buyAgain")}
                </p>
                <p className="text-xs text-slate-600">
                  {(lastOrder.lineItems ?? []).slice(0, 3).map((l) => l.product.brand).join(", ")}
                  {(lastOrder.lineItems?.length ?? 0) > 3 ? "…" : ""}
                </p>
              </div>
              <button
                className="btn-primary"
                type="button"
                onClick={() => { reorder(lastOrder); setCartOpen(true); }}
              >
                {t("addAllToCart")}
              </button>
            </div>
          )}

          {/* Quick filters: curated collections + real product categories */}
          <div className="flex flex-wrap items-center gap-2">
            {[{ id: "all", label: t("allProducts") }, { id: "favorites", label: `★ ${t("favorites")}` }, ...productCollections].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { setCollection(c.id); setCategory("All"); setSubcategory("All"); }}
                className={`rounded-full border px-3 py-1.5 text-sm font-bold transition ${
                  collection === c.id && category === "All" ? "border-atlas-blue bg-atlas-blue text-white" : "border-slate-200 bg-white text-atlas-navy hover:border-atlas-blue"
                }`}
              >
                {c.label}
              </button>
            ))}
            <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" aria-hidden />
            {Object.keys(productCategories).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => { setCategory(name); setSubcategory("All"); setCollection("all"); }}
                className={`rounded-full border px-3 py-1.5 text-sm font-bold transition ${
                  category === name ? "border-atlas-blue bg-atlas-blue text-white" : "border-slate-200 bg-white text-atlas-navy hover:border-atlas-blue"
                }`}
              >
                {categoryChipLabels[name] ?? name}
              </button>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
            {/* Browse sidebar */}
            <aside className="grid h-fit gap-4">
              <div className="panel p-4">
                <h3 className="text-xs font-black uppercase tracking-wide text-slate-500">{t("departments")}</h3>
                <div className="mt-2 grid gap-0.5">
                  {categories.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => { setCategory(item); setSubcategory("All"); setCollection("all"); }}
                      className={`rounded px-2 py-1.5 text-left text-sm transition ${category === item ? "bg-atlas-blue font-bold text-white" : "text-atlas-navy hover:bg-atlas-light"}`}
                    >
                      {item === "All" ? t("allDepartments") : item}
                    </button>
                  ))}
                </div>
                {category !== "All" && subcategories.length > 1 && (
                  <div className="mt-3 border-t border-slate-200 pt-2">
                    {subcategories.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setSubcategory(item)}
                        className={`block w-full rounded px-2 py-1 text-left text-xs transition ${subcategory === item ? "font-bold text-atlas-blue" : "text-slate-600 hover:text-atlas-blue"}`}
                      >
                        {item === "All" ? t("allOf") + " " + category : item}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="panel grid gap-3 p-4">
                <label className="grid gap-1">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">{t("brandLabel")}</span>
                  <select className="field h-9 min-h-9" value={brand} onChange={(event) => setBrand(event.target.value)}>
                    {brands.map((item) => (
                      <option key={item} value={item}>{item === "All" ? t("allBrands") : item}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">{t("atlasHub")}</span>
                  <select className="field h-9 min-h-9" value={hub} onChange={(event) => setHub(event.target.value)}>
                    <option>All hubs</option>
                    {atlasHubs.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-black uppercase tracking-wide text-slate-500">{t("buyerRegion")}</span>
                  <select className="field h-9 min-h-9" value={buyerRegion} onChange={(event) => setBuyerRegion(event.target.value)}>
                    <option>South Florida</option>
                    <option>Central Florida</option>
                    <option>North Florida</option>
                    <option>Out of state</option>
                  </select>
                </label>
              </div>
            </aside>

            {/* Product grid + sort toolbar */}
            <div className="grid content-start gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-500">
                  {filtered.length} {filtered.length === 1 ? t("productLabel") : t("productsLabel")}
                </p>
                <label className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-slate-500">{t("sortLabel")}</span>
                  <select className="field h-9 min-h-9 w-44" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                    <option value="featured">{t("sortFeatured")}</option>
                    <option value="priceAsc">{t("sortPriceLow")}</option>
                    <option value="priceDesc">{t("sortPriceHigh")}</option>
                    <option value="name">{t("sortNameAZ")}</option>
                    <option value="newest">{t("sortNewest")}</option>
                  </select>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((product) => (
                  <StoreProductCard
                    key={product.id}
                    product={product}
                    canSeePricing={canSeePricing}
                    settings={store.pricingSettings}
                    buyerTierId={buyerTierId}
                    userId={userId}
                    isFavorite={store.favorites.includes(product.id)}
                    onToggleFav={() => toggleFavorite(product.id)}
                    onExpand={() => setExpandedImage(product)}
                    onAdd={(qty) => guardAdd(product, qty)}
                  />
                ))}
                {filtered.length === 0 && <p className="text-sm text-slate-600">{t("noProductsMatch")}</p>}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Floating support (WhatsApp) button */}
      <a
        href={whatsappLink(t("supportPrefill"))}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 left-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-panel transition hover:bg-emerald-600"
        aria-label={t("navSupport")}
      >
        <MessageCircle size={22} />
      </a>

      {/* Floating cart button (always-visible running total) */}
      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-atlas-blue px-5 py-3 font-bold text-white shadow-panel transition hover:bg-atlas-navy"
      >
        <ShoppingCart size={18} />
        {totalCases > 0 ? `${totalCases} ${t("cases")} · ${formatMoney(estimatedQuoteTotal)}` : t("quoteCart")}
        {totalCases > 0 && (
          <span className="ml-1 rounded-full bg-white px-2 py-0.5 text-xs font-black text-atlas-blue">{store.cart.length}</span>
        )}
      </button>

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-atlas-navy/45" role="dialog" aria-modal="true">
          <button className="absolute inset-0 cursor-default" type="button" aria-label={t("close")} onClick={() => setCartOpen(false)} />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black text-atlas-navy">{t("quoteCart")}</h2>
              <button className="rounded-md p-2 text-slate-500 hover:bg-atlas-light hover:text-atlas-navy" type="button" onClick={() => setCartOpen(false)} aria-label={t("close")}>
                <X size={22} />
              </button>
            </div>
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
                    <div className="flex min-w-0 items-start gap-2.5">
                      <ProductImage product={line.product} className="h-10 w-10 shrink-0 rounded-md border border-slate-200" iconSize={18} />
                      <div className="min-w-0">
                        <p className="font-bold">{line.product.brand}</p>
                        {line.product.productName && <p className="text-xs text-slate-500">{line.product.productName}</p>}
                      </div>
                    </div>
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
                  {!isSingleHub && (
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-atlas-blue">
                      {hubText(line.product.preferredHub)}
                      {line.product.preferredHub === "Supplier direct" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-bold text-violet-700">
                          <Truck size={11} />
                          {t("shipsFromSupplier")}
                        </span>
                      )}
                      {fulfillmentType !== "Supplier direct" &&
                        (line.product.preferredHub === "Miami hub" || line.product.preferredHub === "Orlando hub") &&
                        line.product.preferredHub !== receivingHub && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                            <ArrowLeftRight size={11} />
                            {t("transfersFrom")} {line.product.preferredHub}
                          </span>
                        )}
                    </p>
                  )}
                  {(() => {
                    const linePricing = calculateLinePricing(line, store.pricingSettings, undefined, pricingCtx);
                    // Buyers want one number: their blended price per case and the line total.
                    // The pallet-vs-loose mechanics stay on the admin side.
                    const perCase = line.quantity > 0 ? linePricing.revenue / line.quantity : 0;
                    // Only nudge toward a full pallet when it actually costs less per case.
                    const palletSaves = linePricing.palletPrice > 0 && linePricing.palletPrice < linePricing.casePrice - 0.001;
                    const casesToPallet =
                      palletSaves && linePricing.palletSize > 0 && linePricing.looseCases > 0
                        ? linePricing.palletSize - (line.quantity % linePricing.palletSize)
                        : 0;
                    return (
                      <>
                        <div className="mt-2 flex items-center justify-between rounded-md bg-atlas-light p-2 text-xs">
                          <span className="font-semibold text-slate-600">
                            {line.quantity} × {formatMoney(perCase)}/{t("caseLabel")}
                          </span>
                          <span className="text-sm font-black text-atlas-navy">{formatMoney(linePricing.revenue)}</span>
                        </div>
                        {casesToPallet > 0 && (
                          <p className="mt-1 text-[11px] font-semibold text-emerald-700">
                            {t("addMore")} {casesToPallet} {t("cases")} → {t("palletPriceLabel")} {formatMoney(linePricing.palletPrice)}/{t("caseLabel")}
                          </p>
                        )}
                      </>
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
                        max={line.product.inventoryAvailable > 0 ? line.product.inventoryAvailable : undefined}
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
                      {t("directMoq")} {line.product.moq} {t("cases")}
                      {line.product.inventoryAvailable > 0 ? ` • ${t("available")} ${line.product.inventoryAvailable}` : ""}
                    </p>
                    {(() => {
                      const cpp = resolvedCasesPerPallet(line.product, palletOpts);
                      if (cpp <= 0) return null;
                      const fullPallets = Math.floor(line.quantity / cpp);
                      const toNext = cpp - (line.quantity % cpp);
                      return (
                        <p className="text-xs font-semibold text-atlas-blue">
                          {cpp} {t("cases")} = 1 {t("palletWord")}
                          {fullPallets > 0 && ` • ${fullPallets} ${fullPallets === 1 ? t("palletWord") : t("palletsWord")}`}
                          {line.quantity % cpp !== 0 && ` • +${toNext} ${t("toFullPallet")}`}
                        </p>
                      );
                    })()}
                  </div>
                </div>
              ))
            )}
          </div>
          {!isSingleHub && hasSupplierDirectItems && store.cart.length > 0 && (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-violet-200 bg-violet-50 p-3 text-xs text-violet-800">
              <Truck size={15} className="mt-0.5 shrink-0" />
              <span>{allDropShip ? t("cartDropShipAll") : t("cartDropShipMixed")}</span>
            </div>
          )}
          {!isSingleHub && (
            <div className="mt-4 rounded-md bg-atlas-light p-3 text-sm">
              <p className="font-black text-atlas-navy">{t("hubRoute")}</p>
              <p className="mt-1 text-slate-600">{hubRouting}</p>
              <p className="mt-2 text-xs font-semibold text-atlas-blue">{t("buyerRegion")}: {buyerRegion}</p>
            </div>
          )}
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
          {!isSingleHub && (
            <div className="mt-4 rounded-md border border-slate-200 bg-atlas-light p-3 text-xs">
              <p className="flex items-center gap-2 font-black text-atlas-navy">
                <Warehouse size={15} className="text-atlas-blue" />
                {t("deliveryExplainerTitle")}
              </p>
              <ul className="mt-2 grid gap-1.5 text-slate-600">
                {[t("deliveryHub1"), t("deliveryHub2"), t("deliveryHub3")].map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-atlas-blue" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!isSingleHub && !allDropShip && (
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
                  onClick={() => { setReceivingHub(hubOption); writeHomeHub(hubOption); }}
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
          )}
          {isSingleHub ? (
            // NEPA-style: the only logistics choice a buyer makes is pickup vs ship.
            <div className="mt-4 grid gap-2">
              <span className="label">{t("howToGetIt")}</span>
              <div className="grid grid-cols-2 gap-2">
                {([["Pickup", t("pickupAtHub")], ["Local delivery", t("shipToMe")]] as const).map(([ft, label]) => (
                  <button
                    key={ft}
                    className={`rounded-md border p-3 text-center text-sm font-black transition ${
                      fulfillmentType === ft
                        ? "border-atlas-blue bg-sky-50 text-atlas-navy"
                        : "border-slate-200 bg-white text-slate-700 hover:border-atlas-blue"
                    }`}
                    type="button"
                    onClick={() => setFulfillmentType(ft as FulfillmentType)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500">{fulfillmentType === "Pickup" ? t("pickupHint") : t("shipHint")}</p>
            </div>
          ) : !allDropShip ? (
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
                  <span className="font-black">{item === "Supplier direct" ? t("dropShipFrom") : item}</span>
                  <span className="mt-1 block text-xs font-semibold">{fulfillmentGuidance[item]}</span>
                </button>
              ))}
            </div>
          </div>
          ) : null}
          {store.cart.length > 0 && freeDeliveryThreshold > 0 && (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs">
              {qualifiesFreeDelivery ? (
                <p className="font-bold text-emerald-700">🚚 {t("freeDeliveryUnlocked")}</p>
              ) : (
                <>
                  <p className="font-semibold text-emerald-800">
                    {t("addMore")} {formatMoney(freeDeliveryRemaining)} {t("forFreeDelivery")}
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(100, (baseFinancials.productRevenue / freeDeliveryThreshold) * 100)}%` }}
                    />
                  </div>
                </>
              )}
            </div>
          )}
          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 text-sm font-bold text-slate-600">
            <span>{t("productSubtotal")}</span>
            <span className="text-atlas-navy">{formatMoney(quoteFinancials.productRevenue)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm font-bold text-slate-600">
            <span>{fulfillmentType === "Pickup" ? t("handlingLabel") : t("deliveryAndHandling")}</span>
            <span className="text-atlas-navy">
              {quoteFinancials.fulfillmentFee > 0 ? formatMoney(quoteFinancials.fulfillmentFee) : t("freeLabel")}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-xl font-black text-atlas-navy">
            <span>{hubPickupAutoPriced ? t("yourTotal") : t("yourEstimatedTotal")}</span>
            <span>{formatMoney(estimatedQuoteTotal)}</span>
          </div>
          {totalCases > 0 && estimatedQuoteTotal > 0 && (
            <p className="mt-1 text-right text-xs font-semibold text-slate-500">
              ≈ {formatMoney(estimatedQuoteTotal / totalCases)} {hubPickupAutoPriced ? t("perCaseAtPickup") : t("perCaseDelivered")}
            </p>
          )}
          {!hubPickupAutoPriced && (
            <p className="mt-2 text-xs text-slate-500">{t("priceConfirmedNote")}</p>
          )}
          {store.cart.length > 0 && (cartPalletPlan.totalPallets > 0 || cartTotalWeightLb > 0) && (
            <div className="mt-4 rounded-md border border-slate-200 bg-atlas-light p-3 text-sm">
              <p className="flex items-center gap-2 font-black text-atlas-navy">
                <Boxes size={16} className="text-atlas-blue" />
                {t("palletWeightTitle")}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                {cartPalletPlan.totalPallets > 0 && (
                  <div>
                    <span className="block font-semibold uppercase tracking-wide text-slate-400">{t("estPalletsLabel")}</span>
                    <span className="text-sm font-black text-atlas-navy">{cartPalletPlan.totalPallets}</span>
                  </div>
                )}
                {cartTotalWeightLb > 0 && (
                  <div>
                    <span className="block font-semibold uppercase tracking-wide text-slate-400">{t("totalWeightLabel")}</span>
                    <span className="text-sm font-black text-atlas-navy">≈ {cartTotalWeightLb.toLocaleString()} lb</span>
                  </div>
                )}
              </div>
              {cartPalletPlan.needsConfig.length > 0 && (
                <p className="mt-2 text-[11px] font-semibold text-amber-700">{t("palletPendingNote")}</p>
              )}
            </div>
          )}
          {store.cart.length > 0 && (
            <div className="mt-4 rounded-md border border-slate-200 p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-atlas-navy">{t("perProductMinimums")}</span>
                <span className={canRequestQuote ? "font-bold text-emerald-700" : "font-bold text-amber-700"}>
                  {canRequestQuote ? t("ready") : t("keepAdding")}
                </span>
              </div>
              <div className="mt-2 grid gap-1 text-xs">
                {linesBelowMin.length === 0 ? (
                  <p className="text-slate-600">{t("allItemsMeetMin")}</p>
                ) : (
                  linesBelowMin.map((line) => (
                    <p key={line.product.id} className="text-amber-700">
                      <span className="font-bold">{line.product.brand}:</span> {t("needsMin")} {line.product.moq || 1} {t("cases")}
                      {line.product.minOrderValue ? ` ${t("orLabel")} ${formatMoney(line.product.minOrderValue)}` : ""}
                    </p>
                  ))
                )}
              </div>
            </div>
          )}
          <button className="btn-danger mt-4 w-full" type="button" disabled={!canRequestQuote} onClick={requestQuote}>
            {orderActionLabel}
          </button>
          </aside>
        </div>
      )}
      {expandedImage && (() => {
        const qp = canSeePricing
          ? buyerCasePrice({ settings: store.pricingSettings, product: expandedImage, tierId: buyerTierId, accountId: userId })
          : 0;
        return (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-atlas-navy/70 p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setExpandedImage(null)}
          >
            <div className="grid w-full max-w-3xl gap-5 rounded-2xl bg-white p-5 shadow-panel sm:grid-cols-2" onClick={(event) => event.stopPropagation()}>
              <div className="aspect-square overflow-hidden rounded-xl bg-atlas-light">
                <ProductImage product={expandedImage} className="h-full w-full" iconSize={72} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="badge bg-slate-100 text-[10px] text-slate-600">{expandedImage.subcategory || expandedImage.category}</span>
                    {!isSingleHub && expandedImage.preferredHub === "Supplier direct" && (
                      <span className="badge bg-violet-50 text-[10px] text-violet-700"><Truck size={10} />{t("dropShip")}</span>
                    )}
                  </span>
                  <button className="btn-secondary px-3" type="button" onClick={() => setExpandedImage(null)}>
                    {t("close")}
                  </button>
                </div>
                <h2 className="mt-2 text-2xl font-black text-atlas-navy">{expandedImage.brand}</h2>
                <p className="text-sm text-slate-600">{expandedImage.productName || expandedImage.description}</p>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  {expandedImage.casePack} {t("perCaseUnits")}{expandedImage.unitSize ? ` · ${expandedImage.unitSize}` : ""}
                  {!isSingleHub ? ` · ${hubText(expandedImage.preferredHub)}` : ""}
                </p>
                {!isSingleHub && expandedImage.preferredHub === "Supplier direct" && (
                  <p className="mt-1 flex items-start gap-1.5 text-xs font-semibold text-violet-700">
                    <Truck size={13} className="mt-0.5 shrink-0" />
                    {t("dropShipNote")}
                  </p>
                )}
                <p className="mt-3">
                  <span className="text-2xl font-black text-atlas-navy">
                    {!canSeePricing ? t("locked") : qp > 0 ? formatMoney(qp) : t("pricePending")}
                  </span>
                  {canSeePricing && qp > 0 && <span className="text-xs font-semibold text-slate-500"> / {t("caseLabel")}</span>}
                </p>
                {/* Key wholesale facts a buyer needs before committing: minimum, stock, lead time. */}
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <dt className="font-semibold uppercase tracking-wide text-slate-400">{t("directMoq")}</dt>
                    <dd className="font-bold text-atlas-navy">
                      {expandedImage.moq} {t("cases")}
                      {expandedImage.minOrderValue ? ` / ${formatMoney(expandedImage.minOrderValue)}` : ""}
                    </dd>
                  </div>
                  {expandedImage.inventoryAvailable > 0 && (
                    <div>
                      <dt className="font-semibold uppercase tracking-wide text-slate-400">{t("inStockLabel")}</dt>
                      <dd className="font-bold text-emerald-700">{expandedImage.inventoryAvailable} {t("cases")}</dd>
                    </div>
                  )}
                  {expandedImage.leadTime && (
                    <div>
                      <dt className="font-semibold uppercase tracking-wide text-slate-400">{t("leadTimeLabel")}</dt>
                      <dd className="font-bold text-atlas-navy">{expandedImage.leadTime}</dd>
                    </div>
                  )}
                </dl>
                {expandedImage.productName && expandedImage.description && (
                  <p className="mt-3 line-clamp-6 text-xs leading-5 text-slate-500">{expandedImage.description}</p>
                )}
                <div className="mt-auto pt-4">
                  <button className="btn-primary w-full" type="button" onClick={() => { guardAdd(expandedImage, 1); setExpandedImage(null); }}>
                    {t("quickAdd")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
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

function StoreProductCard({
  product,
  canSeePricing,
  settings,
  buyerTierId,
  userId,
  isFavorite,
  onToggleFav,
  onExpand,
  onAdd
}: {
  product: Product;
  canSeePricing: boolean;
  settings: ReturnType<typeof useAtlasStore>["store"]["pricingSettings"];
  buyerTierId: string;
  userId?: string;
  isFavorite: boolean;
  onToggleFav: () => void;
  onExpand: () => void;
  onAdd: (qty: number) => void;
}) {
  const { t } = useI18n();
  const [qty, setQty] = useState(1);
  const placeholder = isPlaceholderImage(product);
  const refrigerated = !!product.spec?.refrigerated;
  const yourPrice = buyerCasePrice({ settings, product, tierId: buyerTierId, accountId: userId });
  const standard = standardCasePrice(product, settings);
  const discounted = yourPrice < standard - 0.001;
  const srpPerUnit = product.suggestedRetail || 0;
  const unitPrice = yourPrice > 0 && product.casePack > 0 ? yourPrice / product.casePack : 0;
  const isNew = product.createdAt ? Date.now() - new Date(product.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000 : false;

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:shadow-panel">
      <div className="relative">
        {placeholder ? (
          <div className="aspect-square w-full overflow-hidden border-b border-slate-100">
            <ProductImage product={product} className="h-full w-full" iconSize={48} />
          </div>
        ) : (
          <button
            type="button"
            className="aspect-square w-full overflow-hidden border-b border-slate-100 bg-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-atlas-blue"
            onClick={onExpand}
            aria-label={`Expand ${product.brand} image`}
          >
            <ProductImage product={product} className="h-full w-full" />
          </button>
        )}
        <button
          type="button"
          onClick={onToggleFav}
          className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border bg-white/90 shadow-sm transition ${isFavorite ? "border-atlas-red text-atlas-red" : "border-slate-200 text-slate-400 hover:text-atlas-red"}`}
          aria-label={isFavorite ? `Remove ${product.brand} from favorites` : `Save ${product.brand} to favorites`}
          aria-pressed={isFavorite}
        >
          <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="badge bg-slate-100 text-[10px] text-slate-600">{product.subcategory || product.category}</span>
          {!isSingleHub && product.preferredHub === "Supplier direct" && (
            <span className="badge bg-violet-50 text-[10px] text-violet-700"><Truck size={10} />{t("dropShip")}</span>
          )}
          {isNew && <span className="badge bg-emerald-50 text-[10px] text-emerald-700">{t("newBadge")}</span>}
          {refrigerated && <span className="badge bg-sky-50 text-[10px] text-atlas-blue"><Snowflake size={10} />{t("coldPack")}</span>}
          {product.placements?.homepageFeatured && <span className="badge bg-sky-50 text-[10px] text-atlas-blue">{t("featured")}</span>}
          {product.promotion && (
            <span className="badge bg-red-50 text-[10px] text-atlas-red">
              <Tag size={11} />
              {product.promotion}
            </span>
          )}
        </div>
        <h3 className="mt-2 font-black leading-snug text-atlas-navy">{product.brand}</h3>
        <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{product.productName || product.description}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          {product.casePack} {t("perCaseUnits")}
          {product.unitSize ? ` · ${product.unitSize}` : ""}
          {!isSingleHub ? ` · ${product.preferredHub === "Supplier direct" ? t("dropShip") : product.preferredHub ?? "Orlando hub"}` : ""}
        </p>

        <div className="mt-2">
          <p className="flex items-baseline gap-2">
            <span className="text-lg font-black text-atlas-navy">
              {!canSeePricing ? t("locked") : yourPrice > 0 ? `${formatMoney(yourPrice)}` : t("pricePending")}
            </span>
            {canSeePricing && yourPrice > 0 && <span className="text-xs font-semibold text-slate-500">/ {t("caseLabel")}</span>}
            {canSeePricing && discounted && yourPrice > 0 && (
              <span className="text-xs font-semibold text-slate-400 line-through">{formatMoney(standard)}</span>
            )}
          </p>
          {canSeePricing && unitPrice > 0 && (
            <p className="text-[11px] font-semibold text-slate-500">{formatMoney(unitPrice)}/{t("unitLabel")}</p>
          )}
          {canSeePricing && srpPerUnit > 0 && (
            <p className="text-[11px] font-semibold text-emerald-700">{t("msrpLabel")} {formatMoney(srpPerUnit)}/{t("unitLabel")}</p>
          )}
          <p className="text-[11px] text-slate-400">
            {t("directMoq")} {product.moq} {t("cases")}
            {product.minOrderValue ? ` / ${formatMoney(product.minOrderValue)}` : ""}
            {product.leadTime ? ` · ${t("leadTimeLabel")} ${product.leadTime}` : ""}
          </p>
        </div>

        <div className="mt-auto flex items-center gap-2 pt-3">
          <div className="flex items-center">
            <button
              type="button"
              className="flex h-9 w-8 items-center justify-center rounded-l-md border border-slate-300 text-slate-600 transition hover:border-atlas-blue hover:text-atlas-blue"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label={`Decrease ${product.brand} quantity`}
            >
              <Minus size={14} />
            </button>
            <input
              className="h-9 w-12 border-y border-slate-300 text-center text-sm focus:outline-none"
              type="number"
              min={1}
              step={1}
              value={qty}
              onChange={(event) => {
                const n = Math.floor(Number(event.target.value));
                setQty(Number.isFinite(n) && n > 0 ? n : 1);
              }}
              aria-label={`${product.brand} cases`}
            />
            <button
              type="button"
              className="flex h-9 w-8 items-center justify-center rounded-r-md border border-slate-300 text-slate-600 transition hover:border-atlas-blue hover:text-atlas-blue"
              onClick={() => setQty((q) => q + 1)}
              aria-label={`Increase ${product.brand} quantity`}
            >
              <Plus size={14} />
            </button>
          </div>
          <button className="btn-primary h-9 min-h-9 flex-1 px-3 text-sm" type="button" onClick={() => onAdd(qty)}>
            <ShoppingCart size={15} />
            {t("add")}
          </button>
        </div>
      </div>
    </article>
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
          <p className="line-clamp-2 text-xs font-semibold text-slate-600">{product.productName || product.description}</p>
          {!isSingleHub && (
            <p className="mt-1 text-xs font-bold text-atlas-blue">{product.preferredHub === "Supplier direct" ? t("dropShip") : product.preferredHub ?? t("dropShip")}</p>
          )}
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
