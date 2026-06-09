"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Plus, Printer, Tag } from "lucide-react";
import { Nav } from "@/components/nav";
import { useAtlasStore } from "@/components/local-store";
import { useI18n } from "@/lib/i18n";
import { atlasCaseSellPrice, formatMoney } from "@/lib/pricing";

type SheetLine = { productId: string; yourPrice: number };

export default function DealSheetPage() {
  const { t } = useI18n();
  const { store } = useAtlasStore();
  const repName = store.routeSellers[0]?.name ?? "Atlas Rep";
  const [lines, setLines] = useState<SheetLine[]>([]);

  const approved = useMemo(
    () =>
      [...store.products.filter((product) => product.status === "approved")].sort(
        (a, b) => Number(Boolean(b.promotion)) - Number(Boolean(a.promotion))
      ),
    [store.products]
  );

  function wholesale(productId: string) {
    const product = store.products.find((item) => item.id === productId);
    return product ? atlasCaseSellPrice(product.supplierCost, store.pricingSettings) : 0;
  }

  function toggle(productId: string) {
    setLines((current) => {
      if (current.some((line) => line.productId === productId)) {
        return current.filter((line) => line.productId !== productId);
      }
      const defaultPrice = Math.round(wholesale(productId) * 1.2 * 100) / 100;
      return [...current, { productId, yourPrice: defaultPrice }];
    });
  }

  function setPrice(productId: string, yourPrice: number) {
    setLines((current) =>
      current.map((line) => (line.productId === productId ? { ...line, yourPrice: Math.max(0, yourPrice) } : line))
    );
  }

  const sheetProducts = lines
    .map((line) => ({ line, product: store.products.find((item) => item.id === line.productId) }))
    .filter((entry): entry is { line: SheetLine; product: NonNullable<typeof entry.product> } => Boolean(entry.product));

  return (
    <>
      <div className="print:hidden">
        <Nav />
      </div>
      <main className="atlas-container grid gap-6 py-8">
        <div className="print:hidden">
          <Link className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-atlas-blue" href="/dashboard/route-seller">
            <ArrowLeft size={16} />
            {t("routeSellerDashboard")}
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black text-atlas-navy">{t("dealSheetTitle")}</h1>
              <p className="mt-1 text-slate-600">{t("dealSheetBody")}</p>
            </div>
            <button className="btn-primary" type="button" onClick={() => window.print()} disabled={sheetProducts.length === 0}>
              <Printer size={16} />
              {t("printSheet")}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr] print:block">
          <section className="panel p-5 print:hidden">
            <h2 className="text-lg font-black text-atlas-navy">{t("selectProductsLabel")}</h2>
            <div className="mt-4 grid gap-3">
              {approved.map((product) => {
                const selected = lines.some((line) => line.productId === product.id);
                return (
                  <div key={product.id} className={`flex items-center gap-3 rounded-lg border p-3 ${selected ? "border-atlas-blue bg-sky-50" : "border-slate-200"}`}>
                    <img alt={product.brand} className="h-12 w-12 rounded-md border border-slate-200 object-cover" src={product.imageUrl} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-atlas-navy">{product.brand}</p>
                      <p className="truncate text-xs text-slate-600">{product.description}</p>
                      <p className="text-xs font-semibold text-slate-500">
                        {t("atlasWholesaleLabel")}: {formatMoney(wholesale(product.id))} {t("perCaseLabel")}
                        {product.promotion ? ` • ${product.promotion}` : ""}
                      </p>
                    </div>
                    <button
                      className={selected ? "btn-secondary px-3" : "btn-primary px-3"}
                      type="button"
                      onClick={() => toggle(product.id)}
                      aria-label={selected ? t("removeLabel") : t("addToSheet")}
                    >
                      {selected ? <Check size={16} /> : <Plus size={16} />}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel overflow-hidden p-0 print:border-0 print:shadow-none">
            <div className="bg-atlas-navy px-6 py-5 text-white print:bg-atlas-navy">
              <p className="text-sm font-black uppercase tracking-wide text-sky-300">Atlas Discount</p>
              <h2 className="mt-1 text-2xl font-black">{t("dealSheetPrintHeading")}</h2>
              <p className="mt-1 text-sm text-sky-100">{t("preparedByLabel")}: {repName}</p>
            </div>
            {sheetProducts.length === 0 ? (
              <p className="p-6 text-sm text-slate-600">{t("dealSheetEmpty")}</p>
            ) : (
              <div className="divide-y divide-slate-200">
                {sheetProducts.map(({ line, product }) => (
                  <div key={product.id} className="flex items-center gap-4 p-4">
                    <img alt={product.brand} className="h-16 w-16 rounded-md border border-slate-200 object-cover" src={product.imageUrl} />
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-atlas-navy">{product.brand}</p>
                      <p className="text-sm text-slate-600">{product.description}</p>
                      <p className="text-xs font-semibold text-slate-500">{product.casePack} / {t("casePack").toLowerCase()}{product.promotion ? ` • ${product.promotion}` : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold uppercase text-slate-500">{t("yourPriceLabel")}</p>
                      <div className="flex items-center justify-end gap-1 print:hidden">
                        <span className="text-slate-500">$</span>
                        <input
                          className="field h-9 min-h-9 w-24 text-right"
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.yourPrice}
                          onChange={(event) => setPrice(product.id, Number(event.target.value))}
                        />
                      </div>
                      <p className="hidden text-2xl font-black text-atlas-navy print:block">{formatMoney(line.yourPrice)}</p>
                      <p className="text-xs text-slate-500">{t("perCaseLabel")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 border-t border-slate-200 bg-atlas-light px-6 py-4 text-sm text-slate-600">
              <Tag size={15} className="text-atlas-blue" />
              {t("dealSheetFooter")}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
