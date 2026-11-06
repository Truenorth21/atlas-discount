"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Boxes, CheckCircle2, CircleAlert, CreditCard, FileText, MapPin, Megaphone, PackagePlus, Truck, Wallet } from "lucide-react";
import { Nav } from "@/components/nav";
import { ProductUpload } from "@/components/product-upload";
import { ManageProductsList, SingleProductForm } from "@/app/admin/admin-client";
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
  const { store, addProducts, addPromotionSubmission, updateProduct } = useAtlasStore();
  const [promo, setPromo] = useState(t("noPromotionSubmitted"));
  const [identity, setIdentity] = useState<{ isAdmin: boolean; companyName: string } | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "fulfillment" | "promotions" | "payments" | "account">("overview");
  const [showProductForm, setShowProductForm] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const adPlacements = [
    "Weekly deals email",
    "Sponsored category",
    "Featured product",
    "New & trending spotlight",
    "Closeout listing",
    "WhatsApp promotion"
  ];
  const supplierApplications = store.applications
    .filter((application) => application.type === "supplier")
    .sort((a, b) => a.companyName.localeCompare(b.companyName));

  useEffect(() => {
    fetch("/api/session", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (data) setIdentity({ isAdmin: Boolean(data.isAdmin), companyName: String(data.companyName ?? "") });
      })
      .catch(() => setIdentity(null));
  }, []);

  useEffect(() => {
    if (!identity) return;
    if (identity.isAdmin) {
      if (!supplierApplications.some((application) => application.id === selectedSupplierId)) {
        setSelectedSupplierId(supplierApplications[0]?.id ?? "");
      }
      return;
    }
    const ownApplication = supplierApplications.find((application) => application.companyName === identity.companyName);
    setSelectedSupplierId(ownApplication?.id ?? "");
  }, [identity, selectedSupplierId, store.applications]);

  const supplierApplication = identity?.isAdmin
    ? supplierApplications.find((application) => application.id === selectedSupplierId)
    : supplierApplications.find((application) => application.companyName === identity?.companyName);
  const companyName = supplierApplication?.companyName ?? identity?.companyName ?? "Current Supplier";
  const membership = supplierMembershipPlan(store.pricingSettings, companyName);
  const membershipAssignment = (store.pricingSettings.supplierMemberships ?? []).find((item) => item.supplierName === companyName);
  // The server-verified identity locks vendors to their company. Only admins can change the selected supplier.
  const supplierProducts = store.products.filter((product) => product.supplierName === companyName);
  const documentAlerts = getDocumentAlerts(store.applications, "supplier");
  const assignment = supplierApplication
    ? (store.pricingSettings.supplierAssignments ?? []).find((a) => a.supplierId === supplierApplication.id)
    : undefined;
  const fulfillment = fulfillmentTiers.find((t) => t.id === (assignment?.fulfillmentTier ?? defaultFulfillmentTierId)) ?? fulfillmentTiers[0];
  const activeProducts = supplierProducts.filter((product) => product.status === "approved" && !product.spec?.draft).length;
  const pendingProducts = supplierProducts.filter((product) => product.status === "pending" && !product.spec?.draft).length;
  const draftProducts = supplierProducts.filter((product) => product.spec?.draft).length;
  const configuredFulfillment = supplierProducts.filter((product) => Boolean(product.spec?.fulfillment)).length;
  const promotionSubmissions = store.promotionSubmissions.filter((item) => item.supplierName === companyName || item.supplierName === "Current Supplier");
  const isPrelisted = Boolean(supplierApplication?.id.startsWith("prelisted-supplier-"));
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "products", label: `Products (${supplierProducts.length})` },
    { id: "fulfillment", label: "Fulfillment" },
    { id: "promotions", label: "Promotions" },
    { id: "payments", label: "Payments" },
    { id: "account", label: "Account & documents" }
  ] as const;

  function updateInventory(id: string, inventoryAvailable: number) {
    updateProduct(id, { inventoryAvailable });
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

  if (!identity) {
    return <><Nav /><main className="atlas-container py-8"><section className="panel p-6 text-sm font-semibold text-slate-600">Loading your supplier workspace…</section></main></>;
  }

  return <><Nav /><main className="atlas-container py-8">
    <DashboardHero title={identity.isAdmin ? `Supplier workspace · ${companyName}` : t("supplierDashboard")} subtitle={identity.isAdmin ? "Manage this supplier’s products, fulfillment, promotions, payments, and onboarding." : "Manage products, fulfillment, promotions, and account setup."} />

    {identity.isAdmin && <section className="sticky top-2 z-20 mt-6 rounded-xl border-2 border-atlas-blue bg-white p-4 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-black uppercase tracking-wide text-atlas-blue">Atlas admin mode</p><p className="font-black text-atlas-navy">You are managing this supplier on behalf of Atlas.</p></div>
        <div className="flex min-w-[280px] flex-wrap items-center gap-2"><select className="field flex-1" value={selectedSupplierId} onChange={(event) => { setSelectedSupplierId(event.target.value); setActiveTab("overview"); }}><option value="">Select a supplier…</option>{supplierApplications.map((application) => <option key={application.id} value={application.id}>{application.companyName}</option>)}</select><span className={`badge ${isPrelisted ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{isPrelisted ? "Pre-listed · not registered" : supplierApplication?.status ?? "Unknown"}</span></div>
      </div>
    </section>}

    <nav className="mt-6 flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2" aria-label="Supplier workspace sections">
      {tabs.map((tab) => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`min-h-11 whitespace-nowrap rounded-lg px-4 text-sm font-black ${activeTab === tab.id ? "bg-atlas-navy text-white" : "text-atlas-navy hover:bg-atlas-light"}`}>{tab.label}</button>)}
    </nav>

    <div className="mt-6 grid gap-6">
      {activeTab === "overview" && <>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <WorkspaceMetric label="Active products" value={activeProducts} detail={`${pendingProducts} pending · ${draftProducts} drafts`} />
          <WorkspaceMetric label="Fulfillment ready" value={`${configuredFulfillment}/${supplierProducts.length}`} detail="Products with buyer delivery options" />
          <WorkspaceMetric label="Membership" value={membership.name} detail={`${membership.caseFee}% case · ${membership.palletFee}% pallet fee`} />
          <WorkspaceMetric label="Account status" value={isPrelisted ? "Not registered" : supplierApplication?.status ?? "Unknown"} detail={isPrelisted ? "Atlas can prepare listings now" : "Supplier onboarding record"} />
        </section>
        <section className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
          <div className="panel p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase text-atlas-blue">Next actions</p><h2 className="mt-1 text-xl font-black text-atlas-navy">Finish the supplier setup</h2></div><button className="btn-primary" type="button" onClick={() => { setActiveTab("products"); setShowProductForm(true); }}><PackagePlus size={17} /> Add product</button></div><div className="mt-5 grid gap-3"><ChecklistItem complete={supplierProducts.length > 0} title="Add the first product" body="Enter one product or upload the guided spreadsheet." /><ChecklistItem complete={configuredFulfillment > 0} title="Configure fulfillment" body="Set pickup, included pallet delivery, or paid shipping per product." /><ChecklistItem complete={!isPrelisted} title="Connect the supplier account" body={isPrelisted ? "Supplier has not registered. Atlas may continue preparing listings." : "Supplier account is connected to this workspace."} /><ChecklistItem complete={Boolean(supplierApplication?.remitTo)} title="Set payment details" body="Required before Atlas can remit supplier proceeds." /></div></div>
          <div className="panel p-5"><p className="text-xs font-black uppercase text-atlas-blue">How Atlas routing works</p><h2 className="mt-1 text-xl font-black text-atlas-navy">Inventory stays with the supplier until release.</h2><ol className="mt-4 grid gap-3 text-sm text-slate-600"><li><strong className="text-atlas-navy">1. Atlas approves</strong><br />Atlas confirms the buyer order and issues routing instructions.</li><li><strong className="text-atlas-navy">2. Supplier routes goods</strong><br />Send to Hialeah, ship direct, or prepare an authorized pickup.</li><li><strong className="text-atlas-navy">3. Atlas protects the relationship</strong><br />Only fulfillment-required buyer information is shared.</li></ol></div>
        </section>
      </>}

      {activeTab === "products" && <><section className="panel p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase text-atlas-blue">Product catalog</p><h2 className="mt-1 text-2xl font-black text-atlas-navy">Products for {companyName}</h2><p className="mt-1 text-sm text-slate-600">Add, upload, edit, save drafts, and submit listings for review from one place.</p></div><button className="btn-primary" type="button" onClick={() => setShowProductForm((value) => !value)}><PackagePlus size={17} />{showProductForm ? "Close product form" : "Add one product"}</button></div></section>
        <ProductUpload key={companyName} supplierName={companyName} defaultStatus="pending" />
        {showProductForm && <SingleProductForm addProducts={addProducts} products={supplierProducts} defaultSupplierName={companyName} lockSupplierName defaultStatus="pending" showAtlasEconomics={false} progressiveSteps pricingSettings={store.pricingSettings} title="Add product" subtitle="Complete the five short steps, save a draft at any point, or submit it to Atlas for review." submitLabel="Submit for review" submittedVerb="submitted to Atlas for review" />}
        <ManageProductsList products={supplierProducts} updateProduct={updateProduct} allowDelete={false} supplierFacing pricingSettings={store.pricingSettings} /></>}

      {activeTab === "fulfillment" && <section className="grid gap-5"><div className="panel p-5"><p className="text-xs font-black uppercase text-atlas-blue">Buyer delivery choices</p><h2 className="mt-1 text-2xl font-black text-atlas-navy">Configure fulfillment by product</h2><p className="mt-1 text-sm text-slate-600">Only eligible options appear at checkout based on the supplier, product quantity, and destination ZIP.</p><div className="mt-4 grid gap-3 md:grid-cols-3"><FulfillmentSummary tone="blue" title="Warehouse pickup" body="Buyer collects from an authorized location." /><FulfillmentSummary tone="green" title="Included pallet delivery" body="Supplier delivery is included in the full-pallet price." /><FulfillmentSummary tone="amber" title="Paid shipping" body="Atlas adds the supplier-defined shipping charge at checkout." /></div></div>{supplierProducts.map((product) => <FulfillmentRulesEditor key={product.id} product={product} onSave={(rules) => updateProduct(product.id, { spec: { ...(product.spec ?? {}), fulfillment: rules } })} />)}{!supplierProducts.length && <EmptyAction title="Add a product before configuring fulfillment" action="Go to products" onClick={() => setActiveTab("products")} />}</section>}

      {activeTab === "promotions" && <section className="grid gap-5 lg:grid-cols-[1fr_.9fr]">{supplierProducts.length ? <form className="panel p-6" onSubmit={submitPromotion}><h2 className="flex items-center gap-2 text-xl font-black"><Megaphone className="text-atlas-blue" />Request advertising</h2><p className="mt-2 text-sm text-slate-600">Atlas confirms availability, dates, price, and placement before anything is charged or activated.</p><label className="mt-4 grid gap-2"><span className="label">{t("placementLabel")}</span><select className="field" name="placement" required>{adPlacements.map((placement) => <option key={placement}>{placement}</option>)}</select></label><label className="mt-3 grid gap-2"><span className="label">Product to promote</span><select className="field" name="promotionProduct" required><option value="">Select a product…</option>{supplierProducts.map((product) => <option key={product.id} value={`${product.brand} · ${product.productName}`}>{product.brand} · {product.productName}</option>)}</select></label><textarea className="field mt-3 min-h-24" name="promotion" placeholder={t("promotionPlaceholder")} /><button className="btn-primary mt-3" type="submit">Submit advertising request</button><p className="mt-3 text-sm font-semibold text-atlas-blue">{promo}</p></form> : <EmptyAction title="Add a product before requesting advertising" action="Add product" onClick={() => { setActiveTab("products"); setShowProductForm(true); }} />}<div className="panel p-5"><h2 className="text-xl font-black text-atlas-navy">Advertising requests</h2><p className="mt-1 text-sm text-slate-600">Request → approval → invoice → scheduled → live → results.</p><div className="mt-4 grid gap-2">{promotionSubmissions.map((item) => <div key={item.id} className="rounded-md border border-slate-200 p-3 text-sm"><div className="flex items-center justify-between gap-3"><div><p className="font-black text-atlas-navy">{item.placement}</p><p className="text-xs text-slate-500">{item.productName}</p></div><StatusBadge status={item.status} /></div></div>)}{!promotionSubmissions.length && <p className="rounded-md bg-atlas-light p-4 text-sm text-slate-600">No advertising requests yet.</p>}</div></div></section>}

      {activeTab === "payments" && <SupplierPaymentCard application={supplierApplication} companyName={companyName} />}

      {activeTab === "account" && <section className="grid gap-6 lg:grid-cols-2"><div className="panel p-5"><h2 className="flex items-center gap-2 text-xl font-black text-atlas-navy"><FileText size={20} className="text-atlas-blue" />Documents and onboarding</h2>{isPrelisted ? <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">This company was pre-listed by Atlas and has not registered. Product drafts may be prepared now; documents and payment setup begin after registration.</p> : <div className="mt-4 grid gap-2">{supplierApplication?.documents.map((document) => <div key={document.id} className="flex items-start justify-between gap-3 rounded-md bg-atlas-light p-3 text-sm"><div><p className="font-bold text-atlas-navy">{document.label}</p><p className="text-slate-600">{document.fileName ?? t("noFileUploaded")}</p></div><StatusBadge status={document.status} /></div>)}{!supplierApplication?.documents.length && <p className="text-sm text-slate-600">No documents have been submitted.</p>}</div>}{documentAlerts.length > 0 && <p className="mt-3 text-sm font-bold text-amber-700">{documentAlerts.length} document alert{documentAlerts.length === 1 ? "" : "s"} need attention.</p>}</div><div className="panel p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase text-atlas-blue">Annual membership</p><h2 className="mt-1 text-xl font-black text-atlas-navy">{membership.name} plan</h2><p className="mt-1 text-sm text-slate-600">{membership.caseFee}% case fee · {membership.palletFee}% pallet fee · {membership.promotionFee}% promotion fee</p>{membershipAssignment?.expiresAt && <p className="mt-1 text-xs text-slate-500">Active through {membershipAssignment.expiresAt}</p>}</div><CreditCard className="text-atlas-blue" /></div><button className="btn-secondary mt-4" type="button" onClick={() => setShowPlans((value) => !value)}>{showPlans ? "Hide plan comparison" : "Compare annual plans"}</button>{showPlans && <div className="mt-4 grid gap-3 sm:grid-cols-2">{supplierMembershipPlans.map((plan) => <div key={plan.id} className={`rounded-xl border-2 p-3 ${plan.id === membership.id ? "border-atlas-blue bg-sky-50" : "border-slate-200"}`}><div className="flex justify-between gap-2"><p className="font-black text-atlas-navy">{plan.name}</p><p className="font-black">${plan.annualPrice}/yr</p></div><p className="mt-2 text-xs text-slate-600">{plan.caseFee}% case · {plan.palletFee}% pallet · {plan.listingLimit ?? "Unlimited"} listings</p></div>)}</div>}<p className="mt-4 rounded-md bg-atlas-light p-3 text-xs text-slate-600">Atlas activates upgrades after annual payment is confirmed.</p></div></section>}
    </div>
  </main></>;
}

function WorkspaceMetric({ label, value, detail }: { label: string; value: string | number; detail: string }) { return <div className="panel p-5"><p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-2xl font-black capitalize text-atlas-navy">{value}</p><p className="mt-1 text-xs text-slate-600">{detail}</p></div>; }
function ChecklistItem({ complete, title, body }: { complete: boolean; title: string; body: string }) { return <div className="flex gap-3 rounded-lg border border-slate-200 p-3">{complete ? <CheckCircle2 className="shrink-0 text-emerald-600" size={21} /> : <CircleAlert className="shrink-0 text-amber-600" size={21} />}<div><p className="font-black text-atlas-navy">{title}</p><p className="text-sm text-slate-600">{body}</p></div></div>; }
function FulfillmentSummary({ tone, title, body }: { tone: "blue" | "green" | "amber"; title: string; body: string }) { const color = tone === "green" ? "border-emerald-200 bg-emerald-50" : tone === "amber" ? "border-amber-200 bg-amber-50" : "border-sky-200 bg-sky-50"; return <div className={`rounded-xl border p-4 ${color}`}><p className="font-black text-atlas-navy">{title}</p><p className="mt-1 text-xs text-slate-600">{body}</p></div>; }
function EmptyAction({ title, action, onClick }: { title: string; action: string; onClick: () => void }) { return <div className="panel p-6 text-center"><p className="font-black text-atlas-navy">{title}</p><button className="btn-primary mt-3" type="button" onClick={onClick}>{action}</button></div>; }

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
