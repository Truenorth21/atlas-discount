"use client";

import { BarChart3, Check, DollarSign, FileCheck2, Megaphone, PackageCheck, Settings, UsersRound, X } from "lucide-react";
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
  formatMoney,
  tierPriceFromCost
} from "@/lib/pricing";
import { atlasHubs, fulfillmentTypes, productCategories } from "@/lib/data";
import type { AccountPricing, Application, AtlasHub, CustomerTier, DocumentStatus, OrderRequest, PricingSettings, Product, ProductSpec, PromotionSubmission, QuoteAdjustment, TierPricing } from "@/lib/types";

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
  const { store, addProducts, updateApplicationStatus, updateApplicationDocumentStatus, updateProductStatus, updateProductPromotion, updateProductTierPricing, updatePricingSettings, updateQuoteAdjustment, updatePromotionSubmissionStatus } = useAtlasStore();
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
  const tabs = [
    { id: "overview", label: "Overview", count: uploadedDocumentCount + userPendingCount + pendingProducts.length + quoteReviewOrders.length },
    { id: "documents", label: "Documents", count: uploadedDocumentCount },
    { id: "users", label: "Users", count: userPendingCount },
    { id: "products", label: "Products", count: pendingProducts.length },
    { id: "quotes", label: "Quotes", count: store.orders.length },
    { id: "fulfillment", label: "Fulfillment", count: quoteReviewOrders.length },
    { id: "pricing", label: "Pricing", count: 1 },
    { id: "customerPricing", label: "Customer pricing", count: store.pricingSettings.customerTiers?.length ?? 0 },
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
          <Metric icon={<UsersRound />} label="Users pending" value={store.applications.filter((item) => item.status === "pending").length} />
          <Metric icon={<FileCheck2 />} label="Documents" value={store.applications.reduce((sum, item) => sum + item.documents.length, 0)} />
          <Metric icon={<PackageCheck />} label="Product approvals" value={pendingProducts.length} />
          <Metric icon={<Check />} label="Open quotes" value={store.orders.length} />
          <Metric icon={<DollarSign />} label="Case markup %" value={store.pricingSettings.caseMarkupPercent} />
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
          <PricingSettingsPanel settings={store.pricingSettings} updatePricingSettings={updatePricingSettings} />
        )}
        {activeTab === "customerPricing" && (
          <CustomerPricingPanel
            settings={store.pricingSettings}
            updatePricingSettings={updatePricingSettings}
            applications={store.applications}
            products={store.products}
            updateProductTierPricing={updateProductTierPricing}
          />
        )}
        {activeTab === "fulfillment" && <FulfillmentOperationsPanel orders={store.orders} pricingSettings={store.pricingSettings} quoteAdjustments={store.quoteAdjustments} />}
        {activeTab === "marketing" && (
          <MarketingPanel
            settings={store.pricingSettings}
            updatePricingSettings={updatePricingSettings}
            products={store.products}
            updateProductPromotion={updateProductPromotion}
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
  updateProductStatus
}: {
  addProducts: ReturnType<typeof useAtlasStore>["addProducts"];
  pendingProducts: Product[];
  products: Product[];
  pricingSettings: PricingSettings;
  updateProductStatus: ReturnType<typeof useAtlasStore>["updateProductStatus"];
}) {
  const [activeProductTab, setActiveProductTab] = useState("upload");
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
            ["upload", "Upload sheet"],
            ["single", "Add one product"],
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

      {activeProductTab === "upload" && (
        <ProductUpload
          defaultStatus="approved"
          supplierName="Atlas Admin"
          submitLabel="Publish valid rows"
          submittedMessage="valid products published to the catalog."
        />
      )}
      {activeProductTab === "single" && <AdminSingleProductForm addProducts={addProducts} />}
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
          <Link className="btn-primary" href="/catalog">
            View buyer catalog
          </Link>
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
  supplierCost: "", suggestedRetail: "", moq: "1", leadTime: "", inventoryAvailable: "0",
  priceRetailer: "", priceDistributor: "", priceAtlasRep: "",
  palletPriceRetailer: "", palletPriceDistributor: "", palletPriceAtlasRep: "",
  supplierName: "Atlas Admin", promotion: ""
};

const toNum = (value: string) => {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

/** Build the explicit per-tier pricing (master case + optional full pallet) from the product form. */
function buildTierPricing(form: typeof blankProductForm): TierPricing {
  const caseEntries: Array<[string, string]> = [
    ["retailer", form.priceRetailer],
    ["distributor", form.priceDistributor],
    ["atlas_rep", form.priceAtlasRep]
  ];
  const palletEntries: Array<[string, string]> = [
    ["retailer", form.palletPriceRetailer],
    ["distributor", form.palletPriceDistributor],
    ["atlas_rep", form.palletPriceAtlasRep]
  ];
  const casePrices: Record<string, number> = {};
  for (const [id, value] of caseEntries) {
    const n = toNum(value);
    if (n !== undefined && n > 0) casePrices[id] = n;
  }
  const palletPrices: Record<string, number> = {};
  for (const [id, value] of palletEntries) {
    const n = toNum(value);
    if (n !== undefined && n > 0) palletPrices[id] = n;
  }
  return Object.keys(palletPrices).length > 0 ? { case: casePrices, pallet: palletPrices } : { case: casePrices };
}

const PRODUCT_FORM_TIERS: Array<{ id: string; label: string; priceField: keyof typeof blankProductForm; palletField: keyof typeof blankProductForm; defaultMarkup: number }> = [
  { id: "retailer", label: "Retailer", priceField: "priceRetailer", palletField: "palletPriceRetailer", defaultMarkup: 30 },
  { id: "distributor", label: "Distributor", priceField: "priceDistributor", palletField: "palletPriceDistributor", defaultMarkup: 22 },
  { id: "atlas_rep", label: "Sales Rep", priceField: "priceAtlasRep", palletField: "palletPriceAtlasRep", defaultMarkup: 15 }
];

function AdminSingleProductForm({ addProducts }: { addProducts: ReturnType<typeof useAtlasStore>["addProducts"] }) {
  const [form, setForm] = useState(blankProductForm);
  const [hasInner, setHasInner] = useState(false);
  const [message, setMessage] = useState("");

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
      imageUrl: form.imageUrl || "/product-images/disinfecting-wipes.svg",
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
      status: "approved",
      supplierName: form.supplierName || "Atlas Admin",
      promotion: form.promotion || undefined,
      spec
    };

    addProducts([product]);
    setMessage(`${product.brand} ${product.sku} was published to the catalog.`);
    setForm((current) => ({ ...blankProductForm, supplierName: current.supplierName, shippingWarehouse: current.shippingWarehouse, fulfillmentMode: current.fulfillmentMode }));
    setHasInner(false);
  }

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-atlas-navy">Add one product</h2>
          <p className="mt-1 text-sm text-slate-600">Only SKU, brand, product name, and category are required — fill in the rest as you have it.</p>
        </div>
        <button className="btn-primary" type="button" onClick={addProduct}>
          Publish product
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <ProductSectionHeading>Identifiers</ProductSectionHeading>
        <AdminProductInput label="SKU *" value={form.sku} onChange={updateField("sku")} />
        <AdminProductInput label="Brand *" value={form.brand} onChange={updateField("brand")} />
        <AdminProductInput label="UPC" value={form.upc} onChange={updateField("upc")} />
        <AdminProductInput label="GTIN (case)" value={form.gtinCase} onChange={updateField("gtinCase")} />
        <AdminProductInput label="GTIN (inner)" value={form.gtinInner} onChange={updateField("gtinInner")} />
        <AdminProductInput label="Supplier name" value={form.supplierName} onChange={updateField("supplierName")} />
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

        <ProductSectionHeading>Pricing (per master case)</ProductSectionHeading>
        <AdminProductInput label="Case cost to Atlas" type="number" value={form.supplierCost} onChange={updateField("supplierCost")} />
        <AdminProductInput label="Suggested retail (MSRP, optional)" type="number" value={form.suggestedRetail} onChange={updateField("suggestedRetail")} />
        <div className="hidden md:block" />
        <div className="md:col-span-3 grid gap-3 rounded-md border border-slate-200 bg-atlas-light p-3 sm:grid-cols-3">
          {PRODUCT_FORM_TIERS.map((tier) => {
            const cost = toNum(form.supplierCost) ?? 0;
            const priceRaw = form[tier.priceField];
            const effective = priceRaw.trim() === "" ? tierPriceFromCost(cost, tier.defaultMarkup) : toNum(priceRaw) ?? 0;
            const marginPct = effective > 0 && cost > 0 ? Math.round(((effective - cost) / effective) * 100) : 0;
            return (
              <div key={tier.id} className="grid gap-1 rounded-md bg-white p-2">
                <span className="text-xs font-black uppercase tracking-wide text-atlas-blue">{tier.label}</span>
                <label className="grid gap-1">
                  <span className="text-[11px] font-semibold text-slate-500">Case price $</span>
                  <input
                    className="field h-9 min-h-9"
                    type="number"
                    step="0.01"
                    placeholder={cost > 0 ? `${formatMoney(tierPriceFromCost(cost, tier.defaultMarkup))} (default)` : "0.00"}
                    value={priceRaw}
                    onChange={updateField(tier.priceField)}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-[11px] font-semibold text-slate-500">Full-pallet price $ (optional)</span>
                  <input
                    className="field h-9 min-h-9"
                    type="number"
                    step="0.01"
                    placeholder="same as case"
                    value={form[tier.palletField]}
                    onChange={updateField(tier.palletField)}
                  />
                </label>
                <span className="text-[11px] font-semibold text-emerald-700">
                  {cost > 0 ? `${marginPct}% margin · ${formatMoney(effective - cost)}/case` : "Enter cost for margin"}
                </span>
              </div>
            );
          })}
        </div>

        <ProductSectionHeading>Stock</ProductSectionHeading>
        <AdminProductInput label="MOQ (cases)" type="number" value={form.moq} onChange={updateField("moq")} />
        <AdminProductInput label="Inventory available" type="number" value={form.inventoryAvailable} onChange={updateField("inventoryAvailable")} />
        <AdminProductInput label="Lead time" value={form.leadTime} onChange={updateField("leadTime")} />
        <AdminProductInput label="Promotion label" value={form.promotion} onChange={updateField("promotion")} />
      </div>
      {message && <p className="mt-4 rounded-md bg-sky-50 p-3 text-sm font-bold text-atlas-blue">{message}</p>}
    </section>
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
  updateProductPromotion,
  promotionSubmissions,
  updatePromotionSubmissionStatus
}: {
  settings: PricingSettings;
  updatePricingSettings: ReturnType<typeof useAtlasStore>["updatePricingSettings"];
  products: Product[];
  updateProductPromotion: ReturnType<typeof useAtlasStore>["updateProductPromotion"];
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
      <PromoteProductsPanel products={products} updateProductPromotion={updateProductPromotion} />
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

function PromoteProductsPanel({
  products,
  updateProductPromotion
}: {
  products: Product[];
  updateProductPromotion: ReturnType<typeof useAtlasStore>["updateProductPromotion"];
}) {
  const approved = products.filter((product) => product.status === "approved");
  const promotedCount = approved.filter((product) => product.promotion).length;
  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-atlas-navy">Promote products</h3>
          <p className="mt-1 text-sm text-slate-600">Add a promo label to feature a product in Weekly Deals and show a badge in the catalog.</p>
        </div>
        <span className="badge bg-red-50 text-atlas-red">{promotedCount} promoted</span>
      </div>
      {approved.length === 0 ? (
        <p className="mt-4 rounded-md bg-atlas-light p-4 text-sm text-slate-600">Approve products first — then you can promote them here.</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {approved.map((product) => (
            <PromoteRow key={product.id} product={product} onSave={updateProductPromotion} />
          ))}
        </div>
      )}
    </div>
  );
}

function PromoteRow({ product, onSave }: { product: Product; onSave: ReturnType<typeof useAtlasStore>["updateProductPromotion"] }) {
  const [value, setValue] = useState(product.promotion ?? "");
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-slate-200 p-3">
      <div className="min-w-0 flex-1">
        <p className="font-black text-atlas-navy">{product.brand}</p>
        <p className="truncate text-xs text-slate-600">{product.description}</p>
      </div>
      {product.promotion && <span className="badge bg-red-50 text-atlas-red">Promoted</span>}
      <input
        className="field w-60"
        placeholder="e.g. 10% off 50+ cases"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button className="btn-primary px-4" type="button" onClick={() => onSave(product.id, value)}>
        Save
      </button>
      {product.promotion && (
        <button
          className="btn-secondary px-3"
          type="button"
          onClick={() => {
            setValue("");
            onSave(product.id, "");
          }}
        >
          Clear
        </button>
      )}
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
          <h2 className="text-xl font-black text-atlas-navy">Pricing playbook</h2>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Set the normal rules once. When a customer needs a special deal, change it on the quote instead of changing these defaults.
        </p>
        <div className="mt-5 grid gap-4 xl:grid-cols-4">
          <PricingPathCard
            title="1. Buyer adds products"
            body={`Order must reach ${settings.minimumMixedOrderCases} cases or ${formatMoney(settings.minimumOrderValue)}.`}
            note="This is the simple minimum before Atlas spends time quoting."
          />
          <PricingPathCard
            title="2. Product price is chosen"
            body={`${settings.caseMarkupPercent}% for loose cases. ${settings.palletMarkupPercent}% for full pallet lines.`}
            note="One product can be pallet-priced while the rest of the cart is loose-case priced."
          />
          <PricingPathCard
            title="3. Fulfillment is added"
            body="Pickup, hub handling, delivery, or freight gets added after product pricing."
            note="This keeps product margin separate from logistics cost."
          />
          <PricingPathCard
            title="4. Quote can be adjusted"
            body="Discounts, free delivery, and bonus product are handled per quote."
            note="Use this when you want to be generous on one large order."
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="panel p-5">
          <h3 className="text-lg font-black text-atlas-navy">How Atlas prices a mixed supermarket order</h3>
          <div className="mt-4 grid gap-3">
            <PlainEnglishFormula
              title="Mixed cases"
              body="Each item is priced by its own quantity. Small quantities use loose-case pricing."
              example="Example: 1 case of paper, 3 cases of sauce, 5 cases of soap all use loose-case pricing."
            />
            <PlainEnglishFormula
              title="Full pallet item"
              body="If one SKU reaches its pallet count, only that SKU gets pallet pricing."
              example="Example: 84 cases of one drink item can get pallet pricing, while the rest stays loose-case."
            />
            <PlainEnglishFormula
              title="Delivery"
              body="Delivery can be charged as one order fee, waived, or spread across items by case count."
              example={`Default local delivery charge is ${formatMoney(settings.localDeliveryFee)}. Estimated Atlas cost is ${formatMoney(settings.localDeliveryCost)}.`}
            />
          </div>
        </div>

        <div className="panel p-5">
          <h3 className="text-lg font-black text-atlas-navy">What changes per quote</h3>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="rounded-md border border-slate-200 bg-atlas-light p-3">
              <p className="font-black text-atlas-navy">Discount</p>
              <p className="mt-1 text-slate-600">Use this for a large customer or one-time negotiation.</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-atlas-light p-3">
              <p className="font-black text-atlas-navy">Free delivery</p>
              <p className="mt-1 text-slate-600">Use this when order size protects enough profit.</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-atlas-light p-3">
              <p className="font-black text-atlas-navy">Free product</p>
              <p className="mt-1 text-slate-600">Use this as a note on the quote so it does not change catalog pricing.</p>
            </div>
          </div>
        </div>
      </div>

      <PricingGroup
        title="Buyer order minimum"
        body="The cart should meet at least one of these before the buyer can submit a normal order request."
      >
        <NumberField label="Minimum mixed cases" value={settings.minimumMixedOrderCases} onChange={updateNumber("minimumMixedOrderCases")} />
        <NumberField label="Minimum order value" value={settings.minimumOrderValue} onChange={updateNumber("minimumOrderValue")} />
      </PricingGroup>

      <PricingGroup
        title="Product pricing"
        body="This controls the sell price per case before delivery or freight is added."
      >
        <NumberField label="Loose case markup %" value={settings.caseMarkupPercent} onChange={updateNumber("caseMarkupPercent")} />
        <NumberField label="Minimum loose case margin" value={settings.minimumCaseMarginPerCase} onChange={updateNumber("minimumCaseMarginPerCase")} />
        <NumberField label="Full pallet markup %" value={settings.palletMarkupPercent} onChange={updateNumber("palletMarkupPercent")} />
        <NumberField label="Minimum pallet case margin" value={settings.minimumPalletMarginPerCase} onChange={updateNumber("minimumPalletMarginPerCase")} />
      </PricingGroup>

      <PricingGroup
        title="Hub and pickup"
        body="Use these when Atlas handles product through Miami, Orlando, or hub pickup."
      >
        <NumberField label="Miami hub charge / case" value={settings.miamiHubHandlingPerCase} onChange={updateNumber("miamiHubHandlingPerCase")} />
        <NumberField label="Miami hub cost / case" value={settings.miamiHubCostPerCase} onChange={updateNumber("miamiHubCostPerCase")} />
        <NumberField label="Orlando hub charge / case" value={settings.orlandoHubHandlingPerCase} onChange={updateNumber("orlandoHubHandlingPerCase")} />
        <NumberField label="Orlando hub cost / case" value={settings.orlandoHubCostPerCase} onChange={updateNumber("orlandoHubCostPerCase")} />
        <NumberField label="Pickup fee" value={settings.pickupFee} onChange={updateNumber("pickupFee")} />
        <NumberField label="Cross-dock transfer charge / case (Miami ↔ Orlando)" value={settings.hubTransferPerCase} onChange={updateNumber("hubTransferPerCase")} />
        <NumberField label="Cross-dock transfer cost / case" value={settings.hubTransferCostPerCase} onChange={updateNumber("hubTransferCostPerCase")} />
      </PricingGroup>

      <PricingGroup
        title="Delivery, freight, and sales commission"
        body="These are added after product pricing when Atlas delivers, arranges freight, or pays a route seller."
      >
        <NumberField label="Local delivery charge" value={settings.localDeliveryFee} onChange={updateNumber("localDeliveryFee")} />
        <NumberField label="Local delivery cost" value={settings.localDeliveryCost} onChange={updateNumber("localDeliveryCost")} />
        <NumberField label="Freight coordination charge" value={settings.freightCoordinationFee} onChange={updateNumber("freightCoordinationFee")} />
        <NumberField label="Freight cost estimate" value={settings.freightCostEstimate} onChange={updateNumber("freightCostEstimate")} />
        <NumberField label="Freight case threshold" value={settings.freightCaseThreshold} onChange={updateNumber("freightCaseThreshold")} />
        <NumberField label="Route seller commission %" value={settings.routeSellerCommissionPercent} onChange={updateNumber("routeSellerCommissionPercent")} />
      </PricingGroup>

      <PricingGroup
        title="Supplier direct"
        body="Atlas owns the buyer and quote. Supplier direct only means the approved supplier ships after Atlas confirms pricing."
      >
        <NumberField label="Supplier direct fee %" value={settings.supplierDirectFeePercent} onChange={updateNumber("supplierDirectFeePercent")} />
        <NumberField label="Supplier direct minimum fee" value={settings.supplierDirectMinimumFee} onChange={updateNumber("supplierDirectMinimumFee")} />
      </PricingGroup>
    </section>
  );
}

function PricingPathCard({ title, body, note }: { title: string; body: string; note: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-atlas-light p-4">
      <h3 className="font-black text-atlas-navy">{title}</h3>
      <p className="mt-2 text-sm font-semibold text-slate-700">{body}</p>
      <p className="mt-2 text-xs text-slate-500">{note}</p>
    </div>
  );
}

function PlainEnglishFormula({ title, body, example }: { title: string; body: string; example: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <p className="font-black text-atlas-navy">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
      <p className="mt-2 rounded-md bg-atlas-light p-2 text-xs font-semibold text-slate-600">{example}</p>
    </div>
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
  updateProductTierPricing
}: {
  settings: PricingSettings;
  updatePricingSettings: (settings: PricingSettings) => void;
  applications: Application[];
  products: Product[];
  updateProductTierPricing: (id: string, tierPricing: TierPricing) => void;
}) {
  const [tierDraft, setTierDraft] = useState<CustomerTier[]>(settings.customerTiers ?? []);
  const [accountDraft, setAccountDraft] = useState<AccountPricing[]>(settings.accountPricing ?? []);
  const [savedNote, setSavedNote] = useState(false);

  const approvedAccounts = applications.filter(
    (application) => application.status === "approved" && (application.type === "buyer" || application.type === "route_seller")
  );
  const approvedProducts = products.filter((product) => product.status === "approved");

  function updateTier(id: string, patch: Partial<CustomerTier>) {
    setTierDraft((current) => current.map((tier) => (tier.id === id ? { ...tier, ...patch } : tier)));
  }
  function addTier() {
    setTierDraft((current) => [...current, { id: `tier_${Date.now().toString(36)}`, label: "New level", defaultMarkupPct: 25 }]);
  }
  function removeTier(id: string) {
    setTierDraft((current) => current.filter((tier) => tier.id !== id));
  }
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
        <h2 className="text-xl font-black text-atlas-navy">Customer pricing</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Atlas sells by the <span className="font-bold">master case</span>. For each product you enter the price each
          customer type pays (you see your case cost and the margin). New products pre-fill from the default markups below,
          and you can change any price. Buyers only see their own tier&apos;s price after sign-in — cost and margin are never shown to them.
        </p>
      </section>

      <section className="panel p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-atlas-navy">Price levels</h3>
            <p className="mt-1 text-sm text-slate-600">Customer types and the default markup over cost used to pre-fill new products.</p>
          </div>
          <button className="btn-secondary" type="button" onClick={addTier}>
            Add level
          </button>
        </div>
        <div className="mt-4 grid gap-3">
          {tierDraft.map((tier) => (
            <div key={tier.id} className="grid items-end gap-3 rounded-md border border-slate-200 p-3 sm:grid-cols-[1fr_180px_auto]">
              <label className="grid gap-1">
                <span className="label">Level name</span>
                <input className="field" value={tier.label} onChange={(event) => updateTier(tier.id, { label: event.target.value })} />
              </label>
              <label className="grid gap-1">
                <span className="label">Default markup over cost (%)</span>
                <input
                  className="field"
                  type="number"
                  step="0.5"
                  value={tier.defaultMarkupPct}
                  onChange={(event) => updateTier(tier.id, { defaultMarkupPct: Number(event.target.value) })}
                />
              </label>
              <div className="flex items-center gap-2 pb-2">
                {tier.isReference ? (
                  <span className="badge bg-sky-50 text-atlas-blue">Reference</span>
                ) : (
                  <button
                    className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-atlas-red"
                    type="button"
                    onClick={() => removeTier(tier.id)}
                    aria-label={`Remove ${tier.label} level`}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
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
        <h3 className="text-lg font-black text-atlas-navy">Product prices</h3>
        <p className="mt-1 text-sm text-slate-600">
          Set the case price each level pays. Your cost and margin show beside each price. Blank fields use the default markup over cost.
        </p>
        <div className="mt-4 grid max-h-[34rem] gap-3 overflow-y-auto pr-1">
          {approvedProducts.length === 0 ? (
            <p className="text-sm text-slate-500">No approved products yet.</p>
          ) : (
            approvedProducts.map((product) => (
              <ProductTierPriceRow
                key={product.id}
                product={product}
                tiers={tierDraft}
                onSave={updateProductTierPricing}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function ProductTierPriceRow({
  product,
  tiers,
  onSave
}: {
  product: Product;
  tiers: CustomerTier[];
  onSave: (id: string, tierPricing: TierPricing) => void;
}) {
  const cost = product.supplierCost;
  const seed: Record<string, string> = {};
  for (const tier of tiers) {
    const value = product.tierPricing?.case?.[tier.id];
    seed[tier.id] = typeof value === "number" ? String(value) : "";
  }
  const [draft, setDraft] = useState<Record<string, string>>(seed);
  const [saved, setSaved] = useState(false);

  function save() {
    const casePrices: Record<string, number> = {};
    for (const [tierId, value] of Object.entries(draft)) {
      const numeric = Number(value);
      if (value.trim() !== "" && !Number.isNaN(numeric) && numeric > 0) casePrices[tierId] = numeric;
    }
    onSave(product.id, { case: casePrices, pallet: product.tierPricing?.pallet });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="rounded-md border border-slate-200 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-bold text-atlas-navy">{product.brand}</p>
          <p className="truncate text-xs text-slate-500">{product.sku} · {product.category}</p>
        </div>
        <p className="text-sm font-black text-atlas-navy">
          Case cost <span className="text-atlas-red">{formatMoney(cost)}</span>
        </p>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {tiers.map((tier) => {
          const raw = draft[tier.id] ?? "";
          const effective = raw.trim() === "" ? tierPriceFromCost(cost, tier.defaultMarkupPct) : Number(raw) || 0;
          const marginPct = effective > 0 && cost > 0 ? Math.round(((effective - cost) / effective) * 100) : 0;
          return (
            <label key={tier.id} className="grid gap-1 rounded-md bg-atlas-light p-2">
              <span className="text-xs font-bold text-slate-600">{tier.label} · $ / case</span>
              <input
                className="field h-9 min-h-9"
                type="number"
                step="0.01"
                placeholder={`${formatMoney(tierPriceFromCost(cost, tier.defaultMarkupPct))} (default)`}
                value={raw}
                onChange={(event) => setDraft((current) => ({ ...current, [tier.id]: event.target.value }))}
              />
              <span className="text-xs font-semibold text-emerald-700">
                {cost > 0 ? `${marginPct}% margin · ${formatMoney(effective - cost)}/case` : "Enter cost to see margin"}
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
