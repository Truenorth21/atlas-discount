"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Boxes, CheckCircle2, ChevronDown, Heart, ImageIcon, Minus, PackageCheck, Plus, Search, ShoppingCart, Tag, Trash2, Truck, Warehouse, X } from "lucide-react";
import { Nav } from "@/components/nav";
import { ProductImage } from "@/components/product-image";
import { useAtlasStore } from "@/components/local-store";
import { atlasHubs, productCategories, readHomeHub, writeHomeHub } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { buyerCasePrice, calculateQuoteFinancials, formatMoney } from "@/lib/pricing";
import type { PricingContext } from "@/lib/pricing";
import type { FulfillmentType, OrderRequest, Product } from "@/lib/types";

type SimpleFulfillment = "Pickup" | "Local delivery" | "Freight quote needed";
type ReceivingHub = "Miami hub" | "Orlando hub";

const categoryLabels: Record<string, string> = {
  "Janitorial / Cleaning Supplies": "Cleaning",
  "Grocery / Pantry": "Grocery",
  "Health & Beauty (HBA)": "Health & Beauty",
  "Office / Paper": "Office & Paper",
  "Foodservice / Disposables": "Foodservice",
  "Closeout / Special buys": "Closeouts",
};

export default function CatalogClient({ isAuthenticated, userId, userRole, isApproved = false }: { isAuthenticated: boolean; userId?: string; userRole?: string; isApproved?: boolean }) {
  const { t } = useI18n();
  const { store, addToCart, addOrder, removeFromCart, updateCartQuantity, verifyDocuments, toggleFavorite, reorder, setCurrentTier } = useAtlasStore();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [brand, setBrand] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [fulfillment, setFulfillment] = useState<SimpleFulfillment>("Pickup");
  const [receivingHub, setReceivingHub] = useState<ReceivingHub>("Miami hub");
  const [cartOpen, setCartOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  useEffect(() => {
    setReceivingHub(readHomeHub());
  }, []);

  const isAdminPreview = userRole === "admin";
  const canSeePricing = (isAuthenticated && (isApproved || store.documentsVerified)) || isAdminPreview;
  const accountEntry = userId ? (store.pricingSettings.accountPricing ?? []).find((entry) => entry.accountId === userId) : undefined;
  const buyerTierId = accountEntry?.tierId ?? (userRole === "route_seller" ? "retailer" : store.currentTierId);
  const pricingContext: PricingContext | undefined = canSeePricing ? { tierId: buyerTierId, accountId: userId } : undefined;

  const approvedProducts = store.products.filter((product) => product.status === "approved");
  const brands = ["All", ...Array.from(new Set(approvedProducts.map((product) => product.brand).filter(Boolean))).sort()];

  const products = useMemo(() => {
    const term = query.trim().toLowerCase();
    const result = approvedProducts.filter((product) => {
      const haystack = [product.brand, product.productName, product.description, product.sku, product.upc, product.category, product.subcategory].join(" ").toLowerCase();
      return (category === "All" || product.category === category) && (brand === "All" || product.brand === brand) && haystack.includes(term);
    });
    const price = (product: Product) => buyerCasePrice({ settings: store.pricingSettings, product, tierId: buyerTierId, accountId: userId });
    return [...result].sort((a, b) => {
      if (sortBy === "priceAsc") return price(a) - price(b);
      if (sortBy === "priceDesc") return price(b) - price(a);
      if (sortBy === "name") return `${a.brand} ${a.productName}`.localeCompare(`${b.brand} ${b.productName}`);
      return Number(Boolean(b.placements?.homepageFeatured)) - Number(Boolean(a.placements?.homepageFeatured));
    });
  }, [approvedProducts, query, category, brand, sortBy, store.pricingSettings, buyerTierId, userId]);

  const totalCases = store.cart.reduce((sum, line) => sum + line.quantity, 0);
  const minimumIssues = store.cart.filter((line) => line.quantity < Math.max(1, line.product.moq || 1));
  const hubRouting = fulfillment === "Pickup" ? `Pickup at ${receivingHub}` : fulfillment === "Local delivery" ? `Local delivery from ${receivingHub}` : "Atlas freight quote";
  const draftOrder: OrderRequest = {
    id: "DRAFT",
    buyer: "Current Retailer",
    buyerRegion: receivingHub === "Miami hub" ? "South Florida" : "Central Florida",
    totalCases,
    estimatedValue: 0,
    fulfillmentType: fulfillment as FulfillmentType,
    destinationHub: receivingHub,
    hubRouting,
    lineItems: store.cart,
    status: "Quote requested",
    createdAt: new Date().toISOString().slice(0, 10),
  };
  const financials = calculateQuoteFinancials(draftOrder, store.pricingSettings, undefined, pricingContext);
  const merchandiseTotal = financials.productRevenue;
  const orderTotal = financials.buyerTotal;
  const pickupReady = fulfillment === "Pickup";

  function addProduct(product: Product, quantity: number) {
    if (!isAuthenticated) {
      window.location.href = "/login?next=/catalog";
      return;
    }
    addToCart(product, Math.max(1, Math.floor(quantity)));
    setCartOpen(true);
  }

  function submitOrder() {
    if (!isAuthenticated) {
      window.location.href = "/login?next=/catalog";
      return;
    }
    if (!store.cart.length || minimumIssues.length) return;
    const id = `Q-${Math.floor(1000 + Math.random() * 9000)}`;
    addOrder({ ...draftOrder, id, estimatedValue: orderTotal, status: pickupReady ? "Ready to confirm" : "Quote requested" });
    setSubmittedId(id);
  }

  const lastOrder = store.orders.find((order) => (order.lineItems?.length ?? 0) > 0);

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-atlas-light pb-16">
        {isAdminPreview && (
          <section className="border-b border-sky-200 bg-sky-50">
            <div className="atlas-container flex flex-wrap items-center justify-between gap-3 py-3">
              <p className="text-sm font-bold text-atlas-navy">Admin buyer preview · Viewing {buyerTierId} pricing</p>
              <div className="flex flex-wrap gap-2">
                {(store.pricingSettings.customerTiers ?? []).map((tier) => <button key={tier.id} type="button" onClick={() => setCurrentTier(tier.id)} className={`border px-3 py-1 text-xs font-black ${buyerTierId === tier.id ? "border-atlas-blue bg-atlas-blue text-white" : "border-slate-300 bg-white text-atlas-navy"}`}>{tier.label}</button>)}
                <Link href="/admin" className="border border-slate-300 bg-white px-3 py-1 text-xs font-black text-atlas-navy">Back to admin</Link>
              </div>
            </div>
          </section>
        )}

        <section className="bg-atlas-navy text-white">
          <div className="atlas-container grid gap-5 py-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div><p className="text-sm font-black uppercase text-sky-300">Atlas Discount</p><h1 className="mt-1 text-4xl font-black">{t("shopWholesale")}</h1><p className="mt-2 max-w-2xl text-slate-200">Buy by the case. Choose pickup, local delivery, or request a freight quote at checkout.</p></div>
            <button type="button" onClick={() => setCartOpen(true)} className="relative inline-flex min-h-12 items-center justify-center gap-2 bg-white px-6 font-black text-atlas-navy"><ShoppingCart size={19} />View order{totalCases > 0 && <span className="bg-atlas-red px-2 py-0.5 text-xs text-white">{totalCases}</span>}</button>
          </div>
        </section>

        <div className="atlas-container py-7">
          {!isAuthenticated ? <AccessNotice body={t("signInToSeePricing")} action={t("signIn")} href="/login?next=/catalog" /> : !store.documentsVerified && !isAdminPreview ? <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><span>{t("docsHidden")}</span><button className="font-black text-atlas-blue underline" type="button" onClick={verifyDocuments}>{t("markDemoDocs")}</button></div> : null}

          {lastOrder && isAuthenticated && <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-sky-200 bg-sky-50 p-4"><div><p className="font-black text-atlas-navy">{t("buyAgain")}</p><p className="text-xs text-slate-600">Rebuild your most recent wholesale order in one click.</p></div><button type="button" className="btn-primary" onClick={() => { reorder(lastOrder); setCartOpen(true); }}>{t("addAllToCart")}</button></div>}

          <section className="border border-slate-200 bg-white p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_190px_190px]">
              <label className="relative"><Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="field pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchProducts")} /></label>
              <Select value={brand} onChange={setBrand} options={brands} />
              <Select value={sortBy} onChange={setSortBy} options={["featured", "priceAsc", "priceDesc", "name"]} labels={{ featured: "Featured", priceAsc: "Price: low to high", priceDesc: "Price: high to low", name: "Product name" }} />
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {["All", ...Object.keys(productCategories)].map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 border px-3 py-2 text-sm font-black ${category === item ? "border-atlas-blue bg-atlas-blue text-white" : "border-slate-200 bg-white text-atlas-navy hover:border-atlas-blue"}`}>{item === "All" ? t("allProducts") : categoryLabels[item] ?? item}</button>)}
            </div>
          </section>

          <div className="mt-4 flex items-center justify-between gap-3"><p className="text-sm font-bold text-slate-600">{products.length} wholesale products</p><p className="hidden text-xs font-semibold text-slate-500 sm:block">Prices shown per case · quantity can be changed before adding</p></div>

          <section className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => <ProductCard key={product.id} product={product} canSeePricing={canSeePricing} settings={store.pricingSettings} tierId={buyerTierId} userId={userId} favorite={store.favorites.includes(product.id)} onFavorite={() => toggleFavorite(product.id)} onDetail={() => setDetailProduct(product)} onAdd={(quantity) => addProduct(product, quantity)} />)}
          </section>
          {!products.length && <div className="mt-4 border border-slate-200 bg-white p-10 text-center"><Search className="mx-auto text-slate-300" /><p className="mt-3 font-black text-atlas-navy">No products found</p><p className="mt-1 text-sm text-slate-500">Try another search or category.</p></div>}
        </div>
      </main>

      {cartOpen && <CartDrawer cart={store.cart} canSeePricing={canSeePricing} settings={store.pricingSettings} tierId={buyerTierId} userId={userId} fulfillment={fulfillment} setFulfillment={setFulfillment} hub={receivingHub} setHub={(hub) => { setReceivingHub(hub); writeHomeHub(hub); }} merchandiseTotal={merchandiseTotal} orderTotal={orderTotal} minimumIssues={minimumIssues} submittedId={submittedId} updateQuantity={updateCartQuantity} remove={removeFromCart} submit={submitOrder} close={() => setCartOpen(false)} />}
      {detailProduct && <ProductDetail product={detailProduct} canSeePricing={canSeePricing} settings={store.pricingSettings} tierId={buyerTierId} userId={userId} close={() => setDetailProduct(null)} add={(quantity) => { addProduct(detailProduct, quantity); setDetailProduct(null); }} />}
    </>
  );
}

function AccessNotice({ body, action, href }: { body: string; action: string; href: string }) { return <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-sky-200 bg-sky-50 p-4 text-sm text-atlas-navy"><span>{body}</span><Link href={href} className="font-black text-atlas-blue underline">{action}</Link></div>; }
function Select({ value, onChange, options, labels = {} }: { value: string; onChange: (value: string) => void; options: string[]; labels?: Record<string, string> }) { return <label className="relative"><select className="field appearance-none pr-9" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{labels[option] ?? (option === "All" ? "All brands" : option)}</option>)}</select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" /></label>; }

function ProductCard({ product, canSeePricing, settings, tierId, userId, favorite, onFavorite, onDetail, onAdd }: { product: Product; canSeePricing: boolean; settings: ReturnType<typeof useAtlasStore>["store"]["pricingSettings"]; tierId: string; userId?: string; favorite: boolean; onFavorite: () => void; onDetail: () => void; onAdd: (quantity: number) => void }) {
  const { t } = useI18n();
  const minimum = Math.max(1, product.moq || 1);
  const [quantity, setQuantity] = useState(minimum);
  const casePrice = buyerCasePrice({ settings, product, tierId, accountId: userId });
  const unitPrice = casePrice > 0 && product.casePack > 0 ? casePrice / product.casePack : 0;
  return <article className="flex min-w-0 flex-col border border-slate-200 bg-white transition hover:border-atlas-blue hover:shadow-panel">
    <div className="relative"><button type="button" onClick={onDetail} className="aspect-square w-full overflow-hidden bg-white"><ProductImage product={product} className="h-full w-full" iconSize={42} /></button><button type="button" onClick={onFavorite} aria-label="Save product" className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center border bg-white shadow-sm ${favorite ? "border-atlas-red text-atlas-red" : "border-slate-200 text-slate-400"}`}><Heart size={17} fill={favorite ? "currentColor" : "none"} /></button>{product.promotion && <span className="absolute bottom-2 left-2 bg-atlas-red px-2 py-1 text-[10px] font-black uppercase text-white"><Tag size={10} className="mr-1 inline" />{product.promotion}</span>}</div>
    <div className="flex flex-1 flex-col border-t border-slate-100 p-3"><p className="text-[11px] font-black uppercase text-atlas-blue">{product.brand}</p><h2 className="mt-1 line-clamp-2 min-h-10 text-sm font-black leading-5 text-atlas-navy">{product.productName || product.description}</h2><p className="mt-1 text-xs font-semibold text-slate-500">{product.casePack} {t("perCaseUnits")}{product.unitSize ? ` · ${product.unitSize}` : ""}</p><div className="mt-3"><p className="text-xl font-black text-atlas-navy">{!canSeePricing ? t("locked") : casePrice > 0 ? formatMoney(casePrice) : t("pricePending")}</p>{canSeePricing && unitPrice > 0 && <p className="text-[11px] font-semibold text-slate-500">{formatMoney(unitPrice)} / {t("unitLabel")}</p>}<p className="mt-1 text-[11px] font-semibold text-slate-500">Minimum {minimum} {minimum === 1 ? "case" : "cases"}{product.inventoryAvailable > 0 ? ` · ${product.inventoryAvailable} available` : ""}</p></div>
      <div className="mt-auto flex items-center gap-2 pt-3"><div className="flex h-10 items-center border border-slate-300"><button type="button" className="h-full w-8" onClick={() => setQuantity((value) => Math.max(minimum, value - 1))}><Minus size={14} className="mx-auto" /></button><input type="number" min={minimum} value={quantity} onChange={(event) => setQuantity(Math.max(minimum, Math.floor(Number(event.target.value)) || minimum))} className="h-full w-11 border-x border-slate-300 text-center text-sm focus:outline-none" /><button type="button" className="h-full w-8" onClick={() => setQuantity((value) => value + 1)}><Plus size={14} className="mx-auto" /></button></div><button type="button" onClick={() => onAdd(quantity)} className="btn-primary min-h-10 flex-1 px-3 text-sm"><ShoppingCart size={15} />{t("add")}</button></div>
    </div>
  </article>;
}

function CartDrawer({ cart, canSeePricing, settings, tierId, userId, fulfillment, setFulfillment, hub, setHub, merchandiseTotal, orderTotal, minimumIssues, submittedId, updateQuantity, remove, submit, close }: { cart: ReturnType<typeof useAtlasStore>["store"]["cart"]; canSeePricing: boolean; settings: ReturnType<typeof useAtlasStore>["store"]["pricingSettings"]; tierId: string; userId?: string; fulfillment: SimpleFulfillment; setFulfillment: (value: SimpleFulfillment) => void; hub: ReceivingHub; setHub: (value: ReceivingHub) => void; merchandiseTotal: number; orderTotal: number; minimumIssues: typeof cart; submittedId: string | null; updateQuantity: (id: string, quantity: number) => void; remove: (id: string) => void; submit: () => void; close: () => void }) {
  const options: Array<{ id: SimpleFulfillment; icon: typeof Warehouse; title: string; body: string }> = [
    { id: "Pickup", icon: Warehouse, title: "Hub pickup", body: "Published case prices. Fastest confirmation." },
    { id: "Local delivery", icon: Truck, title: "Local delivery", body: "Atlas adds the delivery charge before confirmation." },
    { id: "Freight quote needed", icon: Boxes, title: "Freight quote", body: "For larger or out-of-area orders." },
  ];
  return <div className="fixed inset-0 z-50 bg-atlas-navy/55" onClick={close}><aside className="ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
    <header className="flex items-center justify-between border-b border-slate-200 p-5"><div><p className="text-xs font-black uppercase text-atlas-blue">Wholesale order</p><h2 className="text-2xl font-black text-atlas-navy">Review your cases</h2></div><button type="button" onClick={close} className="flex h-10 w-10 items-center justify-center border border-slate-200"><X /></button></header>
    <div className="flex-1 overflow-y-auto p-5">
      {!cart.length ? <div className="py-16 text-center"><ShoppingCart className="mx-auto text-slate-300" size={38} /><p className="mt-3 font-black text-atlas-navy">Your order is empty</p><button type="button" onClick={close} className="mt-4 font-black text-atlas-blue underline">Continue shopping</button></div> : <>
        <div className="grid gap-3">{cart.map((line) => { const minimum = Math.max(1, line.product.moq || 1); const price = buyerCasePrice({ settings, product: line.product, tierId, accountId: userId }); return <div key={line.product.id} className="grid grid-cols-[64px_1fr_auto] gap-3 border-b border-slate-200 pb-3"><ProductImage product={line.product} className="h-16 w-16 border border-slate-200" iconSize={22} /><div><p className="font-black text-atlas-navy">{line.product.brand}</p><p className="line-clamp-1 text-xs text-slate-500">{line.product.productName || line.product.description}</p><div className="mt-2 flex items-center gap-2"><button type="button" onClick={() => updateQuantity(line.product.id, Math.max(minimum, line.quantity - 1))} className="h-7 w-7 border"><Minus size={12} className="mx-auto" /></button><span className="min-w-8 text-center text-sm font-black">{line.quantity}</span><button type="button" onClick={() => updateQuantity(line.product.id, line.quantity + 1)} className="h-7 w-7 border"><Plus size={12} className="mx-auto" /></button><span className="text-xs text-slate-500">cases</span></div></div><div className="text-right"><p className="font-black text-atlas-navy">{canSeePricing && price > 0 ? formatMoney(price * line.quantity) : "—"}</p><button type="button" onClick={() => remove(line.product.id)} className="mt-3 text-slate-400 hover:text-atlas-red"><Trash2 size={16} /></button></div></div>; })}</div>
        <section className="mt-6"><h3 className="font-black text-atlas-navy">How should Atlas fulfill this order?</h3><div className="mt-3 grid gap-2">{options.map(({ id, icon: Icon, title, body }) => <button key={id} type="button" onClick={() => setFulfillment(id)} className={`flex items-start gap-3 border p-3 text-left ${fulfillment === id ? "border-atlas-blue bg-sky-50" : "border-slate-200"}`}><Icon size={20} className="mt-0.5 shrink-0 text-atlas-blue" /><span><span className="block font-black text-atlas-navy">{title}</span><span className="block text-xs leading-5 text-slate-600">{body}</span></span>{fulfillment === id && <CheckCircle2 size={18} className="ml-auto shrink-0 text-atlas-blue" />}</button>)}</div></section>
        {fulfillment !== "Freight quote needed" && <section className="mt-5"><h3 className="text-sm font-black text-atlas-navy">Preferred hub</h3><div className="mt-2 grid grid-cols-2 gap-2">{atlasHubs.filter((item): item is ReceivingHub => item === "Miami hub" || item === "Orlando hub").map((item) => <button key={item} type="button" onClick={() => setHub(item)} className={`border p-3 text-sm font-black ${hub === item ? "border-atlas-blue bg-sky-50 text-atlas-navy" : "border-slate-200 text-slate-600"}`}>{item}</button>)}</div></section>}
        {minimumIssues.length > 0 && <div className="mt-5 border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">Increase {minimumIssues.length} {minimumIssues.length === 1 ? "item" : "items"} to meet the product minimum.</div>}
        {submittedId && <div className="mt-5 border border-emerald-200 bg-emerald-50 p-4"><p className="flex items-center gap-2 font-black text-emerald-800"><PackageCheck size={18} />Order request {submittedId} submitted</p><p className="mt-1 text-xs text-emerald-700">Atlas will confirm inventory and any applicable delivery or freight charge.</p></div>}
      </>}
    </div>
    {cart.length > 0 && <footer className="border-t border-slate-200 bg-atlas-light p-5"><div className="flex justify-between text-sm font-bold text-slate-600"><span>Merchandise</span><span>{formatMoney(merchandiseTotal)}</span></div><div className="mt-2 flex justify-between text-xl font-black text-atlas-navy"><span>{fulfillment === "Pickup" ? "Estimated total" : "Estimated total"}</span><span>{formatMoney(orderTotal)}</span></div><p className="mt-1 text-xs text-slate-500">{fulfillment === "Pickup" ? "Pickup pricing is ready for confirmation." : "Atlas will confirm the final fulfillment charge."}</p><button type="button" disabled={minimumIssues.length > 0 || !!submittedId} onClick={submit} className="btn-primary mt-4 w-full">{fulfillment === "Pickup" ? "Submit pickup order" : "Request final quote"}</button></footer>}
  </aside></div>;
}

function ProductDetail({ product, canSeePricing, settings, tierId, userId, close, add }: { product: Product; canSeePricing: boolean; settings: ReturnType<typeof useAtlasStore>["store"]["pricingSettings"]; tierId: string; userId?: string; close: () => void; add: (quantity: number) => void }) {
  const minimum = Math.max(1, product.moq || 1); const [quantity, setQuantity] = useState(minimum); const price = buyerCasePrice({ settings, product, tierId, accountId: userId });
  return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-atlas-navy/60 p-4" onClick={close}><div className="grid w-full max-w-4xl bg-white shadow-2xl md:grid-cols-2" onClick={(event) => event.stopPropagation()}><div className="relative aspect-square bg-white"><ProductImage product={product} className="h-full w-full" iconSize={70} /><button type="button" onClick={close} className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center border bg-white md:hidden"><X /></button></div><div className="flex flex-col p-6"><button type="button" onClick={close} className="ml-auto hidden h-10 w-10 items-center justify-center border md:flex"><X /></button><p className="text-xs font-black uppercase text-atlas-blue">{product.brand}</p><h2 className="mt-1 text-2xl font-black text-atlas-navy">{product.productName || product.description}</h2><p className="mt-3 text-sm leading-6 text-slate-600">{product.description}</p><p className="mt-5 text-3xl font-black text-atlas-navy">{canSeePricing && price > 0 ? formatMoney(price) : "Wholesale price locked"}</p><p className="text-sm font-semibold text-slate-500">per case · {product.casePack} units</p><dl className="mt-6 grid grid-cols-2 gap-4 border-y border-slate-200 py-4 text-sm"><Fact label="Minimum" value={`${minimum} cases`} /><Fact label="Available" value={`${product.inventoryAvailable || 0} cases`} /><Fact label="Lead time" value={product.leadTime || "Confirm with Atlas"} /><Fact label="Case size" value={product.caseDimensions || "See quote"} /><Fact label="Case weight" value={product.caseWeight ? `${product.caseWeight} lb` : "See quote"} /><Fact label="Pallet" value={product.palletConfiguration || "Varies"} /></dl><div className="mt-auto flex gap-3 pt-6"><input type="number" min={minimum} value={quantity} onChange={(event) => setQuantity(Math.max(minimum, Math.floor(Number(event.target.value)) || minimum))} className="field w-24 text-center" /><button type="button" onClick={() => add(quantity)} className="btn-primary flex-1"><ShoppingCart size={17} />Add cases</button></div></div></div></div>;
}
function Fact({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-black uppercase text-slate-400">{label}</dt><dd className="mt-1 font-bold text-atlas-navy">{value}</dd></div>; }
