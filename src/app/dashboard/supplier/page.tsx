"use client";

import { FormEvent, useState } from "react";
import { Megaphone } from "lucide-react";
import { Nav } from "@/components/nav";
import { ProductUpload } from "@/components/product-upload";
import { StatusBadge } from "@/components/status-badge";
import { useAtlasStore } from "@/components/local-store";
import { getDocumentAlerts } from "@/lib/documents";
import { useI18n } from "@/lib/i18n";

export default function SupplierDashboardPage() {
  const { t } = useI18n();
  const { store, setStore } = useAtlasStore();
  const [promo, setPromo] = useState(t("noPromotionSubmitted"));
  const supplierProducts = store.products.filter((product) => product.supplierName === "Current Supplier" || product.supplierName === "Harborline Brands");
  const documentAlerts = getDocumentAlerts(store.applications, "supplier");
  const supplierApplication = store.applications.find((application) => application.type === "supplier");

  function updateInventory(id: string, inventoryAvailable: number) {
    setStore((current) => ({
      ...current,
      products: current.products.map((product) => (product.id === id ? { ...product, inventoryAvailable } : product))
    }));
  }

  function submitPromotion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPromo(`${t("submittedPrefix")}: ${String(form.get("promotion"))}`);
    event.currentTarget.reset();
  }

  return (
    <>
      <Nav />
      <main className="atlas-container grid gap-6 py-8 lg:grid-cols-[390px_1fr]">
        <aside className="grid h-fit gap-5">
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
              {t("promotionSubmission")}
            </h2>
            <textarea className="field mt-4 min-h-28" name="promotion" placeholder={t("promotionPlaceholder")} required />
            <button className="btn-primary mt-3 w-full" type="submit">{t("submitPromotion")}</button>
            <p className="mt-3 text-sm font-semibold text-atlas-blue">{promo}</p>
          </form>
        </aside>
        <section className="panel overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <h1 className="text-3xl font-black text-atlas-navy">{t("supplierDashboard")}</h1>
            <p className="mt-1 text-slate-600">{t("supplierDashboardBody")}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1160px] text-left text-sm">
              <thead className="bg-atlas-light text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">{t("brandLabel")}</th>
                  <th className="px-5 py-3">{t("productHeader")}</th>
                  <th className="px-5 py-3">{t("cost")}</th>
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
                    <td className="px-5 py-4">${product.supplierCost.toFixed(2)}</td>
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
                    <td className="px-5 py-4"><StatusBadge status={product.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
