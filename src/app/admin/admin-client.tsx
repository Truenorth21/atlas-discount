"use client";

import { BarChart3, Check, FileCheck2, Megaphone, PackageCheck, Settings, Trash2, UsersRound, X } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { ProductUpload } from "@/components/product-upload";
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
  computeChannelPricing,
  determinePricingMode,
  formatMoney,
  formatPercent,
  marginOfSale,
  productPalletSize,
  standardCasePrice
} from "@/lib/pricing";
import { adPlacements, atlasHubs, defaultFulfillmentTierId, fulfillmentTiers, fulfillmentTypes, productCategories } from "@/lib/data";
import { buildPalletSheetHtml, planOrderPallets } from "@/lib/pallets";
import type { AccountPricing, Application, AtlasHub, CartLine, CustomerTier, DocumentStatus, OrderRequest, PlacementBooking, PricingSettings, Product, ProductSpec, PromotionSubmission, QuoteAdjustment, SupplierAssignment, TierPricing } from "@/lib/types";

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

export function AdminClient() {
  const { store, addProducts, updateApplicationStatus, updateApplicationDocumentStatus, updateProductStatus, updateProductPromotion, updateProductPlacements, updateProductTierPricing, updateProduct, deleteProduct, updatePricingSettings, updateQuoteAdjustment, updatePromotionSubmissionStatus } = useAtlasStore();
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [rejectionNotes, setRejectionNotes] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("overview");
  const [activeQuoteTab, setActiveQuoteTab] = useState("workflow");
  const pendingProducts = store.products.filter((product) => product.status === "pending");
  const documentAlerts = getDocumentAlerts(store.applications);
  const quoteReviewOrders = store.orders.filter((order) => {
    const adjustment = store.quoteAdjustments.find((item) => item.orderId === order.id);
    const effectiveFulfillment = adjustment?.fulfillmentType ?? order.fulfillmentType;
    return (
      effectiveFulfillment !== "Pickup" ||
      (order.lineItems ?? []).some((line) => line.product.preferredHub === "Supplier direct") ||
      order.status !== "Ready to confirm"
    );
  });
  const pickupReadyOrders = store.orders.length - quoteReviewOrders.length;
  const uploadedDocumentCount = store.applications.reduce((sum, item) => sum + item.documents.filter((document) => document.status === "uploaded").length, 0);
  const userPendingCount = store.applications.filter((item) => item.status === "pending").length;
  const openQuoteCount = store.orders.filter((order) => order.status !== "Ready to confirm").length;
  const promoRequestCount = store.promotionSubmissions.filter((submission) => submission.status === "pending").length;
  const tabs = [
    { id: "overview", label: "Overview", count: uploadedDocumentCount + userPendingCount + pendingProducts.length + quoteReviewOrders.length },
    { id: "documents", label: "Documents", count: uploadedDocumentCount },
    { id: "users", label: "Users", count: userPendingCount },
    { id: "products", label: "Products", count: pendingProducts.length },
    { id: "quotes", label: "Quotes", count: store.orders.length },
    { id: "fulfillment", label: "Fulfillment", count: quoteReviewOrders.length },
    { id: "pricing", label: "Fees & rules", count: 1 },
    { id: "customerPricing", label: "Product prices", count: store.products.filter((product) => product.status !== "rejected").length },
    { id: "marketing", label: "Marketing", count: 8 }
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
          <Metric icon={<UsersRound />} label="Users pending" value={userPendingCount} />
          <Metric icon={<FileCheck2 />} label="Docs to review" value={uploadedDocumentCount} />
          <Metric icon={<PackageCheck />} label="Product approvals" value={pendingProducts.length} />
          <Metric icon={<Check />} label="Open quotes" value={openQuoteCount} />
          <Metric icon={<Megaphone />} label="Promo requests" value={promoRequestCount} />
        </section>
        <section className="panel p-2">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
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
        {activeTab === "overview" && (
          <AdminOverviewPanel
            documentAlerts={documentAlerts.length}
            pendingDocuments={uploadedDocumentCount}
            pendingProducts={pendingProducts.length}
            pickupReadyOrders={pickupReadyOrders}
            quoteReviewOrders={quoteReviewOrders.length}
            setActiveTab={setActiveTab}
            store={store}
            userPendingCount={userPendingCount}
          />
        )}
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
          <DocumentReviewQueue
            applications={store.applications}
            rejectionNotes={rejectionNotes}
            rejectionReasons={rejectionReasons}
            setRejectionNotes={setRejectionNotes}
            setRejectionReasons={setRejectionReasons}
            updateApplicationDocumentStatus={updateApplicationDocumentStatus}
          />
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
          <ProductAdminPanel
            addProducts={addProducts}
            pendingProducts={pendingProducts}
            products={store.products}
            pricingSettings={store.pricingSettings}
            updateProductStatus={updateProductStatus}
            updateProduct={updateProduct}
            deleteProduct={deleteProduct}
          />
        )}
        {activeTab === "quotes" && <section className="panel overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-xl font-black">Orders and quote requests</h2>
            <p className="mt-1 text-sm text-slate-600">
              Hub pickup orders use shelf pricing automatically. Delivery, freight, supplier-direct, and special pricing move into quote review.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <QuoteStatusCard label="Pickup ready" value={pickupReadyOrders} body="Buyer can confirm after Atlas checks availability." tone="green" />
              <QuoteStatusCard label="Needs quote" value={quoteReviewOrders.length} body="Admin reviews route, fees, and final margin." tone="amber" />
              <QuoteStatusCard label="Avg. cases" value={Math.round(store.orders.reduce((sum, order) => sum + order.totalCases, 0) / Math.max(store.orders.length, 1))} body="Mixed cases can qualify by cases or order value." />
              <QuoteStatusCard label="Buyer owner" value="Atlas" body="Supplier-direct still runs through Atlas quoting and support." />
            </div>
            <div className="mt-4 flex flex-wrap gap-2 rounded-md bg-atlas-light p-2">
              {[
                ["workflow", "Workflow"],
                ["builder", "Quote builder"],
                ["requests", "Requests table"]
              ].map(([id, label]) => (
                <button
                  key={id}
                  className={`rounded-md px-4 py-2 text-sm font-black ${activeQuoteTab === id ? "bg-atlas-navy text-white" : "bg-white text-atlas-navy hover:bg-slate-50"}`}
                  type="button"
                  onClick={() => setActiveQuoteTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {activeQuoteTab === "workflow" && (
            <QuoteWorkflowOverview orders={store.orders} pricingSettings={store.pricingSettings} quoteAdjustments={store.quoteAdjustments} />
          )}
          {activeQuoteTab === "requests" && <div className="overflow-x-auto">
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
          </div>}
          {activeQuoteTab === "builder" && <div className="grid gap-4 border-t border-slate-200 p-5">
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
          </div>}
        </section>}
        {activeTab === "pricing" && (
          <PricingSettingsPanel settings={store.pricingSettings} updatePricingSettings={updatePricingSettings} products={store.products} />
        )}
        {activeTab === "customerPricing" && (
          <CustomerPricingPanel
            settings={store.pricingSettings}
            updatePricingSettings={updatePricingSettings}
            applications={store.applications}
            products={store.products}
            updateProductTierPricing={updateProductTierPricing}
            updateProduct={updateProduct}
          />
        )}
        {activeTab === "fulfillment" && <FulfillmentOperationsPanel orders={store.orders} pricingSettings={store.pricingSettings} quoteAdjustments={store.quoteAdjustments} />}
        {activeTab === "marketing" && (
          <MarketingPanel
            settings={store.pricingSettings}
            updatePricingSettings={updatePricingSettings}
            products={store.products}
            applications={store.applications}
            updateProductPromotion={updateProductPromotion}
            updateProductPlacements={updateProductPlacements}
            promotionSubmissions={store.promotionSubmissions}
            updatePromotionSubmissionStatus={updatePromotionSubmissionStatus}
          />
        )}
      </main>
    </>
  );
}

function ProductAdminPanel({
  addProducts,
  pendingProducts,
  products,
  pricingSettings,
  updateProductStatus,
  updateProduct,
  deleteProduct
}: {
  addProducts: ReturnType<typeof useAtlasStore>["addProducts"];
  pendingProducts: Product[];
  products: Product[];
  pricingSettings: PricingSettings;
  updateProductStatus: ReturnType<typeof useAtlasStore>["updateProductStatus"];
  updateProduct: ReturnType<typeof useAtlasStore>["updateProduct"];
  deleteProduct: ReturnType<typeof useAtlasStore>["deleteProduct"];
}) {
  const [activeProductTab, setActiveProductTab] = useState("manage");
  const approvedCount = products.filter((product) => product.status === "approved").length;

  return (
    <section className="grid gap-4">
      <div className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-atlas-navy">Product management</h2>
            <p className="mt-1 text-sm text-slate-600">
              Add Atlas products directly, upload product sheets, or review supplier-submitted items before they show in the catalog.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-black">
            <QueueCount label="Live" value={approvedCount} tone="green" />
            <QueueCount label="Review" value={pendingProducts.length} tone="amber" />
            <QueueCount label="Total" value={products.length} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 rounded-md bg-atlas-light p-2">
          {[
            ["manage", "Manage / edit"],
            ["single", "Add one product"],
            ["upload", "Upload sheet"],
            ["approvals", "Supplier approvals"]
          ].map(([id, label]) => (
            <button
              key={id}
              className={`rounded-md px-4 py-2 text-sm font-black ${activeProductTab === id ? "bg-atlas-navy text-white" : "bg-white text-atlas-navy hover:bg-slate-50"}`}
              type="button"
              onClick={() => setActiveProductTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeProductTab === "manage" && (
        <ManageProductsList products={products} updateProduct={updateProduct} deleteProduct={deleteProduct} />
      )}
      {activeProductTab === "upload" && (
        <ProductUpload
          defaultStatus="approved"
          supplierName="Atlas Admin"
          submitLabel="Publish valid rows"
          submittedMessage="valid products published to the catalog."
        />
      )}
      {activeProductTab === "single" && <SingleProductForm addProducts={addProducts} products={products} />}
      {activeProductTab === "approvals" && (
        <ProductApprovalsList
          pendingProducts={pendingProducts}
          pricingSettings={pricingSettings}
          updateProductStatus={updateProductStatus}
        />
      )}
    </section>
  );
}

function ManageProductsList({
  products,
  updateProduct,
  deleteProduct
}: {
  products: Product[];
  updateProduct: ReturnType<typeof useAtlasStore>["updateProduct"];
  deleteProduct: ReturnType<typeof useAtlasStore>["deleteProduct"];
}) {
  const grouped = Array.from(
    products.reduce((map, product) => {
      const key = product.category || "Uncategorized";
      const list = map.get(key) ?? [];
      list.push(product);
      map.set(key, list);
      return map;
    }, new Map<string, Product[]>())
  ).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <section className="panel p-5">
      <h2 className="text-lg font-black text-atlas-navy">Manage products</h2>
      <p className="mt-1 max-w-3xl text-sm text-slate-600">
        Edit any product&apos;s order rules and pallet, or remove it. <span className="font-bold">Min cases</span> and
        <span className="font-bold"> min order value</span> are per product — a buyer must meet either one. <span className="font-bold">Cases per pallet</span> can
        differ for every item. Prices are set in the Product prices tab.
      </p>
      {products.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No products yet. Use &ldquo;Add one product&rdquo;.</p>
      ) : (
        <div className="mt-4 grid gap-6">
          {grouped.map(([category, items]) => (
            <div key={category}>
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <h4 className="text-sm font-black uppercase tracking-wide text-atlas-blue">{category}</h4>
                <span className="text-xs font-semibold text-slate-400">{items.length}</span>
              </div>
              <div className="mt-3 grid gap-3">
                {items.map((product) => (
                  <ManageProductRow key={product.id} product={product} updateProduct={updateProduct} deleteProduct={deleteProduct} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ManageProductRow({
  product,
  updateProduct,
  deleteProduct
}: {
  product: Product;
  updateProduct: ReturnType<typeof useAtlasStore>["updateProduct"];
  deleteProduct: ReturnType<typeof useAtlasStore>["deleteProduct"];
}) {
  const [form, setForm] = useState({
    brand: product.brand,
    supplierCost: product.supplierCost ? String(product.supplierCost) : "",
    suggestedRetail: product.suggestedRetail ? String(product.suggestedRetail) : "",
    inventoryAvailable: String(product.inventoryAvailable ?? 0),
    moq: String(product.moq || 1),
    minOrderValue: product.minOrderValue ? String(product.minOrderValue) : "",
    casesPerPallet: String(productPalletSize(product) || ""),
    leadTime: product.leadTime ?? ""
  });
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [refrigerated, setRefrigerated] = useState(!!product.spec?.refrigerated);

  function set(field: keyof typeof form) {
    return (event: ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }
  function save() {
    const cpp = toNum(form.casesPerPallet);
    updateProduct(product.id, {
      brand: form.brand.trim() || product.brand,
      supplierCost: toNum(form.supplierCost) ?? 0,
      suggestedRetail: toNum(form.suggestedRetail) ?? 0,
      inventoryAvailable: toNum(form.inventoryAvailable) ?? 0,
      moq: toNum(form.moq) ?? 1,
      minOrderValue: toNum(form.minOrderValue) ?? 0,
      leadTime: form.leadTime || "Ready now",
      spec: { casesPerPallet: cpp && cpp > 0 ? cpp : undefined, refrigerated }
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="rounded-md border border-slate-200 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-bold text-atlas-navy">
          <span>{product.sku}</span>
          {product.status === "pending" && <span className="badge bg-amber-50 text-amber-800">Pending</span>}
          {product.status === "approved" && <span className="badge bg-emerald-50 text-emerald-700">Live</span>}
        </p>
        {confirmDelete ? (
          <span className="flex items-center gap-2 text-sm">
            <span className="font-bold text-atlas-red">Delete {product.brand}?</span>
            <button className="rounded-md bg-atlas-red px-3 py-1.5 text-xs font-bold text-white" type="button" onClick={() => deleteProduct(product.id)}>
              Yes, delete
            </button>
            <button className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-600" type="button" onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
          </span>
        ) : (
          <button className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-atlas-red" type="button" onClick={() => setConfirmDelete(true)} aria-label={`Delete ${product.brand}`}>
            <Trash2 size={16} />
          </button>
        )}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ManageField label="Product name" value={form.brand} onChange={set("brand")} />
        <ManageField label="SRP / unit ($)" type="number" value={form.suggestedRetail} onChange={set("suggestedRetail")} placeholder="e.g. 4.99" />
        <ManageField label="Case cost ($)" type="number" value={form.supplierCost} onChange={set("supplierCost")} />
        <ManageField label="Min order (cases)" type="number" value={form.moq} onChange={set("moq")} />
        <ManageField label="Min order value ($)" type="number" value={form.minOrderValue} onChange={set("minOrderValue")} placeholder="optional" />
        <ManageField label="Cases per pallet" type="number" value={form.casesPerPallet} onChange={set("casesPerPallet")} placeholder="e.g. 40" />
        <ManageField label="Inventory (cases)" type="number" value={form.inventoryAvailable} onChange={set("inventoryAvailable")} />
        <ManageField label="Lead time" value={form.leadTime} onChange={set("leadTime")} placeholder="Ready now" />
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-bold text-atlas-navy">
          <input type="checkbox" className="h-4 w-4" checked={refrigerated} onChange={(e) => setRefrigerated(e.target.checked)} />
          Cold pack / refrigerated
        </label>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button className="btn-secondary px-4 py-2 text-sm" type="button" onClick={save}>
          {saved ? "Saved" : "Save changes"}
        </button>
        <span className="text-xs text-slate-500">Min order: buyer must reach {form.moq || 1} cases{form.minOrderValue ? ` or ${formatMoney(toNum(form.minOrderValue) ?? 0)}` : ""}.</span>
      </div>
    </div>
  );
}

function ManageField({
  label,
  value,
  onChange,
  type = "text",
  placeholder
}: {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-bold text-slate-600">{label}</span>
      <input className="field h-9 min-h-9" type={type} step="0.01" value={value} onChange={onChange} placeholder={placeholder} />
    </label>
  );
}

function AdminOverviewPanel({
  documentAlerts,
  pendingDocuments,
  pendingProducts,
  pickupReadyOrders,
  quoteReviewOrders,
  setActiveTab,
  store,
  userPendingCount
}: {
  documentAlerts: number;
  pendingDocuments: number;
  pendingProducts: number;
  pickupReadyOrders: number;
  quoteReviewOrders: number;
  setActiveTab: (tab: string) => void;
  store: ReturnType<typeof useAtlasStore>["store"];
  userPendingCount: number;
}) {
  const queueItems = [
    {
      action: "Review documents",
      body: "Uploaded buyer, supplier, and route seller documents waiting for approval or rejection.",
      count: pendingDocuments,
      tab: "documents",
      tone: "amber"
    },
    {
      action: "Approve users",
      body: "New applicants waiting for Atlas to approve, reject, or verify missing details.",
      count: userPendingCount,
      tab: "users",
      tone: "blue"
    },
    {
      action: "Approve products",
      body: "Supplier-uploaded products waiting before they can show in the buyer catalog.",
      count: pendingProducts,
      tab: "products",
      tone: "amber"
    },
    {
      action: "Build quotes",
      body: "Orders needing margin, delivery, supplier-direct, or freight review before sending.",
      count: quoteReviewOrders,
      tab: "quotes",
      tone: "red"
    },
    {
      action: "Confirm pickups",
      body: "Hub pickup orders that are priced and need inventory/pickup confirmation.",
      count: pickupReadyOrders,
      tab: "fulfillment",
      tone: "green"
    },
    {
      action: "Check expirations",
      body: "Documents close to expiration or already expired across buyer and supplier portals.",
      count: documentAlerts,
      tab: "documents",
      tone: "amber"
    }
  ];
  const recentOrders = store.orders.slice(0, 4);

  return (
    <section className="grid gap-5">
      <div className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-atlas-navy">Today&apos;s admin workbench</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              Start here. Each card is a queue that needs an Atlas decision before buyers, suppliers, products, or orders can move forward.
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-slate-200 bg-atlas-light p-3">
          <p className="text-xs font-black uppercase tracking-wide text-atlas-blue">See the site as your users do</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link className="btn-primary" href="/catalog">Buyer catalog</Link>
            <Link className="btn-secondary" href="/dashboard/retailer">Buyer dashboard</Link>
            <Link className="btn-secondary" href="/dashboard/supplier">Supplier dashboard</Link>
            <Link className="btn-secondary" href="/dashboard/route-seller">Sales rep dashboard</Link>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            The buyer catalog opens in admin preview — prices are visible and you can switch the price level to see what each customer tier sees.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {queueItems.map((item) => (
          <button
            key={item.action}
            className="panel p-5 text-left transition hover:border-atlas-blue hover:shadow-lg"
            type="button"
            onClick={() => setActiveTab(item.tab)}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-black text-atlas-navy">{item.action}</p>
                <p className="mt-2 text-sm text-slate-600">{item.body}</p>
              </div>
              <QueueCount label="open" value={item.count} tone={item.tone as "blue" | "amber" | "green" | "red"} />
            </div>
          </button>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <h3 className="text-xl font-black text-atlas-navy">Order processing summary</h3>
            <p className="mt-1 text-sm text-slate-600">
              Hub pickup should be fast. Anything with delivery, freight, supplier direct, or mixed routing should move through quote review.
            </p>
          </div>
          <div className="divide-y divide-slate-200">
            {recentOrders.map((order) => {
              const supplierDirect = (order.lineItems ?? []).some((line) => line.product.preferredHub === "Supplier direct");
              const simplePickup = order.fulfillmentType === "Pickup" && !supplierDirect;

              return (
                <div key={`${order.id}-overview`} className="grid gap-3 p-5 md:grid-cols-[120px_1fr_180px] md:items-center">
                  <Link className="font-black text-atlas-blue underline" href={`/quotes/${order.id}`}>
                    {order.id}
                  </Link>
                  <div>
                    <p className="font-bold text-atlas-navy">{order.buyer}</p>
                    <p className="text-sm text-slate-600">{order.totalCases} cases • {order.hubRouting}</p>
                  </div>
                  <button
                    className={simplePickup ? "btn-secondary" : "btn-primary"}
                    type="button"
                    onClick={() => setActiveTab(simplePickup ? "fulfillment" : "quotes")}
                  >
                    {simplePickup ? "Confirm pickup" : "Build quote"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        <div className="panel p-5">
          <h3 className="text-xl font-black text-atlas-navy">How Atlas makes money here</h3>
          <div className="mt-4 grid gap-3 text-sm">
            <AdminRevenueLine title="Product margin" body="Loose cases carry higher margin. Full pallets get better buyer pricing but still protect per-case margin." />
            <AdminRevenueLine title="Fulfillment fees" body="Hub handling, local delivery, pickup, and freight coordination can be added or waived per quote." />
            <AdminRevenueLine title="Supplier-direct fee" body="Atlas owns the buyer relationship even when the supplier ships directly." />
            <AdminRevenueLine title="Promotions" body="Suppliers can pay for featured products, weekly deals, launches, and category placement." />
          </div>
        </div>
      </div>
    </section>
  );
}

function AdminRevenueLine({ body, title }: { body: string; title: string }) {
  return (
    <div className="rounded-md bg-atlas-light p-3">
      <p className="font-black text-atlas-navy">{title}</p>
      <p className="mt-1 text-slate-600">{body}</p>
    </div>
  );
}

function ProductApprovalsList({
  pendingProducts,
  pricingSettings,
  updateProductStatus
}: {
  pendingProducts: Product[];
  pricingSettings: PricingSettings;
  updateProductStatus: ReturnType<typeof useAtlasStore>["updateProductStatus"];
}) {
  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-slate-200 p-5">
        <h2 className="text-xl font-black">Supplier product approvals</h2>
        <p className="mt-1 text-sm text-slate-600">Review uploaded supplier products before publishing them to buyers.</p>
      </div>
      {pendingProducts.length === 0 ? (
        <div className="p-5 text-sm font-semibold text-slate-600">No supplier products are waiting for review.</div>
      ) : (
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
                    <div><dt className="font-bold">Case sell price</dt><dd>{formatMoney(atlasCaseSellPrice(product.supplierCost, pricingSettings))} / loose case</dd></div>
                    <div><dt className="font-bold">Pallet sell price</dt><dd>{formatMoney(atlasPalletSellPrice(product.supplierCost, pricingSettings))} / case at {casesPerPallet(product.palletConfiguration) || "full pallet"} cases</dd></div>
                    <div><dt className="font-bold">Loose case margin</dt><dd>{formatMoney(atlasCaseSellPrice(product.supplierCost, pricingSettings) - product.supplierCost)}</dd></div>
                    <div><dt className="font-bold">Pallet case margin</dt><dd>{formatMoney(atlasPalletSellPrice(product.supplierCost, pricingSettings) - product.supplierCost)}</dd></div>
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
      )}
    </section>
  );
}

const blankProductForm = {
  sku: "", brand: "", upc: "", gtinCase: "", gtinInner: "",
  productName: "", unitSize: "", description: "", category: "", subcategory: "", imageUrl: "",
  unitL: "", unitW: "", unitH: "", unitWeight: "", unitWeightUnit: "lb",
  innerPack: "", innerL: "", innerW: "", innerH: "", innerWeight: "", innerWeightUnit: "lb",
  casePack: "1", caseL: "", caseW: "", caseH: "", caseWeight: "", caseWeightUnit: "lb",
  palletCasesPerFloor: "", palletLayers: "", palletStandardWeight: "40",
  shippingWarehouse: "Orlando hub", fulfillmentMode: "delivered", pickupAddress: "", pickupPhone: "",
  supplierCost: "", suggestedRetail: "", moq: "1", minOrderValue: "", leadTime: "", inventoryAvailable: "0",
  priceRetailer: "", priceDistributor: "", repCommissionPct: "",
  palletPriceRetailer: "", palletPriceDistributor: "",
  supplierName: "Atlas Admin", promotion: ""
};

const toNum = (value: string) => {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

/** Resolve final Retailer + Distributor case prices from the channel engine (with any overrides). */
function buildTierPricing(form: typeof blankProductForm): TierPricing {
  const pricing = computeChannelPricing({
    caseCost: toNum(form.supplierCost) ?? 0,
    casePack: toNum(form.casePack) ?? 1,
    srpPerUnit: toNum(form.suggestedRetail) ?? 0,
    overrides: {
      retailerCasePrice: toNum(form.priceRetailer),
      distributorCasePrice: toNum(form.priceDistributor),
      salesRepCommissionPct: form.repCommissionPct.trim() !== "" ? (toNum(form.repCommissionPct) ?? 0) / 100 : undefined
    }
  });
  const casePrices: Record<string, number> = {};
  if (pricing.retailer.casePrice > 0) casePrices.retailer = pricing.retailer.casePrice;
  if (pricing.distributor.casePrice > 0) casePrices.distributor = pricing.distributor.casePrice;
  const palletPrices: Record<string, number> = {};
  const palletR = toNum(form.palletPriceRetailer);
  const palletD = toNum(form.palletPriceDistributor);
  if (palletR && palletR > 0) palletPrices.retailer = palletR;
  if (palletD && palletD > 0) palletPrices.distributor = palletD;
  return Object.keys(palletPrices).length > 0 ? { case: casePrices, pallet: palletPrices } : { case: casePrices };
}

const numToStr = (n?: number) => (n === undefined || n === null || Number.isNaN(n) ? "" : String(n));

/** Map an existing product back into the editable form, so a new product can start as a copy. */
function formFromProduct(product: Product): typeof blankProductForm {
  const spec = product.spec;
  const tier = product.tierPricing;
  return {
    ...blankProductForm,
    sku: product.sku ? `${product.sku}-COPY` : "",
    brand: product.brand ?? "",
    upc: product.upc ?? "",
    gtinCase: spec?.gtinCase ?? "",
    gtinInner: spec?.gtinInner ?? "",
    productName: product.productName ?? "",
    unitSize: product.unitSize ?? "",
    description: product.description ?? "",
    category: product.category ?? "",
    subcategory: product.subcategory ?? "",
    imageUrl: product.imageUrl ?? "",
    unitL: numToStr(spec?.unit?.length),
    unitW: numToStr(spec?.unit?.width),
    unitH: numToStr(spec?.unit?.height),
    unitWeight: numToStr(spec?.unit?.weight),
    unitWeightUnit: spec?.unit?.weightUnit ?? "lb",
    innerPack: numToStr(spec?.innerPack),
    innerL: numToStr(spec?.inner?.length),
    innerW: numToStr(spec?.inner?.width),
    innerH: numToStr(spec?.inner?.height),
    innerWeight: numToStr(spec?.inner?.weight),
    innerWeightUnit: spec?.inner?.weightUnit ?? "lb",
    casePack: numToStr(product.casePack) || "1",
    caseL: numToStr(spec?.caseDims?.length),
    caseW: numToStr(spec?.caseDims?.width),
    caseH: numToStr(spec?.caseDims?.height),
    caseWeight: numToStr(spec?.caseDims?.weight),
    caseWeightUnit: spec?.caseDims?.weightUnit ?? "lb",
    palletCasesPerFloor: numToStr(spec?.palletCasesPerFloor),
    palletLayers: numToStr(spec?.palletLayers),
    palletStandardWeight: numToStr(spec?.palletStandardWeight) || "40",
    shippingWarehouse: spec?.shippingWarehouse ?? (product.preferredHub === "Miami hub" ? "Miami hub" : "Orlando hub"),
    fulfillmentMode: spec?.fulfillmentMode ?? "delivered",
    pickupAddress: spec?.pickupAddress ?? "",
    pickupPhone: spec?.pickupPhone ?? "",
    supplierCost: numToStr(product.supplierCost),
    suggestedRetail: numToStr(product.suggestedRetail),
    moq: numToStr(product.moq) || "1",
    minOrderValue: numToStr(product.minOrderValue),
    leadTime: product.leadTime === "Ready now" ? "" : product.leadTime ?? "",
    inventoryAvailable: numToStr(product.inventoryAvailable) || "0",
    priceRetailer: numToStr(tier?.case?.retailer),
    priceDistributor: numToStr(tier?.case?.distributor),
    palletPriceRetailer: numToStr(tier?.pallet?.retailer),
    palletPriceDistributor: numToStr(tier?.pallet?.distributor),
    supplierName: product.supplierName ?? "Atlas Admin",
    promotion: product.promotion ?? ""
  };
}

export function SingleProductForm({
  addProducts,
  products,
  defaultSupplierName = "Atlas Admin",
  lockSupplierName = false,
  defaultStatus = "approved",
  title = "Add one product",
  subtitle = "Only SKU, brand, product name, and category are required — fill in the rest as you have it.",
  submitLabel = "Publish product",
  submittedVerb = "published to the catalog",
  showAtlasEconomics = true
}: {
  addProducts: ReturnType<typeof useAtlasStore>["addProducts"];
  products: Product[];
  defaultSupplierName?: string;
  lockSupplierName?: boolean;
  defaultStatus?: Product["status"];
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  submittedVerb?: string;
  /** Atlas-only cost/margin/channel pricing. Hidden for supplier-facing use. */
  showAtlasEconomics?: boolean;
}) {
  const [form, setForm] = useState({ ...blankProductForm, supplierName: defaultSupplierName });
  const [hasInner, setHasInner] = useState(false);
  const [message, setMessage] = useState("");
  const [copyFromId, setCopyFromId] = useState("");

  const copyOptions = [...products].sort((a, b) => `${a.brand} ${a.productName}`.localeCompare(`${b.brand} ${b.productName}`));

  function copyFrom(id: string) {
    setCopyFromId(id);
    if (!id) return;
    const source = products.find((p) => p.id === id);
    if (!source) return;
    const next = formFromProduct(source);
    if (lockSupplierName) next.supplierName = defaultSupplierName;
    setForm(next);
    setHasInner(source.spec?.hasInner ?? false);
    setMessage(`Copied from ${source.brand} ${source.sku}. Update the SKU, product name, UPC, and any other details — then ${submitLabel.toLowerCase()}.`);
  }

  function clearForm() {
    setForm({ ...blankProductForm, supplierName: defaultSupplierName });
    setHasInner(false);
    setCopyFromId("");
    setMessage("");
  }

  const updateField = (field: keyof typeof blankProductForm) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  // Live pallet math
  const casesPerFloor = toNum(form.palletCasesPerFloor) ?? 0;
  const palletLayers = toNum(form.palletLayers) ?? 0;
  const totalCases = casesPerFloor * palletLayers;
  const caseWeightRaw = toNum(form.caseWeight);
  const caseWeightLb = caseWeightRaw === undefined ? undefined : form.caseWeightUnit === "oz" ? caseWeightRaw / 16 : caseWeightRaw;
  const palletProductWeight = caseWeightLb !== undefined ? caseWeightLb * totalCases : undefined;
  const palletStandard = toNum(form.palletStandardWeight) ?? 0;
  const palletTotalWeight = palletProductWeight !== undefined ? palletProductWeight + palletStandard : undefined;

  const dimWeight = (l: string, w: string, h: string, weight: string, unit: string) => ({
    length: toNum(l),
    width: toNum(w),
    height: toNum(h),
    weight: toNum(weight),
    weightUnit: unit as "lb" | "oz"
  });
  const dimsLabel = (l: string, w: string, h: string) =>
    [l, w, h].some((value) => value.trim() !== "") ? `${l || "?"} x ${w || "?"} x ${h || "?"} in` : "";

  function addProduct() {
    if (!form.sku || !form.brand || !form.productName || !form.category) {
      setMessage("Please fill in at least SKU, brand, product name, and category. Other fields are optional.");
      return;
    }

    const spec: ProductSpec = {
      unit: dimWeight(form.unitL, form.unitW, form.unitH, form.unitWeight, form.unitWeightUnit),
      hasInner,
      innerPack: hasInner ? toNum(form.innerPack) : undefined,
      inner: hasInner ? dimWeight(form.innerL, form.innerW, form.innerH, form.innerWeight, form.innerWeightUnit) : undefined,
      caseDims: dimWeight(form.caseL, form.caseW, form.caseH, form.caseWeight, form.caseWeightUnit),
      gtinCase: form.gtinCase || undefined,
      gtinInner: hasInner ? form.gtinInner || undefined : undefined,
      palletCasesPerFloor: toNum(form.palletCasesPerFloor),
      palletLayers: toNum(form.palletLayers),
      palletStandardWeight: toNum(form.palletStandardWeight),
      fulfillmentMode: form.fulfillmentMode as "pickup" | "delivered",
      shippingWarehouse: form.shippingWarehouse as "Miami hub" | "Orlando hub",
      pickupAddress: form.fulfillmentMode === "pickup" ? form.pickupAddress || undefined : undefined,
      pickupPhone: form.fulfillmentMode === "pickup" ? form.pickupPhone || undefined : undefined
    };

    const location = form.fulfillmentMode === "pickup" && form.pickupAddress ? form.pickupAddress : form.shippingWarehouse;
    const preferredHub = form.shippingWarehouse as AtlasHub;

    const product: Product = {
      id: `admin-${Date.now()}`,
      sku: form.sku,
      brand: form.brand,
      upc: form.upc,
      productName: form.productName,
      description: form.description,
      category: form.category,
      subcategory: form.subcategory,
      unitSize: form.unitSize,
      imageUrl: form.imageUrl || "",
      productDimensions: dimsLabel(form.unitL, form.unitW, form.unitH),
      unitWeight: form.unitWeight ? `${form.unitWeight} ${form.unitWeightUnit}` : "",
      casePack: toNum(form.casePack) ?? 1,
      caseDimensions: dimsLabel(form.caseL, form.caseW, form.caseH),
      caseWeight: form.caseWeight ? `${form.caseWeight} ${form.caseWeightUnit}` : "",
      palletConfiguration:
        totalCases > 0
          ? `${casesPerFloor}/floor × ${palletLayers} high = ${totalCases} cases${palletTotalWeight !== undefined ? ` • ~${Math.round(palletTotalWeight)} lb` : ""}`
          : "",
      supplierCost: toNum(form.supplierCost) ?? 0,
      tierPricing: buildTierPricing(form),
      suggestedRetail: toNum(form.suggestedRetail) ?? 0,
      moq: toNum(form.moq) ?? 1,
      minOrderValue: toNum(form.minOrderValue) ?? 0,
      leadTime: form.leadTime || "Ready now",
      inventoryAvailable: toNum(form.inventoryAvailable) ?? 0,
      location,
      pickupLocation: form.fulfillmentMode === "pickup" ? form.pickupAddress || location : location,
      shippingLocation: form.shippingWarehouse,
      deliveryRadius: "",
      preferredHub,
      routeRecommendation:
        preferredHub === "Miami hub"
          ? "Stage through Miami for South Florida pickup and delivery."
          : "Stage through Orlando for Central Florida pickup and delivery.",
      status: defaultStatus,
      supplierName: (lockSupplierName ? defaultSupplierName : form.supplierName) || defaultSupplierName,
      promotion: form.promotion || undefined,
      spec
    };

    addProducts([product]);
    setMessage(`${product.brand} ${product.sku} was ${submittedVerb}.`);
    setForm((current) => ({ ...blankProductForm, supplierName: current.supplierName, shippingWarehouse: current.shippingWarehouse, fulfillmentMode: current.fulfillmentMode }));
    setHasInner(false);
    setCopyFromId("");
  }

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-atlas-navy">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        </div>
        <button className="btn-primary" type="button" onClick={addProduct}>
          {submitLabel}
        </button>
      </div>

      {copyOptions.length > 0 && (
        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-md border border-slate-200 bg-atlas-light p-3">
          <label className="grid flex-1 gap-1" style={{ minWidth: "16rem" }}>
            <span className="text-sm font-bold text-slate-700">Start from a copy of an existing product</span>
            <select className="input" value={copyFromId} onChange={(event) => copyFrom(event.target.value)}>
              <option value="">Start from blank…</option>
              {copyOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.brand} — {p.productName || p.description} ({p.sku})</option>
              ))}
            </select>
          </label>
          {copyFromId && (
            <button className="btn-secondary" type="button" onClick={clearForm}>
              Clear &amp; start blank
            </button>
          )}
          <p className="w-full text-xs text-slate-500">
            Copying fills in every field from the chosen product. We add “-COPY” to the SKU — change the SKU, product name, and UPC before publishing so you don’t duplicate an item.
          </p>
        </div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <ProductSectionHeading>Identifiers</ProductSectionHeading>
        <AdminProductInput label="SKU *" value={form.sku} onChange={updateField("sku")} />
        <AdminProductInput label="Brand *" value={form.brand} onChange={updateField("brand")} />
        <AdminProductInput label="UPC" value={form.upc} onChange={updateField("upc")} />
        <AdminProductInput label="GTIN (case)" value={form.gtinCase} onChange={updateField("gtinCase")} />
        <AdminProductInput label="GTIN (inner)" value={form.gtinInner} onChange={updateField("gtinInner")} />
        {!lockSupplierName && <AdminProductInput label="Supplier name" value={form.supplierName} onChange={updateField("supplierName")} />}
        <AdminProductInput label="Product name *" value={form.productName} onChange={updateField("productName")} />
        <AdminProductInput label="Unit size (e.g. 16oz)" value={form.unitSize} onChange={updateField("unitSize")} />
        <AdminProductInput label="Image URL" value={form.imageUrl} onChange={updateField("imageUrl")} />
        <label className="grid gap-1">
          <span className="text-sm font-bold text-slate-700">Category *</span>
          <select className="input" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value, subcategory: "" }))}>
            <option value="">Select category…</option>
            {Object.keys(productCategories).map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-bold text-slate-700">Subcategory</span>
          <select className="input" value={form.subcategory} onChange={updateField("subcategory")} disabled={!form.category}>
            <option value="">{form.category ? "Select subcategory…" : "Choose a category first"}</option>
            {(productCategories[form.category] ?? []).map((subcategory) => (
              <option key={subcategory} value={subcategory}>{subcategory}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 md:col-span-3">
          <span className="text-sm font-bold text-slate-700">Description</span>
          <textarea className="input min-h-20" value={form.description} onChange={updateField("description")} />
        </label>

        <ProductSectionHeading>Each / unit</ProductSectionHeading>
        <DimRow label="Unit dimensions" l={form.unitL} w={form.unitW} h={form.unitH} onL={updateField("unitL")} onW={updateField("unitW")} onH={updateField("unitH")} />
        <WeightInput label="Unit weight" value={form.unitWeight} unit={form.unitWeightUnit} onValue={updateField("unitWeight")} onUnit={updateField("unitWeightUnit")} />

        <ProductSectionHeading>Inner pack (optional)</ProductSectionHeading>
        <label className="flex items-center gap-2 md:col-span-3">
          <input type="checkbox" className="h-4 w-4 accent-atlas-blue" checked={hasInner} onChange={(event) => setHasInner(event.target.checked)} />
          <span className="text-sm font-bold text-slate-700">This product has inner packs</span>
        </label>
        {hasInner && (
          <>
            <AdminProductInput label="Units per inner" type="number" value={form.innerPack} onChange={updateField("innerPack")} />
            <DimRow label="Inner dimensions" l={form.innerL} w={form.innerW} h={form.innerH} onL={updateField("innerL")} onW={updateField("innerW")} onH={updateField("innerH")} />
            <WeightInput label="Inner weight" value={form.innerWeight} unit={form.innerWeightUnit} onValue={updateField("innerWeight")} onUnit={updateField("innerWeightUnit")} />
          </>
        )}

        <ProductSectionHeading>Master case</ProductSectionHeading>
        <AdminProductInput label="Case pack (units)" type="number" value={form.casePack} onChange={updateField("casePack")} />
        <DimRow label="Case dimensions" l={form.caseL} w={form.caseW} h={form.caseH} onL={updateField("caseL")} onW={updateField("caseW")} onH={updateField("caseH")} />
        <WeightInput label="Case weight" value={form.caseWeight} unit={form.caseWeightUnit} onValue={updateField("caseWeight")} onUnit={updateField("caseWeightUnit")} />

        <ProductSectionHeading>Pallet configuration</ProductSectionHeading>
        <AdminProductInput label="Cases per floor (Ti)" type="number" value={form.palletCasesPerFloor} onChange={updateField("palletCasesPerFloor")} />
        <AdminProductInput label="Layers high (Hi)" type="number" value={form.palletLayers} onChange={updateField("palletLayers")} />
        <AdminProductInput label="Standard pallet weight (lb)" type="number" value={form.palletStandardWeight} onChange={updateField("palletStandardWeight")} />
        {totalCases > 0 && (
          <div className="rounded-md bg-sky-50 p-3 text-sm text-atlas-navy md:col-span-3">
            <span className="font-black">{casesPerFloor} per floor × {palletLayers} layers = {totalCases} cases.</span>
            {palletTotalWeight !== undefined && (
              <> Est. pallet weight ≈ <span className="font-black">{Math.round(palletTotalWeight)} lb</span> ({Math.round(palletProductWeight ?? 0)} lb product + {palletStandard} lb pallet).</>
            )}
          </div>
        )}

        <ProductSectionHeading>Fulfillment</ProductSectionHeading>
        <label className="grid gap-1">
          <span className="text-sm font-bold text-slate-700">Shipping warehouse</span>
          <select className="input" value={form.shippingWarehouse} onChange={updateField("shippingWarehouse")}>
            <option value="Orlando hub">Orlando hub</option>
            <option value="Miami hub">Miami hub</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-bold text-slate-700">Pickup or delivered</span>
          <select className="input" value={form.fulfillmentMode} onChange={updateField("fulfillmentMode")}>
            <option value="delivered">Delivered</option>
            <option value="pickup">Pickup</option>
          </select>
        </label>
        {form.fulfillmentMode === "pickup" && (
          <>
            <AdminProductInput label="Pickup phone" value={form.pickupPhone} onChange={updateField("pickupPhone")} />
            <label className="grid gap-1 md:col-span-3">
              <span className="text-sm font-bold text-slate-700">Pickup address (full)</span>
              <input className="input" value={form.pickupAddress} onChange={updateField("pickupAddress")} />
            </label>
          </>
        )}

        <ProductSectionHeading>Pricing</ProductSectionHeading>
        <AdminProductInput label={showAtlasEconomics ? "Case cost to Atlas (for margin)" : "Your case price to Atlas"} type="number" value={form.supplierCost} onChange={updateField("supplierCost")} />
        <AdminProductInput label="Suggested retail per UNIT ($)" type="number" value={form.suggestedRetail} onChange={updateField("suggestedRetail")} />
        <div className="hidden md:block" />
        {showAtlasEconomics ? (
          <div className="md:col-span-3">
            <ChannelPricingPanel
              caseCost={toNum(form.supplierCost) ?? 0}
              casePack={toNum(form.casePack) ?? 1}
              srpPerUnit={toNum(form.suggestedRetail) ?? 0}
              retailerOverride={form.priceRetailer}
              distributorOverride={form.priceDistributor}
              repCommissionOverride={form.repCommissionPct}
              onRetailer={(v) => setForm((c) => ({ ...c, priceRetailer: v }))}
              onDistributor={(v) => setForm((c) => ({ ...c, priceDistributor: v }))}
              onRepCommission={(v) => setForm((c) => ({ ...c, repCommissionPct: v }))}
              onReset={() => setForm((c) => ({ ...c, priceRetailer: "", priceDistributor: "", repCommissionPct: "" }))}
            />
          </div>
        ) : (
          <p className="text-xs text-slate-500 md:col-span-3">Atlas sets the buyer price and owns the invoice. Enter your case price and an optional suggested retail; Atlas handles the rest.</p>
        )}

        <ProductSectionHeading>Stock &amp; order minimum</ProductSectionHeading>
        <AdminProductInput label="Min order (cases)" type="number" value={form.moq} onChange={updateField("moq")} />
        <AdminProductInput label="Min order value ($, optional)" type="number" value={form.minOrderValue} onChange={updateField("minOrderValue")} />
        <AdminProductInput label="Inventory available" type="number" value={form.inventoryAvailable} onChange={updateField("inventoryAvailable")} />
        <AdminProductInput label="Lead time" value={form.leadTime} onChange={updateField("leadTime")} />
        <AdminProductInput label="Promotion label" value={form.promotion} onChange={updateField("promotion")} />
      </div>
      {message && <p className="mt-4 rounded-md bg-sky-50 p-3 text-sm font-bold text-atlas-blue">{message}</p>}
    </section>
  );
}

function PriceRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={strong ? "font-black text-atlas-navy" : "font-semibold text-atlas-navy"}>{value}</span>
    </div>
  );
}

function ChannelPricingPanel({
  caseCost,
  casePack,
  srpPerUnit,
  retailerOverride,
  distributorOverride,
  repCommissionOverride,
  onRetailer,
  onDistributor,
  onRepCommission,
  onReset
}: {
  caseCost: number;
  casePack: number;
  srpPerUnit: number;
  retailerOverride: string;
  distributorOverride: string;
  repCommissionOverride: string;
  onRetailer: (v: string) => void;
  onDistributor: (v: string) => void;
  onRepCommission: (v: string) => void;
  onReset: () => void;
}) {
  const mode = determinePricingMode(srpPerUnit);
  const overrides = {
    retailerCasePrice: retailerOverride.trim() !== "" ? Number(retailerOverride) || 0 : undefined,
    distributorCasePrice: distributorOverride.trim() !== "" ? Number(distributorOverride) || 0 : undefined,
    salesRepCommissionPct: repCommissionOverride.trim() !== "" ? (Number(repCommissionOverride) || 0) / 100 : undefined
  };
  const p = computeChannelPricing({ caseCost, casePack, srpPerUnit, overrides });
  const hasOverride = [retailerOverride, distributorOverride, repCommissionOverride].some((v) => v.trim() !== "");
  const cur = formatMoney;
  const pct = formatPercent;

  return (
    <div className="grid gap-3">
      {/* Card 1 — Pricing mode summary */}
      <div className="rounded-md border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={`badge ${mode === "srp" ? "bg-sky-50 text-atlas-blue" : "bg-amber-50 text-amber-800"}`}>
            Pricing mode: {mode === "srp" ? "SRP-based" : "Cost-based"}
          </span>
          {hasOverride && (
            <button type="button" className="text-xs font-bold text-atlas-blue hover:underline" onClick={onReset}>
              Reset to suggested pricing
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {mode === "srp"
            ? "Using SRP to calculate channel prices and preserve standard buyer margins."
            : "SRP not entered. Prices are calculated from Atlas cost using Atlas target margins."}
        </p>
        <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
          <PriceRow label="Case cost to Atlas" value={cur(p.caseCost)} />
          <PriceRow label="Case pack units" value={`${p.casePack}`} />
          <PriceRow label="Atlas unit cost" value={cur(p.atlasUnitCost)} />
          <PriceRow label="Suggested retail per unit" value={p.srpPerUnit > 0 ? cur(p.srpPerUnit) : "—"} />
          <PriceRow label="Retail value per case" value={p.retailValuePerCase > 0 ? cur(p.retailValuePerCase) : "—"} />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* Card 2 — Retailer channel */}
        <div className="rounded-md border border-slate-200 bg-white p-3">
          <h4 className="text-sm font-black uppercase tracking-wide text-atlas-blue">Retailer channel</h4>
          <p className="text-[11px] text-slate-400">Price retailers pay Atlas.</p>
          <div className="mt-2 grid gap-1.5">
            {mode === "srp" ? (
              <PriceRow label="Retailer margin at SRP" value={pct(p.retailer.marginAtSRP)} />
            ) : (
              <PriceRow label="Atlas target margin on retailer sale" value={pct(p.retailer.atlasTargetMargin)} />
            )}
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-500">Retailer case price</span>
              <span className="flex items-center rounded-md border border-slate-300 bg-white">
                <span className="pl-2 text-xs text-slate-400">$</span>
                <input className="w-24 border-0 bg-transparent px-1 py-1 text-right text-sm font-black text-atlas-navy focus:outline-none" type="number" step="0.01" placeholder={cur(p.retailer.casePrice).replace("$", "")} value={retailerOverride} onChange={(e) => onRetailer(e.target.value)} />
              </span>
            </label>
            <PriceRow label="Retailer unit cost" value={cur(p.retailer.unitCost)} />
            <PriceRow label="Atlas profit per case" value={cur(p.retailer.atlasProfit)} />
            <PriceRow label="Atlas gross margin" value={pct(p.retailer.atlasMargin)} strong />
          </div>
        </div>

        {/* Card 3 — Distributor channel */}
        <div className="rounded-md border border-slate-200 bg-white p-3">
          <h4 className="text-sm font-black uppercase tracking-wide text-atlas-blue">Distributor channel</h4>
          <p className="text-[11px] text-slate-400">Price distributors pay Atlas. They resell to retailers.</p>
          <div className="mt-2 grid gap-1.5">
            {mode === "srp" ? (
              <>
                <PriceRow label="Suggested distributor resale to retailer" value={cur(p.distributor.resaleToRetailer)} />
                <PriceRow label="Distributor margin on resale" value={pct(p.distributor.marginOnResale)} />
              </>
            ) : (
              <PriceRow label="Atlas target margin on distributor sale" value={pct(p.distributor.atlasTargetMargin)} />
            )}
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-500">Distributor case price</span>
              <span className="flex items-center rounded-md border border-slate-300 bg-white">
                <span className="pl-2 text-xs text-slate-400">$</span>
                <input className="w-24 border-0 bg-transparent px-1 py-1 text-right text-sm font-black text-atlas-navy focus:outline-none" type="number" step="0.01" placeholder={cur(p.distributor.casePrice).replace("$", "")} value={distributorOverride} onChange={(e) => onDistributor(e.target.value)} />
              </span>
            </label>
            <PriceRow label="Distributor unit cost" value={cur(p.distributor.unitCost)} />
            <PriceRow label="Atlas profit per case" value={cur(p.distributor.atlasProfit)} />
            <PriceRow label="Atlas gross margin" value={pct(p.distributor.atlasMargin)} strong />
          </div>
        </div>
      </div>

      {/* Card 4 — Sales rep commission */}
      <div className="rounded-md border border-slate-200 bg-white p-3">
        <h4 className="text-sm font-black uppercase tracking-wide text-atlas-blue">Sales rep commission</h4>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-500">Sales rep commission %</span>
            <span className="flex items-center rounded-md border border-slate-300 bg-white">
              <input className="w-16 border-0 bg-transparent px-1 py-1 text-right text-sm font-black text-atlas-navy focus:outline-none" type="number" step="0.5" placeholder={`${(p.rep.commissionPct * 100).toFixed(1)}`} value={repCommissionOverride} onChange={(e) => onRepCommission(e.target.value)} />
              <span className="pr-2 text-xs text-slate-400">%</span>
            </span>
          </label>
          <PriceRow label="Commission base (retailer case price)" value={cur(p.rep.commissionBase)} />
          <PriceRow label="Commission per case" value={cur(p.rep.commissionPerCase)} />
          <PriceRow label="Atlas net after commission" value={cur(p.rep.atlasNetAfterCommission)} />
          <PriceRow label="Atlas profit after commission" value={cur(p.rep.atlasProfitAfterCommission)} />
          <PriceRow label="Atlas margin after commission" value={pct(p.rep.atlasMarginAfterCommission)} strong />
        </div>
        <p className="mt-2 rounded bg-atlas-light p-2 text-[11px] text-slate-600">
          Sales reps do not buy inventory. They earn commission on collected sales.
        </p>
      </div>

      {/* Card 5 — Atlas margin summary */}
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-atlas-light text-[10px] uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Channel</th>
              <th className="px-3 py-2">Buyer / sale price</th>
              <th className="px-3 py-2">Atlas profit / case</th>
              <th className="px-3 py-2">Atlas margin</th>
              <th className="px-3 py-2">Buyer margin / opportunity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-atlas-navy">
            <tr>
              <td className="px-3 py-2">Retailer sale</td>
              <td className="px-3 py-2">{cur(p.retailer.casePrice)}</td>
              <td className="px-3 py-2">{cur(p.retailer.atlasProfit)}</td>
              <td className="px-3 py-2">{pct(p.retailer.atlasMargin)}</td>
              <td className="px-3 py-2 text-slate-500">{mode === "srp" ? `${pct(p.retailer.marginAtSRP)} at SRP` : "—"}</td>
            </tr>
            <tr>
              <td className="px-3 py-2">Distributor sale</td>
              <td className="px-3 py-2">{cur(p.distributor.casePrice)}</td>
              <td className="px-3 py-2">{cur(p.distributor.atlasProfit)}</td>
              <td className="px-3 py-2">{pct(p.distributor.atlasMargin)}</td>
              <td className="px-3 py-2 text-slate-500">{mode === "srp" ? `${pct(p.distributor.marginOnResale)} on resale` : "—"}</td>
            </tr>
            <tr>
              <td className="px-3 py-2">Sales rep sale</td>
              <td className="px-3 py-2">{cur(p.retailer.casePrice)}</td>
              <td className="px-3 py-2">{cur(p.rep.atlasProfitAfterCommission)}</td>
              <td className="px-3 py-2">{pct(p.rep.atlasMarginAfterCommission)}</td>
              <td className="px-3 py-2 text-slate-500">{pct(p.rep.commissionPct)} commission</td>
            </tr>
          </tbody>
        </table>
      </div>

      {p.warnings.length > 0 && (
        <div className="grid gap-1 rounded-md border border-amber-200 bg-amber-50 p-3">
          {p.warnings.map((w) => (
            <p key={w} className="text-xs font-semibold text-amber-900">{w}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductSectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-2 border-b border-slate-200 pb-1 text-sm font-black uppercase tracking-wide text-atlas-blue md:col-span-3">
      {children}
    </h3>
  );
}

function DimRow({
  label,
  l,
  w,
  h,
  onL,
  onW,
  onH
}: {
  label: string;
  l: string;
  w: string;
  h: string;
  onL: (event: ChangeEvent<HTMLInputElement>) => void;
  onW: (event: ChangeEvent<HTMLInputElement>) => void;
  onH: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="md:col-span-2">
      <span className="text-sm font-bold text-slate-700">{label} (in)</span>
      <div className="mt-1 grid grid-cols-3 gap-2">
        <input className="input" type="number" placeholder="L" value={l} onChange={onL} />
        <input className="input" type="number" placeholder="W" value={w} onChange={onW} />
        <input className="input" type="number" placeholder="H" value={h} onChange={onH} />
      </div>
    </div>
  );
}

function WeightInput({
  label,
  value,
  unit,
  onValue,
  onUnit
}: {
  label: string;
  value: string;
  unit: string;
  onValue: (event: ChangeEvent<HTMLInputElement>) => void;
  onUnit: (event: ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <div className="grid grid-cols-[1fr_5rem] gap-2">
        <input className="input" type="number" value={value} onChange={onValue} />
        <select className="input" value={unit} onChange={onUnit}>
          <option value="lb">lb</option>
          <option value="oz">oz</option>
        </select>
      </div>
    </label>
  );
}

function AdminProductInput({
  label,
  onChange,
  type = "text",
  value
}: {
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input className="input" type={type} value={value} onChange={onChange} />
    </label>
  );
}

function QuoteWorkflowOverview({
  orders,
  pricingSettings,
  quoteAdjustments
}: {
  orders: OrderRequest[];
  pricingSettings: PricingSettings;
  quoteAdjustments: QuoteAdjustment[];
}) {
  return (
    <div className="grid gap-5 p-5">
      <div className="grid gap-3 lg:grid-cols-4">
        <AdminFlowStep
          title="1. Buyer submits cart"
          body="The cart becomes a purchase order request. Quantities, products, buyer region, and requested fulfillment are captured."
        />
        <AdminFlowStep
          title="2. System suggests pricing"
          body="Loose cases, full pallets, supplier-direct fees, hub handling, delivery, and freight estimates are calculated first."
        />
        <AdminFlowStep
          title="3. Admin edits quote"
          body="Change per-case prices, waive delivery, add discounts, add free product notes, or adjust fulfillment fees for that one quote."
        />
        <AdminFlowStep
          title="4. Buyer confirms"
          body="Accepted quotes become the sales order/invoice. Atlas owns the buyer relationship and fulfillment coordination."
        />
      </div>
      <div className="rounded-lg border border-slate-200 bg-atlas-light p-4">
        <h3 className="text-lg font-black text-atlas-navy">How to process each order</h3>
        <div className="mt-4 grid gap-3">
          {orders.map((order) => {
            const adjustment = quoteAdjustments.find((item) => item.orderId === order.id);
            const financials = calculateQuoteFinancials(order, pricingSettings, adjustment);
            const effectiveFulfillment = adjustment?.fulfillmentType ?? order.fulfillmentType;
            const hasSupplierDirect = (order.lineItems ?? []).some((line) => line.product.preferredHub === "Supplier direct");
            const isSimplePickup = effectiveFulfillment === "Pickup" && !hasSupplierDirect;

            return (
              <div key={`${order.id}-workflow`} className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 lg:grid-cols-[180px_1fr_1fr_150px] lg:items-center">
                <div>
                  <Link className="font-black text-atlas-blue underline" href={`/quotes/${order.id}`}>
                    {order.id}
                  </Link>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{order.buyer}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">Recommended action</p>
                  <p className="font-black text-atlas-navy">
                    {isSimplePickup ? "Confirm hub pickup pricing" : "Build quote before sending"}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {isSimplePickup
                      ? "Shelf pricing is already calculated; verify inventory and pickup hub."
                      : "Review line prices, route, availability, and any delivery or freight charge."}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">Route and pricing basis</p>
                  <p className="font-semibold text-slate-700">{effectiveFulfillment}</p>
                  <p className="mt-1 text-xs text-slate-600">{adjustment?.hubRouting ?? order.hubRouting ?? financials.recommendedHubRouting}</p>
                </div>
                <div className="lg:text-right">
                  <p className="text-xs font-bold uppercase text-slate-500">Quote total</p>
                  <p className="text-lg font-black text-atlas-navy">{formatMoney(financials.buyerTotal)}</p>
                  <p className={`text-xs font-bold ${financials.estimatedProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                    Profit {formatMoney(financials.estimatedProfit)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function QuoteStatusCard({ label, value, body, tone = "blue" }: { label: string; value: string | number; body: string; tone?: "blue" | "green" | "amber" }) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-50 text-emerald-800"
      : tone === "amber"
      ? "bg-amber-50 text-amber-800"
      : "bg-sky-50 text-atlas-blue";

  return (
    <div className={`rounded-md p-3 ${toneClass}`}>
      <p className="text-xs font-bold uppercase">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs font-semibold">{body}</p>
    </div>
  );
}

function AdminFlowStep({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="font-black text-atlas-navy">{title}</p>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
    </div>
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
    caseMarginPercent: adjustment?.caseMarginPercent ?? pricingSettings.caseMarginPercent,
    palletMarginPercent: adjustment?.palletMarginPercent ?? pricingSettings.palletMarginPercent,
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
      <PalletPlanPanel order={order} lines={order.lineItems ?? []} maxPalletWeightLb={pricingSettings.maxPalletWeightLb} />
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
          <NumberField label="Loose case margin %" value={adjustment?.caseMarginPercent ?? pricingSettings.caseMarginPercent} onChange={updateNumber("caseMarginPercent")} />
          <NumberField label="Full pallet margin %" value={adjustment?.palletMarginPercent ?? pricingSettings.palletMarginPercent} onChange={updateNumber("palletMarginPercent")} />
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

function FulfillmentOperationsPanel({
  orders,
  pricingSettings,
  quoteAdjustments
}: {
  orders: OrderRequest[];
  pricingSettings: PricingSettings;
  quoteAdjustments: QuoteAdjustment[];
}) {
  const models = [
    {
      title: "Supplier direct",
      body: "Supplier ships to the buyer after Atlas confirms quote, customer terms, and supplier instructions.",
      money: `${pricingSettings.supplierDirectFeePercent}% or ${formatMoney(pricingSettings.supplierDirectMinimumFee)} minimum`
    },
    {
      title: "Atlas consolidation",
      body: "Supplier product moves to Atlas, then Atlas combines lines into one order, one pallet, and one invoice.",
      money: `Miami ${formatMoney(pricingSettings.miamiHubHandlingPerCase)} / case, Orlando ${formatMoney(pricingSettings.orlandoHubHandlingPerCase)} / case`
    },
    {
      title: "Cross dock",
      body: "Product arrives already sold, is staged briefly, then released to pickup, delivery, or freight.",
      money: "Use hub handling plus quote-specific labor if needed"
    },
    {
      title: "Mixed pallet",
      body: "Different suppliers and categories are combined into a single buyer order when case/value minimums are met.",
      money: `${pricingSettings.minimumMixedOrderCases} cases or ${formatMoney(pricingSettings.minimumOrderValue)} minimum`
    },
    {
      title: "Pickup",
      body: "Buyer picks up at Miami or Orlando. Pricing should feel like shelf pricing once product is approved.",
      money: `${formatMoney(pricingSettings.pickupFee)} pickup fee`
    },
    {
      title: "Delivery / freight",
      body: "Admin reviews distance, case count, pallet count, and quote size before charging delivery or freight.",
      money: `${formatMoney(pricingSettings.localDeliveryFee)} local, ${formatMoney(pricingSettings.freightCoordinationFee)} freight coordination`
    }
  ];

  return (
    <section className="grid gap-6">
      <div className="panel p-5">
        <div className="flex items-center gap-2">
          <PackageCheck className="text-atlas-blue" />
          <h2 className="text-xl font-black text-atlas-navy">Fulfillment operations</h2>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Use this view to decide how an order moves: supplier-direct, Atlas consolidated hub, cross dock, mixed pallet, pickup, delivery, or freight.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {models.map((model) => (
          <div key={model.title} className="panel p-5">
            <h3 className="text-lg font-black text-atlas-navy">{model.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{model.body}</p>
            <p className="mt-4 rounded-md bg-atlas-light p-3 text-sm font-black text-atlas-blue">{model.money}</p>
          </div>
        ))}
      </div>
      <div className="panel overflow-hidden">
        <div className="border-b border-slate-200 p-5">
          <h3 className="text-lg font-black text-atlas-navy">Order routing queue</h3>
          <p className="mt-1 text-sm text-slate-600">Each buyer order should have a clear route before the final quote is sent.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-atlas-light text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Buyer</th>
                <th className="px-4 py-3">Cases</th>
                <th className="px-4 py-3">Recommended route</th>
                <th className="px-4 py-3">Hub / movement</th>
                <th className="px-4 py-3">Admin action</th>
                <th className="px-4 py-3">Profit check</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {orders.map((order) => {
                const adjustment = quoteAdjustments.find((item) => item.orderId === order.id);
                const financials = calculateQuoteFinancials(order, pricingSettings, adjustment);
                const supplierDirect = (order.lineItems ?? []).some((line) => line.product.preferredHub === "Supplier direct");
                const fullFreight = order.totalCases >= pricingSettings.freightCaseThreshold;
                const action = supplierDirect
                  ? "Confirm supplier ship terms"
                  : fullFreight
                    ? "Request freight quote"
                    : order.fulfillmentType === "Pickup"
                      ? "Verify hub stock"
                      : "Build admin quote";

                return (
                  <tr key={`${order.id}-fulfillment`}>
                    <td className="px-4 py-3 font-black text-atlas-blue">{order.id}</td>
                    <td className="px-4 py-3">{order.buyer}</td>
                    <td className="px-4 py-3">{order.totalCases}</td>
                    <td className="px-4 py-3">{financials.recommendedFulfillmentType}</td>
                    <td className="px-4 py-3">{adjustment?.hubRouting ?? order.hubRouting ?? financials.recommendedHubRouting}</td>
                    <td className="px-4 py-3 font-bold text-atlas-navy">{action}</td>
                    <td className={`px-4 py-3 font-black ${financials.estimatedProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                      {formatMoney(financials.estimatedProfit)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function MarketingPanel({
  settings,
  updatePricingSettings,
  products,
  applications,
  updateProductPromotion,
  updateProductPlacements,
  promotionSubmissions,
  updatePromotionSubmissionStatus
}: {
  settings: PricingSettings;
  updatePricingSettings: ReturnType<typeof useAtlasStore>["updatePricingSettings"];
  products: Product[];
  applications: Application[];
  updateProductPromotion: ReturnType<typeof useAtlasStore>["updateProductPromotion"];
  updateProductPlacements: ReturnType<typeof useAtlasStore>["updateProductPlacements"];
  promotionSubmissions: PromotionSubmission[];
  updatePromotionSubmissionStatus: ReturnType<typeof useAtlasStore>["updatePromotionSubmissionStatus"];
}) {
  function updateNumber(key: keyof PricingSettings) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      updatePricingSettings({
        ...settings,
        [key]: Number(event.target.value)
      });
    };
  }

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
  const placementMap = [
    ["Homepage", "Supplier launch spotlight and weekly deal preview", "Public awareness"],
    ["Catalog top", "Weekly Deals strip with quick add", "Buyer conversion"],
    ["Catalog cards", "Promotion badges on individual products", "Product visibility"],
    ["Category pages", "Sponsored category placement", "Category ownership"],
    ["Retailer dashboard", "Saved-list and buy-again promotions", "Reorders"],
    ["Email / WhatsApp / flyer", "Campaign placements tracked by source and city", "Off-site demand"]
  ];
  const promotionRates: Array<[keyof PricingSettings, string, string]> = [
    ["featuredProductRate", "Featured product placement", "Homepage, category pages, and search result emphasis"],
    ["weeklyDealsRate", "Weekly Deals placement", "Atlas Weekly Deals on site, email, and WhatsApp"],
    ["monthlyCircularRate", "Monthly circular placement", "Digital wholesale flyer placement"],
    ["newsletterSponsorshipRate", "Newsletter sponsorship", "Paid sponsor section in retailer emails"],
    ["whatsappPromotionRate", "WhatsApp promotion", "Supplier-funded broadcast promotion"],
    ["sponsoredCategoryRate", "Sponsored category", "Category sponsorship such as beverage, snack, or cleaning"],
    ["newProductLaunchRate", "New product launch program", "Homepage, weekly deals, newsletter, and launch section"],
    ["closeoutListingRate", "Closeout listing", "Overstock, short-dated, packaging change, and liquidation listings"],
    ["supplierMembershipRate", "Supplier membership / month", "Optional monthly program for higher supplier visibility"]
  ];

  return (
    <section className="grid gap-6">
      <div className="panel p-5">
        <div className="flex items-center gap-2">
          <Megaphone className="text-atlas-blue" />
          <h2 className="text-xl font-black text-atlas-navy">Discounts, promotions, and marketing</h2>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Track demand and control supplier-funded promotion pricing. These rates should be editable by Atlas, not hardcoded.
        </p>
      </div>
      <SupplierAdRequests submissions={promotionSubmissions} updateStatus={updatePromotionSubmissionStatus} />
      <PlacementBookingsPanel settings={settings} updatePricingSettings={updatePricingSettings} products={products} updateProductPlacements={updateProductPlacements} />
      <SupplierFulfillmentPanel applications={applications} settings={settings} updatePricingSettings={updatePricingSettings} />
      <PromoteProductsPanel products={products} updateProductPromotion={updateProductPromotion} updateProductPlacements={updateProductPlacements} />
      <div className="panel p-5">
        <h3 className="text-lg font-black text-atlas-navy">Where promotions show up</h3>
        <p className="mt-1 text-sm text-slate-600">
          Use this as the simple placement menu when selling supplier ads. Atlas approves the placement before buyers see it.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {placementMap.map(([place, placement, goal]) => (
            <div key={place} className="rounded-md border border-slate-200 bg-atlas-light p-4">
              <p className="text-sm font-black uppercase text-atlas-blue">{place}</p>
              <h4 className="mt-2 font-black text-atlas-navy">{placement}</h4>
              <p className="mt-1 text-sm text-slate-600">{goal}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="panel p-5">
        <h3 className="text-lg font-black text-atlas-navy">Supplier promotion pricing</h3>
        <p className="mt-1 text-sm text-slate-600">These default prices create Atlas revenue outside product margin and fulfillment fees.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {promotionRates.map(([key, label, help]) => (
            <label key={key} className="grid gap-2">
              <span className="label">{label}</span>
              <input className="field" min="0" step="1" type="number" value={settings[key] as number} onChange={updateNumber(key)} />
              <span className="text-xs text-slate-500">{help}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <MarketingTable icon={<BarChart3 />} title="Traffic sources" rows={sources} columns={["Source", "Share", "Signal"]} />
        <MarketingTable icon={<BarChart3 />} title="Geography" rows={cities} columns={["City / state", "Share", "Demand"]} />
        <MarketingTable icon={<Megaphone />} title="Campaign tracking" rows={campaigns} columns={["Campaign", "Status", "Goal"]} />
        <div className="panel p-5">
          <h3 className="text-lg font-black text-atlas-navy">Promotion workflow</h3>
          <ul className="mt-3 grid gap-2 text-sm text-slate-700">
            <li>Supplier submits promotion request from supplier dashboard.</li>
            <li>Admin selects placement and rate from the pricing table above.</li>
            <li>Atlas schedules placement across website, email, WhatsApp, flyer, or category page.</li>
            <li>Traffic is tracked by campaign, city/state, source, and product lane.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function SupplierAdRequests({
  submissions,
  updateStatus
}: {
  submissions: PromotionSubmission[];
  updateStatus: ReturnType<typeof useAtlasStore>["updatePromotionSubmissionStatus"];
}) {
  const pending = submissions.filter((item) => item.status === "pending").length;
  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-atlas-navy">Supplier ad requests</h3>
          <p className="mt-1 text-sm text-slate-600">Suppliers book a placement; approve to schedule it across the catalog and email.</p>
        </div>
        <span className="badge bg-amber-50 text-amber-800">{pending} pending</span>
      </div>
      {submissions.length === 0 ? (
        <p className="mt-4 rounded-md bg-atlas-light p-4 text-sm text-slate-600">No promotion requests yet. They appear here when a supplier books a placement from their dashboard.</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {submissions.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
              <div className="min-w-0">
                <p className="font-black text-atlas-navy">{item.supplierName}</p>
                <p className="text-sm text-slate-600">
                  {item.placement}
                  {item.productName ? ` • ${item.productName}` : ""}
                </p>
                {item.note && <p className="mt-1 text-xs text-slate-500">{item.note}</p>}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={item.status} />
                {item.status === "pending" && (
                  <>
                    <button className="btn-secondary px-3" type="button" onClick={() => updateStatus(item.id, "approved")} aria-label="Approve request">
                      <Check size={16} />
                    </button>
                    <button className="btn-danger px-3" type="button" onClick={() => updateStatus(item.id, "rejected")} aria-label="Reject request">
                      <X size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BookingStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-atlas-light p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black text-atlas-navy">{value}</p>
    </div>
  );
}

function bookingStatus(b: PlacementBooking, today: string): "active" | "upcoming" | "ended" {
  if (today < b.startDate) return "upcoming";
  if (today > b.endDate) return "ended";
  return "active";
}

function PlacementBookingsPanel({
  settings,
  updatePricingSettings,
  products,
  updateProductPlacements
}: {
  settings: PricingSettings;
  updatePricingSettings: ReturnType<typeof useAtlasStore>["updatePricingSettings"];
  products: Product[];
  updateProductPlacements: ReturnType<typeof useAtlasStore>["updateProductPlacements"];
}) {
  const bookings = settings.placementBookings ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const approvedProducts = products.filter((p) => p.status === "approved");
  const blank = { supplierName: "", productId: "", slot: adPlacements[0].id, rate: "", startDate: today, endDate: "" };
  const [form, setForm] = useState(blank);

  const slotDef = adPlacements.find((p) => p.id === form.slot) ?? adPlacements[0];
  const defaultRate = Number(settings[slotDef.rateKey]) || 0;

  function setField(field: keyof typeof blank, value: string) {
    setForm((c) => ({ ...c, [field]: value }));
  }
  function persist(next: PlacementBooking[]) {
    updatePricingSettings({ ...settings, placementBookings: next });
  }
  function addBooking() {
    if (!form.supplierName.trim() || !form.endDate) return;
    const product = approvedProducts.find((p) => p.id === form.productId);
    const booking: PlacementBooking = {
      id: `pb-${Date.now().toString(36)}`,
      supplierName: form.supplierName.trim(),
      productId: product?.id,
      productName: product?.brand,
      slot: slotDef.id,
      slotName: slotDef.name,
      rate: Number(form.rate) || defaultRate,
      startDate: form.startDate,
      endDate: form.endDate,
      paymentStatus: "unpaid",
      createdAt: today
    };
    persist([booking, ...bookings]);
    // Light link: turn on the matching product placement so the slot actually shows.
    if (product) {
      if (slotDef.id === "featured") updateProductPlacements(product.id, { ...product.placements, homepageFeatured: true });
      if (slotDef.id === "weekly") updateProductPlacements(product.id, { ...product.placements, weeklyDeal: true });
    }
    setForm({ ...blank, slot: form.slot });
  }
  function cyclePayment(id: string) {
    const order: PlacementBooking["paymentStatus"][] = ["unpaid", "invoiced", "paid"];
    persist(bookings.map((b) => (b.id === id ? { ...b, paymentStatus: order[(order.indexOf(b.paymentStatus) + 1) % 3] } : b)));
  }
  function remove(id: string) {
    persist(bookings.filter((b) => b.id !== id));
  }

  const activeBookings = bookings.filter((b) => bookingStatus(b, today) === "active");
  const booked = bookings.reduce((s, b) => s + b.rate, 0);
  const paid = bookings.filter((b) => b.paymentStatus === "paid").reduce((s, b) => s + b.rate, 0);
  const activeRevenue = activeBookings.reduce((s, b) => s + b.rate, 0);

  const statusTone: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700",
    upcoming: "bg-sky-50 text-atlas-blue",
    ended: "bg-slate-100 text-slate-500"
  };
  const payTone: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-700",
    invoiced: "bg-amber-50 text-amber-800",
    unpaid: "bg-red-50 text-atlas-red"
  };

  return (
    <div className="panel p-5">
      <h3 className="text-lg font-black text-atlas-navy">Placement bookings &amp; ad revenue</h3>
      <p className="mt-1 max-w-3xl text-sm text-slate-600">
        Schedule and track sold placements — which product, which slot, dates, and payment. Booking a Featured or Weekly Deal slot for a
        product also turns its catalog placement on.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <BookingStat label="Active now" value={`${activeBookings.length} · ${formatMoney(activeRevenue)}`} />
        <BookingStat label="Booked total" value={formatMoney(booked)} />
        <BookingStat label="Paid" value={formatMoney(paid)} />
        <BookingStat label="Outstanding" value={formatMoney(booked - paid)} />
      </div>

      {/* Add a booking */}
      <div className="mt-4 grid gap-3 rounded-md border border-slate-200 bg-atlas-light p-3 md:grid-cols-3 lg:grid-cols-6">
        <label className="grid gap-1">
          <span className="text-xs font-bold text-slate-600">Supplier</span>
          <input className="field h-9 min-h-9" value={form.supplierName} onChange={(e) => setField("supplierName", e.target.value)} placeholder="Brand / supplier" />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-bold text-slate-600">Product (optional)</span>
          <select className="field h-9 min-h-9" value={form.productId} onChange={(e) => setField("productId", e.target.value)}>
            <option value="">—</option>
            {approvedProducts.map((p) => (
              <option key={p.id} value={p.id}>{p.brand}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-bold text-slate-600">Slot</span>
          <select className="field h-9 min-h-9" value={form.slot} onChange={(e) => setField("slot", e.target.value)}>
            {adPlacements.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-bold text-slate-600">Rate ($)</span>
          <input className="field h-9 min-h-9" type="number" value={form.rate} onChange={(e) => setField("rate", e.target.value)} placeholder={String(defaultRate)} />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-bold text-slate-600">Start</span>
          <input className="field h-9 min-h-9" type="date" value={form.startDate} onChange={(e) => setField("startDate", e.target.value)} />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-bold text-slate-600">End</span>
          <input className="field h-9 min-h-9" type="date" value={form.endDate} onChange={(e) => setField("endDate", e.target.value)} />
        </label>
        <div className="md:col-span-3 lg:col-span-6">
          <button className="btn-primary" type="button" onClick={addBooking}>Book placement</button>
        </div>
      </div>

      {/* Bookings list */}
      {bookings.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No placements booked yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="px-2 py-2">Slot</th>
                <th className="px-2 py-2">Supplier / product</th>
                <th className="px-2 py-2">Dates</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Rate</th>
                <th className="px-2 py-2">Payment</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const status = bookingStatus(b, today);
                return (
                  <tr key={b.id} className="border-t border-slate-100">
                    <td className="px-2 py-2 font-bold text-atlas-navy">{b.slotName}</td>
                    <td className="px-2 py-2 text-slate-600">{b.supplierName}{b.productName ? ` · ${b.productName}` : ""}</td>
                    <td className="px-2 py-2 text-slate-600">{b.startDate} → {b.endDate}</td>
                    <td className="px-2 py-2"><span className={`badge ${statusTone[status]}`}>{status}</span></td>
                    <td className="px-2 py-2 font-bold text-atlas-navy">{formatMoney(b.rate)}</td>
                    <td className="px-2 py-2">
                      <button type="button" className={`badge ${payTone[b.paymentStatus]}`} onClick={() => cyclePayment(b.id)} title="Click to change">
                        {b.paymentStatus}
                      </button>
                    </td>
                    <td className="px-2 py-2">
                      <button className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-atlas-red" type="button" onClick={() => remove(b.id)} aria-label="Remove booking">
                        <X size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SupplierFulfillmentPanel({
  applications,
  settings,
  updatePricingSettings
}: {
  applications: Application[];
  settings: PricingSettings;
  updatePricingSettings: ReturnType<typeof useAtlasStore>["updatePricingSettings"];
}) {
  const suppliers = applications.filter((a) => a.type === "supplier" && a.status === "approved");
  const [draft, setDraft] = useState<SupplierAssignment[]>(settings.supplierAssignments ?? []);
  const [saved, setSaved] = useState(false);

  function setAssign(id: string, fulfillmentTier: string) {
    setDraft((cur) => {
      const ex = cur.find((e) => e.supplierId === id);
      if (ex) return cur.map((e) => (e.supplierId === id ? { ...e, fulfillmentTier } : e));
      return [...cur, { supplierId: id, fulfillmentTier }];
    });
  }
  function save() {
    updatePricingSettings({ ...settings, supplierAssignments: draft });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="panel p-5">
      <h3 className="text-lg font-black text-atlas-navy">Supplier fulfillment</h3>
      <p className="mt-1 max-w-3xl text-sm text-slate-600">
        Set how Atlas moves each supplier&apos;s goods. Listing is free — Atlas earns from product margin and supplier-funded
        promotions below, not subscriptions.
      </p>
      {suppliers.length === 0 ? (
        <p className="mt-4 rounded-md bg-atlas-light p-4 text-sm text-slate-600">No approved suppliers yet.</p>
      ) : (
        <div className="mt-4 grid gap-2">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
              <span className="font-bold text-atlas-navy">{supplier.companyName}</span>
              <select
                className="field h-9 min-h-9 w-60"
                value={draft.find((e) => e.supplierId === supplier.id)?.fulfillmentTier ?? defaultFulfillmentTierId}
                onChange={(event) => setAssign(supplier.id, event.target.value)}
              >
                {fulfillmentTiers.map((tier) => (
                  <option key={tier.id} value={tier.id}>{tier.name}</option>
                ))}
              </select>
            </div>
          ))}
          <div className="mt-2 flex items-center gap-3">
            <button className="btn-primary" type="button" onClick={save}>Save fulfillment</button>
            {saved && <span className="text-sm font-bold text-emerald-700">Saved.</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function PromoteProductsPanel({
  products,
  updateProductPromotion,
  updateProductPlacements
}: {
  products: Product[];
  updateProductPromotion: ReturnType<typeof useAtlasStore>["updateProductPromotion"];
  updateProductPlacements: ReturnType<typeof useAtlasStore>["updateProductPlacements"];
}) {
  const approved = products.filter((product) => product.status === "approved");
  const featuredCount = approved.filter((product) => product.placements?.homepageFeatured).length;
  const weeklyCount = approved.filter((product) => product.placements?.weeklyDeal).length;
  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-atlas-navy">Promote products</h3>
          <p className="mt-1 text-sm text-slate-600">
            Two separate paid placements. <span className="font-bold">Homepage featured</span> = the premium slot on the homepage ordering
            portal. <span className="font-bold">Weekly Deals</span> = the deals row inside the catalog. The label is the badge buyers see.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="badge bg-sky-50 text-atlas-blue">{featuredCount} featured</span>
          <span className="badge bg-red-50 text-atlas-red">{weeklyCount} weekly</span>
        </div>
      </div>
      {approved.length === 0 ? (
        <p className="mt-4 rounded-md bg-atlas-light p-4 text-sm text-slate-600">Approve products first — then you can promote them here.</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {approved.map((product) => (
            <PromoteRow
              key={product.id}
              product={product}
              onSaveLabel={updateProductPromotion}
              onSavePlacements={updateProductPlacements}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PromoteRow({
  product,
  onSaveLabel,
  onSavePlacements
}: {
  product: Product;
  onSaveLabel: ReturnType<typeof useAtlasStore>["updateProductPromotion"];
  onSavePlacements: ReturnType<typeof useAtlasStore>["updateProductPlacements"];
}) {
  const [value, setValue] = useState(product.promotion ?? "");
  const [saved, setSaved] = useState(false);
  const featured = product.placements?.homepageFeatured ?? false;
  const weekly = product.placements?.weeklyDeal ?? false;

  function toggle(key: "homepageFeatured" | "weeklyDeal") {
    onSavePlacements(product.id, { ...product.placements, [key]: !(product.placements?.[key] ?? false) });
  }
  function saveLabel() {
    onSaveLabel(product.id, value);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-3 rounded-md border border-slate-200 p-3">
      <div className="min-w-0 flex-1 basis-48">
        <p className="font-black text-atlas-navy">{product.brand}</p>
        <p className="truncate text-xs text-slate-600">{product.description}</p>
      </div>
      <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${featured ? "border-atlas-blue bg-sky-50 text-atlas-blue" : "border-slate-200 text-slate-500 hover:border-atlas-blue"}`}>
        <input type="checkbox" className="h-3.5 w-3.5" checked={featured} onChange={() => toggle("homepageFeatured")} />
        Homepage featured
      </label>
      <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${weekly ? "border-atlas-red bg-red-50 text-atlas-red" : "border-slate-200 text-slate-500 hover:border-atlas-red"}`}>
        <input type="checkbox" className="h-3.5 w-3.5" checked={weekly} onChange={() => toggle("weeklyDeal")} />
        Weekly Deals
      </label>
      <input
        className="field w-44"
        placeholder="Badge label (e.g. New arrival)"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button className="btn-secondary px-4" type="button" onClick={saveLabel}>
        {saved ? "Saved" : "Save label"}
      </button>
    </div>
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

function printPalletSheet(order: OrderRequest, plan: ReturnType<typeof planOrderPallets>) {
  const win = window.open("", "_blank", "width=920,height=720");
  if (!win) return;
  win.document.open();
  win.document.write(buildPalletSheetHtml(order, plan));
  win.document.close();
}

function PalletPlanPanel({ order, lines, maxPalletWeightLb }: { order: OrderRequest; lines: CartLine[]; maxPalletWeightLb?: number }) {
  const [open, setOpen] = useState(false);
  if (lines.length === 0) return null;
  const plan = planOrderPallets(lines, { maxPalletWeightLb });

  return (
    <div className="mt-4 rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-black text-atlas-navy">Pallet load plan</h4>
          <p className="mt-1 text-sm text-slate-600">
            How this order packs onto pallets for the hub — full pallets first, then mixed pallets for the leftovers. Max{" "}
            {plan.maxPalletWeightLb.toLocaleString()} lb per pallet.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" type="button" onClick={() => printPalletSheet(order, plan)} disabled={plan.totalPallets === 0}>
            Print pallet sheet
          </button>
          <button className="btn-secondary" type="button" onClick={() => setOpen((value) => !value)}>
            {open ? "Hide stack list" : "Show stack list"}
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <PalletStat label="Pallets" value={String(plan.totalPallets)} sub={`${plan.fullPallets} full · ${plan.mixedPallets} mixed`} />
        <PalletStat label="Cases palletized" value={String(plan.totalCases)} />
        <PalletStat label="Total weight" value={`${plan.totalWeightLb.toLocaleString()} lb`} />
        <PalletStat
          label="Off-pallet"
          value={String(plan.supplierDirect.reduce((s, i) => s + i.cases, 0))}
          sub="supplier-direct cases"
        />
      </div>

      {plan.needsConfig.length > 0 && (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <span className="font-bold">Missing pallet config:</span>{" "}
          {plan.needsConfig.map((item) => `${item.productName} (${item.cases} cases)`).join(", ")}. Set cases-per-pallet on these
          products to include them in the plan.
        </div>
      )}

      {open && (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {plan.pallets.map((pallet) => (
            <div key={pallet.index} className="rounded-md border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-black text-atlas-navy">Pallet {pallet.index}</span>
                <span className={`badge ${pallet.kind === "full" ? "bg-sky-50 text-atlas-blue" : "bg-amber-50 text-amber-800"}`}>
                  {pallet.kind === "full" ? "Full — single SKU" : "Mixed"}
                </span>
              </div>
              <ul className="mt-2 grid gap-1 text-sm text-slate-700">
                {pallet.items.map((item) => (
                  <li key={item.sku} className="flex justify-between gap-3">
                    <span><span className="font-bold text-atlas-navy">{item.cases}×</span> {item.productName} <span className="text-xs text-slate-400">({item.sku})</span></span>
                    <span className="shrink-0 text-slate-500">{item.weightLb.toLocaleString()} lb</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-500">
                <span>{pallet.cases} cases · {pallet.fillPct}% full</span>
                <span className={pallet.overweight ? "font-bold text-atlas-red" : ""}>
                  {pallet.weightLb.toLocaleString()} lb{pallet.overweight ? " · over max" : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PalletStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-atlas-light p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-0.5 text-lg font-black text-atlas-navy">{value}</p>
      {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}

function PricingSettingsPanel({
  settings,
  updatePricingSettings,
  products
}: {
  settings: PricingSettings;
  updatePricingSettings: ReturnType<typeof useAtlasStore>["updatePricingSettings"];
  products: Product[];
}) {
  function updateNumber(key: keyof PricingSettings) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      updatePricingSettings({
        ...settings,
        [key]: Number(event.target.value)
      });
    };
  }

  // Real average Atlas margin across listed (approved) products that have a price and cost.
  const margins = products
    .filter((product) => product.status === "approved")
    .map((product) => marginOfSale(standardCasePrice(product, settings), product.supplierCost))
    .filter((margin) => margin > 0);
  const avgMargin = margins.length > 0 ? Math.round(margins.reduce((sum, m) => sum + m, 0) / margins.length) : null;

  return (
    <section className="grid gap-6">
      <div className="panel p-5">
        <div className="flex items-center gap-2">
          <Settings className="text-atlas-blue" />
          <h2 className="text-xl font-black text-atlas-navy">Fees &amp; rules</h2>
        </div>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Product prices are set per item in the <span className="font-bold">Product prices</span> tab. This page sets the
          <span className="font-bold"> fees and rules</span> added on top — hub handling, pickup, cross-dock, delivery, and freight —
          plus the order minimum.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-sky-200 bg-sky-50 p-3">
            <p className="text-sm font-black text-atlas-navy">&ldquo;Charge&rdquo; = what the buyer pays</p>
            <p className="mt-1 text-xs text-slate-600">Added to the buyer&apos;s order total. This is Atlas revenue.</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-atlas-light p-3">
            <p className="text-sm font-black text-atlas-navy">&ldquo;Cost&rdquo; = what Atlas pays</p>
            <p className="mt-1 text-xs text-slate-600">Atlas&apos;s own expense, for profit tracking. Buyers never see it.</p>
          </div>
        </div>
      </div>

      <div className="panel border border-sky-200 bg-sky-50 p-4">
        <p className="text-sm font-bold text-atlas-navy">Order minimums are set per product</p>
        <p className="mt-1 text-sm text-slate-600">
          Each product carries its own minimum (cases and/or value) in the Products tab — there&apos;s no separate order-wide minimum.
        </p>
      </div>

      <div className="panel p-5">
        <h3 className="text-lg font-black text-atlas-navy">Average product margin</h3>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Atlas&apos;s average gross margin across all listed products, measured on each item&apos;s Retailer (reference) case price versus
          its cost. Live figure — it updates as you add products or change prices.
        </p>
        <div className="mt-3 flex items-baseline gap-3">
          <span className="text-3xl font-black text-atlas-navy">{avgMargin === null ? "—" : `${avgMargin}%`}</span>
          <span className="text-sm text-slate-500">
            {avgMargin === null
              ? "No listed products with both a price and a cost yet."
              : `Average of ${margins.length} listed ${margins.length === 1 ? "product" : "products"}.`}
          </span>
        </div>
      </div>

      <PricingGroup
        title="Default product margins"
        body="When a product has no explicit per-tier price set, Atlas prices it to earn these target margins (% of the sale price). US distribution is run on margins, not markups. Per-product prices in the Product prices tab always win over these."
      >
        <NumberField label="Loose case target margin" value={settings.caseMarginPercent} onChange={updateNumber("caseMarginPercent")} hint="Atlas margin on a single loose case when no explicit price is set." suffix="%" />
        <NumberField label="Full pallet target margin" value={settings.palletMarginPercent} onChange={updateNumber("palletMarginPercent")} hint="Atlas margin on full-pallet cases (usually lower than loose)." suffix="%" />
        <NumberField label="Loose case minimum $ margin" value={settings.minimumCaseMarginPerCase} onChange={updateNumber("minimumCaseMarginPerCase")} hint="Never sell a loose case for less than cost + this dollar margin." prefix="$" />
        <NumberField label="Full pallet minimum $ margin" value={settings.minimumPalletMarginPerCase} onChange={updateNumber("minimumPalletMarginPerCase")} hint="Never sell a pallet case for less than cost + this dollar margin." prefix="$" />
      </PricingGroup>

      <PricingGroup
        title="Pallet load planning"
        body="Used by the order load planner to decide how many pallets an order needs and how cases stack. A pallet never loads heavier than this."
      >
        <NumberField label="Max pallet weight" value={settings.maxPalletWeightLb ?? 2200} onChange={updateNumber("maxPalletWeightLb")} hint="Maximum stacked weight per pallet. Standard GMA loads run ~2,000–2,500 lb." suffix="lb" />
      </PricingGroup>

      <PricingGroup
        title="Hub handling &amp; pickup"
        body="When an order moves through an Atlas hub (Miami or Orlando), these per-case fees are added. Charge is added to the buyer; cost is Atlas's internal expense."
      >
        <NumberField label="Miami hub — charge per case" value={settings.miamiHubHandlingPerCase} onChange={updateNumber("miamiHubHandlingPerCase")} hint="What the buyer pays to handle each case through Miami." prefix="$" />
        <NumberField label="Miami hub — Atlas cost per case" value={settings.miamiHubCostPerCase} onChange={updateNumber("miamiHubCostPerCase")} hint="Atlas's own cost to handle a case at Miami." prefix="$" />
        <NumberField label="Orlando hub — charge per case" value={settings.orlandoHubHandlingPerCase} onChange={updateNumber("orlandoHubHandlingPerCase")} hint="What the buyer pays to handle each case through Orlando." prefix="$" />
        <NumberField label="Orlando hub — Atlas cost per case" value={settings.orlandoHubCostPerCase} onChange={updateNumber("orlandoHubCostPerCase")} hint="Atlas's own cost to handle a case at Orlando." prefix="$" />
        <NumberField label="Hub pickup fee" value={settings.pickupFee} onChange={updateNumber("pickupFee")} hint="Flat fee when the buyer picks up at a hub. 0 = free pickup." prefix="$" />
      </PricingGroup>

      <PricingGroup
        title="Cross-dock between hubs (Miami ↔ Orlando)"
        body="When a buyer receives at one hub but an item is stored at the other, that item is trucked over first. These are per transferred case."
      >
        <NumberField label="Transfer charge per case" value={settings.hubTransferPerCase} onChange={updateNumber("hubTransferPerCase")} hint="What the buyer pays to move one case to their hub." prefix="$" />
        <NumberField label="Transfer — Atlas cost per case" value={settings.hubTransferCostPerCase} onChange={updateNumber("hubTransferCostPerCase")} hint="Atlas's own cost to truck a case between hubs." prefix="$" />
      </PricingGroup>

      <PricingGroup
        title="Delivery &amp; freight"
        body="Added when Atlas delivers locally or arranges freight for large orders."
      >
        <NumberField label="Local delivery — charge" value={settings.localDeliveryFee} onChange={updateNumber("localDeliveryFee")} hint="What the buyer pays for local delivery (per order)." prefix="$" />
        <NumberField label="Free delivery over" value={settings.freeDeliveryThreshold ?? 0} onChange={updateNumber("freeDeliveryThreshold")} hint="Product subtotal at/above which local delivery is free. 0 = off." prefix="$" />
        <NumberField label="Local delivery — Atlas cost" value={settings.localDeliveryCost} onChange={updateNumber("localDeliveryCost")} hint="Atlas's own cost to deliver locally." prefix="$" />
        <NumberField label="Freight coordination — charge" value={settings.freightCoordinationFee} onChange={updateNumber("freightCoordinationFee")} hint="What the buyer pays when Atlas arranges freight." prefix="$" />
        <NumberField label="Freight — Atlas cost estimate" value={settings.freightCostEstimate} onChange={updateNumber("freightCostEstimate")} hint="Estimated freight cost to Atlas." prefix="$" />
        <NumberField label="Freight kicks in above" value={settings.freightCaseThreshold} onChange={updateNumber("freightCaseThreshold")} hint="Orders larger than this many cases go to freight review." suffix="cases" />
        <NumberField label="Sales Rep commission" value={settings.routeSellerCommissionPercent} onChange={updateNumber("routeSellerCommissionPercent")} hint="The seller earns this % of the total sale on their orders." suffix="%" />
      </PricingGroup>

      <PricingGroup
        title="Supplier-direct shipping"
        body="Atlas still owns the buyer and the price — supplier-direct only means an approved supplier ships the item after Atlas confirms the order."
      >
        <NumberField label="Supplier-direct fee" value={settings.supplierDirectFeePercent} onChange={updateNumber("supplierDirectFeePercent")} hint="Atlas's fee on a supplier-direct line, as a % of the item." suffix="%" />
        <NumberField label="Supplier-direct minimum fee" value={settings.supplierDirectMinimumFee} onChange={updateNumber("supplierDirectMinimumFee")} hint="The smallest fee charged on a supplier-direct line." prefix="$" />
      </PricingGroup>
    </section>
  );
}

function PricingGroup({
  title,
  body,
  children
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel p-5">
      <div className="max-w-3xl">
        <h3 className="text-lg font-black text-atlas-navy">{title}</h3>
        <p className="mt-1 text-sm text-slate-600">{body}</p>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </div>
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
  onChange,
  hint,
  prefix,
  suffix
}: {
  label: string;
  value: number;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  hint?: string;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="label">{label}</span>
      <span className="flex items-center rounded-md border border-slate-300 bg-white focus-within:border-atlas-blue">
        {prefix && <span className="pl-3 text-sm font-semibold text-slate-400">{prefix}</span>}
        <input className="w-full border-0 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-0" min="0" step="0.01" type="number" value={value} onChange={onChange} />
        {suffix && <span className="pr-3 text-sm font-semibold text-slate-400">{suffix}</span>}
      </span>
      {hint && <span className="text-xs leading-snug text-slate-500">{hint}</span>}
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

function DocumentReviewQueue({
  applications,
  rejectionNotes,
  rejectionReasons,
  setRejectionNotes,
  setRejectionReasons,
  updateApplicationDocumentStatus
}: {
  applications: Application[];
  rejectionNotes: Record<string, string>;
  rejectionReasons: Record<string, string>;
  setRejectionNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setRejectionReasons: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  updateApplicationDocumentStatus: ReturnType<typeof useAtlasStore>["updateApplicationDocumentStatus"];
}) {
  const [typeFilter, setTypeFilter] = useState<"all" | Application["type"]>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | DocumentStatus | "expiring">("uploaded");
  const [expandedApplicationId, setExpandedApplicationId] = useState<string | null>(applications[0]?.id ?? null);

  const isExpiringSoon = (document: Application["documents"][number]) => {
    const expiration = getExpirationState(document);
    return expiration.tone === "warning" || expiration.tone === "danger";
  };

  const filteredApplications = applications.filter((application) => {
    const matchesType = typeFilter === "all" || application.type === typeFilter;
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "expiring"
          ? application.documents.some(isExpiringSoon)
          : application.documents.some((document) => document.status === statusFilter);
    return matchesType && matchesStatus;
  });
  const totalDocuments = applications.reduce((sum, application) => sum + application.documents.length, 0);
  const uploadedDocuments = applications.reduce((sum, application) => sum + application.documents.filter((document) => document.status === "uploaded").length, 0);
  const approvedDocuments = applications.reduce((sum, application) => sum + application.documents.filter((document) => document.status === "approved").length, 0);
  const rejectedDocuments = applications.reduce((sum, application) => sum + application.documents.filter((document) => document.status === "rejected").length, 0);
  const expiringDocuments = applications.reduce((sum, application) => sum + application.documents.filter(isExpiringSoon).length, 0);

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-slate-200 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-atlas-navy">Document review queue</h2>
            <p className="mt-1 text-sm text-slate-600">
              Filter the queue, then open one company at a time to approve or reject documents.
            </p>
          </div>
          <div className="grid grid-cols-5 gap-2 text-center text-xs font-bold">
            <QueueCount label="All" value={totalDocuments} />
            <QueueCount label="Uploaded" value={uploadedDocuments} tone="amber" />
            <QueueCount label="Approved" value={approvedDocuments} tone="green" />
            <QueueCount label="Rejected" value={rejectedDocuments} tone="red" />
            <QueueCount label="Expiring soon" value={expiringDocuments} tone="amber" />
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[220px_220px_1fr] md:items-end">
          <label className="grid gap-2">
            <span className="label">Applicant type</span>
            <select className="field" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}>
              <option value="all">All types</option>
              <option value="buyer">Buyers</option>
              <option value="supplier">Suppliers</option>
              <option value="route_seller">Route sellers</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="label">Document status</span>
            <select className="field" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
              <option value="all">All documents</option>
              <option value="uploaded">Needs review</option>
              <option value="needed">Missing</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="expiring">Expiring soon</option>
            </select>
          </label>
          <p className="rounded-md bg-atlas-light p-3 text-sm font-semibold text-slate-700">
            Showing {filteredApplications.length} of {applications.length} applicants. Rows stay compact until opened.
          </p>
        </div>
      </div>
      <div className="divide-y divide-slate-200">
        {filteredApplications.length === 0 ? (
          <div className="p-5 text-sm font-semibold text-slate-600">No applicants match this filter.</div>
        ) : (
          filteredApplications.map((application) => {
            const isExpanded = expandedApplicationId === application.id;
            const uploadedCount = application.documents.filter((document) => document.status === "uploaded").length;
            const approvedCount = application.documents.filter((document) => document.status === "approved").length;
            const neededCount = application.documents.filter((document) => document.status === "needed").length;
            const rejectedCount = application.documents.filter((document) => document.status === "rejected").length;

            return (
              <article key={application.id}>
                <button
                  className="grid w-full gap-3 p-5 text-left hover:bg-atlas-light md:grid-cols-[1fr_220px_280px_120px] md:items-center"
                  type="button"
                  onClick={() => setExpandedApplicationId(isExpanded ? null : application.id)}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge bg-slate-100 text-slate-700">{application.type}</span>
                      <StatusBadge status={application.status} />
                    </div>
                    <h3 className="mt-2 text-lg font-black text-atlas-navy">{application.companyName}</h3>
                    <p className="text-sm text-slate-600">{application.contactName} • {application.email}</p>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p className="font-bold text-atlas-navy">{application.documents.length} required documents</p>
                    <p>{application.phone}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-black">
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-800">{uploadedCount} review</span>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-800">{approvedCount} approved</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">{neededCount} missing</span>
                    <span className="rounded-full bg-red-50 px-2 py-1 text-red-700">{rejectedCount} rejected</span>
                  </div>
                  <span className="font-black text-atlas-blue">{isExpanded ? "Close" : "Review"}</span>
                </button>
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-white p-5">
                    <RoutePreferenceCard application={application} applications={applications} />
                    <DocumentReviewList
                      application={application}
                      rejectionNotes={rejectionNotes}
                      rejectionReasons={rejectionReasons}
                      setRejectionNotes={setRejectionNotes}
                      setRejectionReasons={setRejectionReasons}
                      updateApplicationDocumentStatus={updateApplicationDocumentStatus}
                    />
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

function QueueCount({ label, value, tone = "blue" }: { label: string; value: number; tone?: "blue" | "amber" | "green" | "red" }) {
  const toneClass =
    tone === "amber"
      ? "bg-amber-50 text-amber-800"
      : tone === "green"
      ? "bg-emerald-50 text-emerald-800"
      : tone === "red"
      ? "bg-red-50 text-red-700"
      : "bg-sky-50 text-atlas-blue";

  return (
    <div className={`rounded-md px-3 py-2 ${toneClass}`}>
      <p className="text-lg font-black">{value}</p>
      <p>{label}</p>
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

function CustomerPricingPanel({
  settings,
  updatePricingSettings,
  applications,
  products,
  updateProductTierPricing,
  updateProduct
}: {
  settings: PricingSettings;
  updatePricingSettings: (settings: PricingSettings) => void;
  applications: Application[];
  products: Product[];
  updateProductTierPricing: (id: string, tierPricing: TierPricing) => void;
  updateProduct: ReturnType<typeof useAtlasStore>["updateProduct"];
}) {
  const [tierDraft] = useState<CustomerTier[]>(settings.customerTiers ?? []);
  const [accountDraft, setAccountDraft] = useState<AccountPricing[]>(settings.accountPricing ?? []);
  const [savedNote, setSavedNote] = useState(false);

  const approvedAccounts = applications.filter(
    (application) => application.status === "approved" && (application.type === "buyer" || application.type === "route_seller")
  );
  // All products that can be priced (everything except rejected), grouped by category.
  const pricingProducts = products.filter((product) => product.status !== "rejected");
  const productsByCategory = Array.from(
    pricingProducts.reduce((map, product) => {
      const key = product.category || "Uncategorized";
      const list = map.get(key) ?? [];
      list.push(product);
      map.set(key, list);
      return map;
    }, new Map<string, Product[]>())
  ).sort((a, b) => a[0].localeCompare(b[0]));
  const missingPriceCount = pricingProducts.filter(
    (product) => !product.tierPricing?.case || Object.keys(product.tierPricing.case).length === 0
  ).length;

  function accountEntry(accountId: string) {
    return accountDraft.find((entry) => entry.accountId === accountId);
  }
  function setAccount(accountId: string, patch: Partial<AccountPricing>) {
    setAccountDraft((current) => {
      const existing = current.find((entry) => entry.accountId === accountId);
      if (existing) return current.map((entry) => (entry.accountId === accountId ? { ...entry, ...patch } : entry));
      return [...current, { accountId, tierId: "retailer", ...patch }];
    });
  }
  function saveTiersAndAccounts() {
    updatePricingSettings({ ...settings, customerTiers: tierDraft, accountPricing: accountDraft });
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 2500);
  }

  return (
    <div className="grid gap-6">
      <section className="panel p-5">
        <h2 className="text-xl font-black text-atlas-navy">Product prices</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Prices are worked <span className="font-bold">down the distribution channel</span> from the shelf price. On each product you set
          <span className="font-bold"> Cost + SRP per unit</span>; the system calculates the Retailer price, then the Distributor price below
          it, each level taking its margin. Atlas keeps whatever is left above cost. Buyers see only their own level&apos;s price.
        </p>
      </section>

      <section className="panel p-5">
        <h3 className="text-lg font-black text-atlas-navy">Account assignments</h3>
        <p className="mt-1 text-sm text-slate-600">
          Assign each approved buyer/rep a price level. The account override % is optional — leave blank to use that level&apos;s price; set it
          to give one account an extra % off across all products.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="px-2 py-2">Account</th>
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">Price level</th>
                <th className="px-2 py-2">Account override %</th>
              </tr>
            </thead>
            <tbody>
              {approvedAccounts.length === 0 ? (
                <tr>
                  <td className="px-2 py-3 text-slate-500" colSpan={4}>
                    No approved buyer or rep accounts yet.
                  </td>
                </tr>
              ) : (
                approvedAccounts.map((account) => {
                  const entry = accountEntry(account.id);
                  return (
                    <tr key={account.id} className="border-t border-slate-100">
                      <td className="px-2 py-2 font-bold text-atlas-navy">{account.companyName}</td>
                      <td className="px-2 py-2 text-slate-600">{account.type === "route_seller" ? "Sales Rep" : "Buyer"}</td>
                      <td className="px-2 py-2">
                        <select
                          className="field h-9 min-h-9"
                          value={entry?.tierId ?? "retailer"}
                          onChange={(event) => setAccount(account.id, { tierId: event.target.value })}
                        >
                          {tierDraft.map((tier) => (
                            <option key={tier.id} value={tier.id}>
                              {tier.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          className="field h-9 min-h-9 w-28"
                          type="number"
                          step="0.5"
                          placeholder="None"
                          value={entry?.adjustmentPct ?? ""}
                          onChange={(event) =>
                            setAccount(account.id, {
                              adjustmentPct: event.target.value === "" ? undefined : Number(event.target.value)
                            })
                          }
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button className="btn-primary" type="button" onClick={saveTiersAndAccounts}>
          Save levels &amp; accounts
        </button>
        {savedNote && <span className="text-sm font-bold text-emerald-700">Saved.</span>}
      </div>

      <section className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-atlas-navy">Prices by product</h3>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              Set the <span className="font-bold">retail price per unit</span> and each level&apos;s case price is calculated for you (SRP ×
              units-per-case × (1 − margin)). Type a price to override. Cost is optional and only shows Atlas&apos;s margin.
            </p>
          </div>
          {missingPriceCount > 0 && (
            <span className="badge bg-amber-50 text-amber-800">{missingPriceCount} need prices</span>
          )}
        </div>
        {pricingProducts.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No products yet. Add one in the Products tab.</p>
        ) : (
          <div className="mt-4 grid gap-6">
            {productsByCategory.map(([category, items]) => (
              <div key={category}>
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <h4 className="text-sm font-black uppercase tracking-wide text-atlas-blue">{category}</h4>
                  <span className="text-xs font-semibold text-slate-400">{items.length}</span>
                </div>
                <div className="mt-3 grid gap-3">
                  {items.map((product) => (
                    <ProductTierPriceRow
                      key={product.id}
                      product={product}
                      tiers={tierDraft}
                      onSave={updateProductTierPricing}
                      updateProduct={updateProduct}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ProductTierPriceRow({
  product,
  tiers,
  onSave,
  updateProduct
}: {
  product: Product;
  tiers: CustomerTier[];
  onSave: (id: string, tierPricing: TierPricing) => void;
  updateProduct: ReturnType<typeof useAtlasStore>["updateProduct"];
}) {
  const pack = product.casePack || 1;
  const seed: Record<string, string> = {};
  for (const tier of tiers) {
    const value = product.tierPricing?.case?.[tier.id];
    seed[tier.id] = typeof value === "number" ? String(value) : "";
  }
  const [draft, setDraft] = useState<Record<string, string>>(seed);
  const [srp, setSrp] = useState(product.suggestedRetail ? String(product.suggestedRetail) : "");
  const [costDraft, setCostDraft] = useState(product.supplierCost ? String(product.supplierCost) : "");
  const [saved, setSaved] = useState(false);

  const srpNum = Number(srp) || 0;
  const cost = Number(costDraft) || 0;

  // Channel cascade: from shelf price (SRP × pack) down each level by its margin.
  const shelfCase = srpNum * pack;
  const calc: Record<string, number> = {};
  let running = shelfCase;
  for (const tier of tiers) {
    running = Math.round(running * (1 - (tier.marginPct || 0) / 100) * 100) / 100;
    calc[tier.id] = running;
  }
  const lowestTierId = tiers[tiers.length - 1]?.id;
  const lowestPrice = lowestTierId ? calc[lowestTierId] : 0;
  const costTooHigh = cost > 0 && lowestPrice > 0 && cost >= lowestPrice;

  function save() {
    const casePrices: Record<string, number> = {};
    for (const [tierId, value] of Object.entries(draft)) {
      const numeric = Number(value);
      if (value.trim() !== "" && !Number.isNaN(numeric) && numeric > 0) casePrices[tierId] = numeric;
    }
    const patch: Partial<Product> = {};
    if (srpNum !== (product.suggestedRetail || 0)) patch.suggestedRetail = srpNum;
    if (cost !== (product.supplierCost || 0)) patch.supplierCost = cost;
    if (Object.keys(patch).length > 0) updateProduct(product.id, patch);
    onSave(product.id, { case: casePrices, pallet: product.tierPricing?.pallet });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const palletCases = productPalletSize(product);

  return (
    <div className="rounded-md border border-slate-200 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-bold text-atlas-navy">
            <span className="truncate">{product.brand}</span>
            {product.status === "pending" && <span className="badge bg-amber-50 text-amber-800">Pending</span>}
          </p>
          <p className="truncate text-xs text-slate-500">
            {product.sku} · {pack} units/case · {palletCases > 0 ? `${palletCases} cases/pallet` : "pallet not set"}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-0.5">
            <span className="text-[11px] font-bold text-slate-500">Cost / case</span>
            <span className="flex items-center rounded-md border border-slate-300 bg-white">
              <span className="pl-2 text-xs text-slate-400">$</span>
              <input className="w-20 border-0 bg-transparent px-1 py-1.5 text-sm focus:outline-none" type="number" step="0.01" placeholder="45.00" value={costDraft} onChange={(event) => setCostDraft(event.target.value)} />
            </span>
          </label>
          <label className="grid gap-0.5">
            <span className="text-[11px] font-bold text-slate-500">SRP / unit</span>
            <span className="flex items-center rounded-md border border-slate-300 bg-white">
              <span className="pl-2 text-xs text-slate-400">$</span>
              <input className="w-20 border-0 bg-transparent px-1 py-1.5 text-sm focus:outline-none" type="number" step="0.01" placeholder="4.99" value={srp} onChange={(event) => setSrp(event.target.value)} />
            </span>
          </label>
        </div>
      </div>
      {shelfCase > 0 && (
        <p className={`mt-2 text-xs font-semibold ${costTooHigh ? "text-atlas-red" : "text-emerald-700"}`}>
          {costTooHigh
            ? `⚠ Cost ${formatMoney(cost)} is above the lowest channel price — raise SRP or lower cost.`
            : `Shelf price ${formatMoney(srpNum)}/unit · ${formatMoney(shelfCase)}/case. Prices calculated down the channel:`}
        </p>
      )}
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {tiers.map((tier) => {
          const raw = draft[tier.id] ?? "";
          const calculated = calc[tier.id] ?? 0;
          const effective = raw.trim() === "" ? calculated : Number(raw) || 0;
          const overridden = raw.trim() !== "";
          const atlasMargin = marginOfSale(effective, cost);
          return (
            <label key={tier.id} className="grid gap-1 rounded-md bg-atlas-light p-2">
              <span className="flex items-center justify-between text-xs font-bold text-slate-600">
                {tier.label}
                {overridden && <span className="text-[10px] font-black uppercase text-atlas-blue">override</span>}
              </span>
              <input
                className="field h-9 min-h-9"
                type="number"
                step="0.01"
                placeholder={calculated > 0 ? `${formatMoney(calculated)}` : "enter SRP"}
                value={raw}
                onChange={(event) => setDraft((current) => ({ ...current, [tier.id]: event.target.value }))}
              />
              <span className="text-xs font-semibold text-emerald-700">
                {effective > 0
                  ? `${formatMoney(effective)}/case${cost > 0 ? ` · Atlas ${atlasMargin}%` : ""}`
                  : "Set SRP above"}
              </span>
            </label>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button className="btn-secondary px-4 py-2 text-sm" type="button" onClick={save}>
          Save prices
        </button>
        {saved && <span className="text-sm font-bold text-emerald-700">Saved.</span>}
      </div>
    </div>
  );
}
