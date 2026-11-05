"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Boxes, MapPin, Megaphone, Truck, Wallet } from "lucide-react";
import { Nav } from "@/components/nav";
import { ProductUpload } from "@/components/product-upload";
import { SingleProductForm } from "@/app/admin/admin-client";
import { StatusBadge } from "@/components/status-badge";
import { useAtlasStore } from "@/components/local-store";
import { saveSupplierPayment } from "@/app/register/actions";
import { DashboardHero } from "@/components/dashboard-hero";
import { getDocumentAlerts } from "@/lib/documents";
import { defaultFulfillmentTierId, fulfillmentTiers, supplierMembershipPlans } from "@/lib/data";
import { supplierMembershipPlan } from "@/lib/pricing";
import { useI18n } from "@/lib/i18n";
import { isSupabaseConfigured } from "@/lib/supabase/browser";
import { parseZipPrefixes } from "@/lib/fulfillment";
import type { Application, Product, SupplierFulfillmentRules } from "@/lib/types";

export default function SupplierDashboardPage() {
  const { t } = useI18n();
  const { store, setStore, addProducts, addPromotionSubmission, updateProduct } = useAtlasStore();
  const [promo, setPromo] = useState(t("noPromotionSubmitted"));
  const adPlacements = [
    "Weekly deals email",
    "Sponsored category",
    "Featured product",
    "New & trending spotlight",
    "Closeout listing",
    "WhatsApp promotion"
  ];
  const supplierApplication = store.applications.find((application) => application.type === "supplier");
  const companyName = supplierApplication?.companyName ?? "Current Supplier";
  const membership = supplierMembershipPlan(store.pricingSettings, companyName);
  const membershipAssignment = (store.pricingSettings.supplierMemberships ?? []).find((item) => item.supplierName === companyName);
  // Scope to the signed-in supplier's own products — matches how uploads are tagged
  // (supplierName = the supplier's company). Legacy demo names kept as a fallback.
  const supplierProducts = store.products.filter(
    (product) =>
      product.supplierName === companyName ||
      product.supplierName === "Current Supplier" ||
      product.supplierName === "Harborline Brands"
  );
  const documentAlerts = getDocumentAlerts(store.applications, "supplier");
  const assignment = supplierApplication
    ? (store.pricingSettings.supplierAssignments ?? []).find((a) => a.supplierId === supplierApplication.id)
    : undefined;
  const fulfillment = fulfillmentTiers.find((t) => t.id === (assignment?.fulfillmentTier ?? defaultFulfillmentTierId)) ?? fulfillmentTiers[0];

  function updateInventory(id: string, inventoryAvailable: number) {
    setStore((current) => ({
      ...current,
      products: current.products.map((product) => (product.id === id ? { ...product, inventoryAvailable } : product))
    }));
  }

  function submitPromotion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const note = String(form.get("promotion")).trim();
    addPromotionSubmission({
      id: `promo-${Date.now()}`,
      supplierName: supplierApplication?.companyName ?? "Current Supplier",
      placement: String(form.get("placement")),
      productName: String(form.get("promotionProduct") || "") || undefined,
      note: note || undefined,
      status: "pending",
      submittedAt: new Date().toISOString().slice(0, 10)
    });
    setPromo(t("adRequestSubmitted"));
    event.currentTarget.reset();
  }

  return (
    <>
      <Nav />
      <main className="atlas-container py-8">
        <DashboardHero
          title={t("supplierDashboard")}
          subtitle={t("supplierDashboardBody")}
          action={
            <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-black text-atlas-navy transition hover:bg-sky-50" href="/sell">
              See advertising rates
            </Link>
          }
        />
        <div className="mt-6 grid gap-6 lg:grid-cols-[390px_1fr]">
        <aside className="grid h-fit gap-5">
          <div className="panel p-5">
            <p className="text-xs font-black uppercase tracking-wide text-atlas-blue">Grow your sales</p>
            <h2 className="mt-1 text-xl font-black text-atlas-navy">Listing is free</h2>
            <p className="mt-1 text-sm text-slate-600">
              You have {supplierProducts.length} {supplierProducts.length === 1 ? "product" : "products"} on Atlas. Drive demand with
              supplier-funded placements — featured slots, weekly deals, category sponsorships, and more. Pay only for what you run.
            </p>
            <div className="mt-3 rounded-md bg-atlas-light p-3 text-sm">
              <p className="font-black text-atlas-navy">Fulfillment: {fulfillment.name}</p>
              <p className="mt-0.5 text-xs text-slate-600">{fulfillment.blurb}</p>
            </div>
            <div className="mt-3 rounded-md bg-sky-50 p-3 text-sm"><p className="font-black text-atlas-navy">Membership: {membership.name}</p><p className="mt-0.5 text-xs text-slate-600">{membership.caseFee}% case · {membership.palletFee}% pallet · {membership.promotionFee}% promotional fee</p></div>
            <Link className="btn-secondary mt-3 w-fit rounded-full" href="/sell">
              See advertising rates
            </Link>
          </div>
          <ProductUpload />
          {documentAlerts.length > 0 && (
            <div className="panel p-5">
              <h2 className="text-xl font-black text-atlas-navy">{t("documentAlerts")}</h2>
              <div className="mt-3 grid gap-2">
                {documentAlerts.map(({ document, expiration }) => (
                  <div key={document.id} className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
                    <p className="font-bold text-atlas-navy">{document.label}</p>
                    <p className={expiration.tone === "danger" ? "font-semibold text-red-700" : "font-semibold text-amber-800"}>
                      {expiration.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {supplierApplication && (
            <div className="panel p-5">
              <h2 className="text-xl font-black text-atlas-navy">{t("documentStatusLabel")}</h2>
              <div className="mt-3 grid gap-2">
                {supplierApplication.documents.map((document) => (
                  <div key={document.id} className="rounded-md bg-atlas-light p-3 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-atlas-navy">{document.label}</p>
                        <p className="text-slate-600">{document.fileName ?? t("noFileUploaded")}</p>
                        {document.rejectionReason && (
                          <p className="mt-1 font-semibold text-red-700">{document.rejectionReason}</p>
                        )}
                      </div>
                      <StatusBadge status={document.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <form className="panel p-6" onSubmit={submitPromotion}>
            <h2 className="flex items-center gap-2 text-xl font-black">
              <Megaphone className="text-atlas-blue" />
              Request advertising
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">This sends a request—it does not immediately charge you or activate an ad. Atlas confirms availability, dates, final price, and the promised placement before scheduling.</p>
            <label className="mt-4 grid gap-2">
              <span className="label">{t("placementLabel")}</span>
              <select className="field" name="placement" required>
                {adPlacements.map((placement) => (
                  <option key={placement}>{placement}</option>
                ))}
              </select>
            </label>
            <label className="mt-3 grid gap-2"><span className="label">Product to promote</span><select className="field" name="promotionProduct" required><option value="">Select a product…</option>{supplierProducts.map((product) => <option key={product.id} value={`${product.brand} · ${product.productName}`}>{product.brand} · {product.productName}</option>)}</select></label>
            <textarea className="field mt-3 min-h-24" name="promotion" placeholder={t("promotionPlaceholder")} />
            <button className="btn-primary mt-3 w-full" type="submit">Submit advertising request</button>
            <p className="mt-3 text-xs leading-5 text-slate-500">Workflow: request → Atlas approval → booking and invoice → payment → scheduled → live and verified → results reported.</p>
            <p className="mt-3 text-sm font-semibold text-atlas-blue">{promo}</p>
          </form>
          {store.promotionSubmissions.filter((item) => item.supplierName === companyName || item.supplierName === "Current Supplier").length > 0 && <div className="panel p-5"><h2 className="text-lg font-black text-atlas-navy">Your advertising requests</h2><div className="mt-3 grid gap-2">{store.promotionSubmissions.filter((item) => item.supplierName === companyName || item.supplierName === "Current Supplier").map((item) => <div key={item.id} className="rounded-md border border-slate-200 p-3 text-sm"><div className="flex items-center justify-between gap-3"><div><p className="font-black text-atlas-navy">{item.placement}</p><p className="text-xs text-slate-500">{item.productName || "Product pending selection"}</p></div><StatusBadge status={item.status} /></div></div>)}</div></div>}
        </aside>
        <div className="grid h-fit gap-6">
        <SupplierPaymentCard application={supplierApplication} companyName={companyName} />
        <section className="panel overflow-hidden">
          <div className="bg-atlas-navy p-5 text-white"><p className="text-xs font-black uppercase tracking-widest text-sky-300">How Atlas routing works</p><h2 className="mt-1 text-2xl font-black">You keep inventory until Atlas releases an order.</h2></div>
          <div className="grid gap-4 p-5 md:grid-cols-3">
            <div><p className="text-sm font-black text-atlas-blue">1 · Atlas approves</p><p className="mt-1 text-sm leading-6 text-slate-600">A buyer request is not permission to ship. Atlas confirms the order and sends you a release number, quantities, labels, and routing instructions.</p></div>
            <div><p className="text-sm font-black text-atlas-blue">2 · You route released goods</p><p className="mt-1 text-sm leading-6 text-slate-600">Send them to Atlas Hialeah Gardens for paid consolidation, ship with Atlas-issued documents, or prepare an authorized pickup—according to the product setup.</p></div>
            <div><p className="text-sm font-black text-atlas-blue">3 · Atlas protects the relationship</p><p className="mt-1 text-sm leading-6 text-slate-600">Consolidation orders do not expose the buyer. Direct shipments reveal only fulfillment-required information and cannot include supplier marketing or invoices.</p></div>
          </div>
          <div className="border-t border-slate-200 bg-sky-50 px-5 py-3 text-xs font-semibold text-slate-700">Hialeah Gardens consolidation may include receiving, pallet-building, storage, delivery, or freight fees. Atlas confirms applicable charges before release.</div>
        </section>
        <section className="panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-atlas-blue">Annual supplier membership</p><h2 className="mt-1 text-2xl font-black text-atlas-navy">Start free. Upgrade as your Atlas sales grow.</h2><p className="mt-1 text-sm text-slate-600">Paid plans last 12 months after payment is confirmed. Expired or unpaid plans automatically return to Free rates.</p></div>{membershipAssignment?.expiresAt && <div className="rounded-md bg-atlas-light px-3 py-2 text-sm"><p className="font-black text-atlas-navy">{membership.name}</p><p className="text-xs text-slate-500">Through {membershipAssignment.expiresAt}</p></div>}</div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{supplierMembershipPlans.map((plan) => <div key={plan.id} className={`rounded-xl border-2 p-4 ${plan.id === membership.id ? "border-atlas-blue bg-sky-50" : "border-slate-200 bg-white"}`}><div className="flex items-center justify-between"><h3 className="text-lg font-black text-atlas-navy">{plan.name}</h3>{plan.id === membership.id && <span className="badge bg-atlas-blue text-white">Current</span>}</div><p className="mt-1 text-2xl font-black text-atlas-navy">${plan.annualPrice}<span className="text-xs font-semibold text-slate-500"> / year</span></p><ul className="mt-3 grid gap-1 text-xs text-slate-600"><li><strong>{plan.caseFee}%</strong> standard case fee</li><li><strong>{plan.palletFee}%</strong> full-pallet fee</li><li><strong>{plan.promotionFee}%</strong> promotional fee</li><li>{plan.listingLimit ?? "Unlimited"} active listings</li><li>${plan.adCredit} annual ad credit</li><li>{plan.consolidationDiscount}% Hialeah consolidation discount</li><li>{plan.support} support</li></ul></div>)}</div>
          <p className="mt-4 rounded-md bg-atlas-light p-3 text-xs leading-5 text-slate-600">Plan upgrades are activated by Atlas after annual payment is confirmed. The fee rate in effect when Atlas confirms an order is the rate used for that order.</p>
        </section>
        <SingleProductForm
          addProducts={addProducts}
          products={supplierProducts}
          defaultSupplierName={companyName}
          lockSupplierName
          defaultStatus="pending"
          showAtlasEconomics={false}
          pricingSettings={store.pricingSettings}
          title="Add one product"
          subtitle="Add a single product, or start from a copy of one you already listed and change only what differs (SKU, name, UPC). New products go to Atlas for review."
          submitLabel="Submit for review"
          submittedVerb="submitted to Atlas for review"
        />
        <section className="panel p-5">
          <h2 className="text-xl font-black text-atlas-navy">How buyers can receive your products</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">Choose one or more options for each product. Buyers only see options that qualify for their order quantity and destination ZIP.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-black uppercase text-atlas-blue">1 · Pickup</p><p className="mt-1 font-black text-atlas-navy">Buyer collects the order</p><p className="mt-1 text-xs leading-5 text-slate-600">Enter the authorized warehouse address and when the order will be ready. No shipping charge.</p></div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-black uppercase text-emerald-700">2 · Included delivery</p><p className="mt-1 font-black text-atlas-navy">You deliver full pallets</p><p className="mt-1 text-xs leading-5 text-slate-600">Use only when delivery is already included in your pallet price. Set the ZIP area and minimum pallets.</p></div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-black uppercase text-amber-700">3 · Paid shipping</p><p className="mt-1 font-black text-atlas-navy">Buyer pays shipping</p><p className="mt-1 text-xs leading-5 text-slate-600">Define where you ship, the method, rate basis, price, and lead time. Atlas adds it at checkout.</p></div>
          </div>
          <div className="mt-4 grid gap-4">
            {supplierProducts.map((product) => (
              <FulfillmentRulesEditor key={product.id} product={product} onSave={(rules) => updateProduct(product.id, { spec: { ...(product.spec ?? {}), fulfillment: rules } })} />
            ))}
            {!supplierProducts.length && <p className="rounded-md bg-atlas-light p-4 text-sm text-slate-600">Add a product before configuring fulfillment.</p>}
          </div>
        </section>
        <section className="panel overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-xl font-black text-atlas-navy">Your products</h2>
            <p className="mt-1 text-sm text-slate-600">Inventory, status, and details for items you&apos;ve listed.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1160px] text-left text-sm">
              <thead className="bg-atlas-light text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">{t("brandLabel")}</th>
                  <th className="px-5 py-3">{t("productHeader")}</th>
                  <th className="px-5 py-3">Customer case price</th>
                  <th className="px-5 py-3">{t("hub")}</th>
                  <th className="px-5 py-3">{t("dimensions")}</th>
                  <th className="px-5 py-3">{t("inventory")}</th>
                  <th className="px-5 py-3">{t("status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {supplierProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="px-5 py-4 font-bold">{product.sku}</td>
                    <td className="px-5 py-4">{product.brand}</td>
                    <td className="px-5 py-4">{product.description}</td>
                    <td className="px-5 py-4">${(product.spec?.customerCasePrice ?? product.supplierCost).toFixed(2)}</td>
                    <td className="px-5 py-4">{product.preferredHub ?? "Orlando hub"}</td>
                    <td className="px-5 py-4">
                      <p>{t("dimProduct")}: {product.productDimensions || t("notProvided")}</p>
                      <p>{t("dimCase")}: {product.caseDimensions || t("notProvided")}</p>
                      <p>{t("dimPallet")}: {product.palletConfiguration || t("notProvided")}</p>
                    </td>
                    <td className="px-5 py-4">
                      <input
                        className="field w-28"
                        type="number"
                        value={product.inventoryAvailable}
                        onChange={(event) => updateInventory(product.id, Number(event.target.value))}
                      />
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={product.spec?.draft ? "Draft" : product.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        </div>
        </div>
      </main>
    </>
  );
}

function FulfillmentRulesEditor({ product, onSave }: { product: Product; onSave: (rules: SupplierFulfillmentRules) => void }) {
  const existing = product.spec?.fulfillment;
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const pickupEnabled = data.get("pickupEnabled") === "on";
    const includedEnabled = data.get("includedEnabled") === "on";
    const shippingEnabled = data.get("shippingEnabled") === "on";
    const rules: SupplierFulfillmentRules = {
      pickup: {
        enabled: pickupEnabled,
        locationName: String(data.get("locationName") || ""), address: String(data.get("address") || ""),
        city: String(data.get("city") || ""), state: String(data.get("state") || "").toUpperCase(), zip: String(data.get("pickupZip") || "").replace(/\D/g, "").slice(0, 5),
        instructions: String(data.get("instructions") || "") || undefined, leadTime: String(data.get("pickupLeadTime") || ""),
      },
      includedDelivery: {
        enabled: includedEnabled, zipPrefixes: parseZipPrefixes(String(data.get("includedZips") || "")), areaLabel: String(data.get("areaLabel") || ""),
        minimumPallets: Math.max(1, Number(data.get("minimumPallets")) || 1), leadTime: String(data.get("includedLeadTime") || ""),
      },
      shipping: {
        enabled: shippingEnabled, zipPrefixes: parseZipPrefixes(String(data.get("shippingZips") || "")), coverageLabel: String(data.get("coverageLabel") || ""),
        method: String(data.get("shippingMethod") || ""), rateMethod: String(data.get("rateMethod") || "flat") as "flat" | "per_case" | "per_pallet",
        rate: Math.max(0, Number(data.get("shippingRate")) || 0), leadTime: String(data.get("shippingLeadTime") || ""),
      },
    };
    if (pickupEnabled && (!rules.pickup?.address || !rules.pickup.city || rules.pickup.state.length !== 2 || rules.pickup.zip.length !== 5 || !rules.pickup.leadTime)) return setMessage("Pickup requires a complete authorized address, 2-letter state, ZIP, and lead time.");
    if (includedEnabled && (!rules.includedDelivery?.zipPrefixes.length || !rules.includedDelivery.areaLabel || !rules.includedDelivery.leadTime)) return setMessage("Included delivery requires coverage ZIP prefixes, an area label, minimum pallets, and lead time.");
    if (shippingEnabled && (!rules.shipping?.zipPrefixes.length || !rules.shipping.method || !rules.shipping.leadTime || rules.shipping.rate <= 0)) return setMessage("Shipping requires coverage ZIP prefixes, method, positive rate, and lead time.");
    if (!pickupEnabled && !includedEnabled && !shippingEnabled) return setMessage("Enable at least one fulfillment option before saving.");
    onSave(rules);
    setMessage("Fulfillment settings saved.");
  }

  return <div className="border border-slate-200">
    <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
      <span><span className="block font-black text-atlas-navy">{product.brand} · {product.productName}</span><span className="mt-0.5 block text-xs text-slate-500">SKU {product.sku} · {existing ? [existing.pickup?.enabled && "pickup", existing.includedDelivery?.enabled && "included delivery", existing.shipping?.enabled && "shipping"].filter(Boolean).join(", ") || "none enabled" : "not configured"}</span></span>
      <span className="text-sm font-black text-atlas-blue">{open ? "Close" : "Configure"}</span>
    </button>
    {open && <form onSubmit={submit} className="grid gap-5 border-t border-slate-200 bg-atlas-light p-4">
      <fieldset className="grid gap-3 rounded-xl border-2 border-slate-200 bg-white p-4"><legend className="px-2 font-black text-atlas-navy"><MapPin size={17} className="mr-2 inline text-atlas-blue" />Option 1 — Warehouse pickup</legend><p className="text-sm text-slate-600">The buyer collects the order from your authorized location. Pickup has no delivery charge.</p><Toggle name="pickupEnabled" label="Yes, allow buyers to pick up this product" checked={existing?.pickup?.enabled} /><div className="grid gap-3 md:grid-cols-2"><Field name="locationName" label="Pickup location name" placeholder="Main warehouse" defaultValue={existing?.pickup?.locationName} /><Field name="address" label="Pickup street address" defaultValue={existing?.pickup?.address} /><Field name="city" label="City" defaultValue={existing?.pickup?.city} /><Field name="state" label="State (2 letters)" defaultValue={existing?.pickup?.state} maxLength={2} /><Field name="pickupZip" label="Pickup ZIP" defaultValue={existing?.pickup?.zip} maxLength={5} /><Field name="pickupLeadTime" label="When will it be ready?" placeholder="Ready in 1 business day" defaultValue={existing?.pickup?.leadTime} /></div><Field name="instructions" label="Instructions buyers should see (optional)" placeholder="Call 30 minutes before arrival" defaultValue={existing?.pickup?.instructions} /></fieldset>
      <fieldset className="grid gap-3 rounded-xl border-2 border-emerald-200 bg-white p-4"><legend className="px-2 font-black text-atlas-navy"><Truck size={17} className="mr-2 inline text-emerald-600" />Option 2 — Delivery included in the pallet price</legend><div className="rounded-md bg-emerald-50 p-3 text-xs font-semibold leading-5 text-emerald-900">Choose this only if you deliver complete pallets and the delivery cost is already included in the product&apos;s pallet price. Atlas will add $0 shipping.</div><Toggle name="includedEnabled" label="Yes, offer included delivery for qualifying pallet orders" checked={existing?.includedDelivery?.enabled} /><div className="grid gap-3 md:grid-cols-2"><Field name="includedZips" label="ZIP codes or prefixes you cover" placeholder="331, 33010, 334" defaultValue={existing?.includedDelivery?.zipPrefixes.join(", ")} /><Field name="areaLabel" label="Area name buyers will see" placeholder="Miami-Dade and Broward" defaultValue={existing?.includedDelivery?.areaLabel} /><Field name="minimumPallets" label="Minimum number of full pallets" type="number" min={1} defaultValue={existing?.includedDelivery?.minimumPallets ?? 1} /><Field name="includedLeadTime" label="Delivery lead time" placeholder="2–3 business days" defaultValue={existing?.includedDelivery?.leadTime} /></div><p className="text-xs text-slate-500">Checkout shows this only when this supplier&apos;s products are ordered as complete pallets, the pallet minimum is met, and the destination ZIP is covered.</p></fieldset>
      <fieldset className="grid gap-3 rounded-xl border-2 border-amber-200 bg-white p-4"><legend className="px-2 font-black text-atlas-navy"><Boxes size={17} className="mr-2 inline text-amber-600" />Option 3 — Shipping added at checkout</legend><div className="rounded-md bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-900">Use this when shipping is not included in the product price. Atlas calculates your rate and adds it to the buyer&apos;s order.</div><Toggle name="shippingEnabled" label="Yes, offer paid shipping for this product" checked={existing?.shipping?.enabled} /><div className="grid gap-3 md:grid-cols-2"><Field name="shippingZips" label="ZIP codes or prefixes you ship to" placeholder="33, 34" defaultValue={existing?.shipping?.zipPrefixes.join(", ")} /><Field name="coverageLabel" label="Area name buyers will see" placeholder="Florida" defaultValue={existing?.shipping?.coverageLabel} /><Field name="shippingMethod" label="Shipping method" placeholder="LTL freight" defaultValue={existing?.shipping?.method} /><label className="grid gap-1 text-sm font-bold text-atlas-navy">How is shipping charged?<select className="field" name="rateMethod" defaultValue={existing?.shipping?.rateMethod ?? "flat"}><option value="flat">One flat rate per supplier order</option><option value="per_case">Rate multiplied by number of cases</option><option value="per_pallet">Rate multiplied by number of pallets</option></select></label><Field name="shippingRate" label="Shipping rate ($)" type="number" min={0.01} step="0.01" defaultValue={existing?.shipping?.rate} /><Field name="shippingLeadTime" label="Shipping lead time" placeholder="3–5 business days" defaultValue={existing?.shipping?.leadTime} /></div></fieldset>
      {message && <p className={`text-sm font-bold ${message.includes("saved") ? "text-emerald-700" : "text-red-700"}`}>{message}</p>}
      <button type="submit" className="btn-primary w-fit">Save fulfillment options</button>
    </form>}
  </div>;
}

function Toggle({ name, label, checked }: { name: string; label: string; checked?: boolean }) { return <label className="flex items-center gap-2 text-sm font-bold text-atlas-navy"><input type="checkbox" name={name} defaultChecked={checked} className="h-4 w-4 accent-atlas-blue" />{label}</label>; }
function Field({ name, label, defaultValue, ...props }: { name: string; label: string; defaultValue?: string | number; [key: string]: unknown }) { return <label className="grid gap-1 text-sm font-bold text-atlas-navy">{label}<input className="field" name={name} defaultValue={defaultValue ?? ""} {...props} /></label>; }

function SupplierPaymentCard({ application, companyName }: { application?: Application; companyName: string }) {
  const { t } = useI18n();
  const { setStore } = useAtlasStore();
  const [saved, setSaved] = useState(false);
  if (!application) return null;
  const approved = application.status === "approved";
  const remit = application.remitTo;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (isSupabaseConfigured) return; // server action handles the persisted path
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = {
      payeeName: String(form.get("payeeName") ?? ""),
      email: String(form.get("remitEmail") ?? ""),
      method: String(form.get("remitMethod") ?? "ACH") as "ACH" | "Check" | "Zelle",
      address: String(form.get("remitAddress") ?? "") || undefined
    };
    const appId = application!.id;
    setStore((current) => ({
      ...current,
      applications: current.applications.map((item) => (item.id === appId ? { ...item, remitTo: next } : item))
    }));
    setSaved(true);
  }

  return (
    <section className="panel p-5">
      <h2 className="flex items-center gap-2 text-xl font-black text-atlas-navy">
        <Wallet className="text-atlas-blue" size={20} />
        {t("paymentSectionTitle")}
      </h2>
      {!approved ? (
        <p className="mt-2 rounded-md bg-atlas-light p-3 text-sm text-slate-600">{t("paymentLockedNote")}</p>
      ) : (
        <form action={isSupabaseConfigured ? saveSupplierPayment : undefined} onSubmit={onSubmit} className="mt-3 grid gap-3">
          <p className="text-sm text-slate-600">{t("paymentSectionBody")}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="label">{t("payeeNameLabel")}</span>
              <input className="field" name="payeeName" defaultValue={remit?.payeeName ?? companyName} required />
            </label>
            <label className="grid gap-2">
              <span className="label">{t("remitEmailLabel")}</span>
              <input className="field" name="remitEmail" type="email" defaultValue={remit?.email ?? application.email} required />
            </label>
            <label className="grid gap-2">
              <span className="label">{t("remitMethodLabel")}</span>
              <select className="field" name="remitMethod" defaultValue={remit?.method ?? "ACH"}>
                <option value="ACH">ACH</option>
                <option value="Check">Check</option>
                <option value="Zelle">Zelle</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="label">{t("remitAddressLabel")}</span>
              <input className="field" name="remitAddress" defaultValue={remit?.address ?? ""} />
            </label>
          </div>
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{t("paymentSecurityNote")}</p>
          <button className="btn-primary w-fit" type="submit">{t("savePaymentDetails")}</button>
          {(saved || remit) && <p className="text-sm font-semibold text-emerald-700">{t("paymentSavedNote")}</p>}
        </form>
      )}
    </section>
  );
}
