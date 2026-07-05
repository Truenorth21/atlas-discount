"use client";

import Link from "next/link";
import { ArrowLeft, BadgePercent, CalendarDays, ShoppingCart, Tag } from "lucide-react";
import { Nav } from "@/components/nav";
import { ProductImage } from "@/components/product-image";
import { useAtlasStore } from "@/components/local-store";
import { useI18n } from "@/lib/i18n";
import type { Product } from "@/lib/types";

export default function WeeklyDealsPage() {
  const { t } = useI18n();
  const { store } = useAtlasStore();
  const approved = store.products.filter((product) => product.status === "approved");
  const deals = [...approved.filter((product) => product.promotion || product.placements?.homepageFeatured), ...approved]
    .filter((product, index, list) => list.findIndex((item) => item.id === product.id) === index)
    .slice(0, 12);

  return <>
    <Nav />
    <main className="min-h-screen bg-atlas-light pb-16">
      <section className="border-b-[8px] border-yellow-400 bg-atlas-navy text-white">
        <div className="atlas-container py-10 sm:py-14">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white"><ArrowLeft size={17} />{t("catalog")}</Link>
          <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded bg-yellow-300 px-3 py-2 text-xs font-black uppercase text-atlas-navy"><BadgePercent size={16} />{t("weeklyPromos")}</span>
              <h1 className="mt-5 text-5xl font-black uppercase leading-none sm:text-7xl">{t("weeklyDeals")}</h1>
              <p className="mt-4 max-w-2xl text-lg text-slate-300">{t("weeklyDealsBody")}</p>
            </div>
            <div className="flex items-center gap-3 border border-white/20 bg-white/5 p-4 text-sm font-bold"><CalendarDays className="text-yellow-300" />{t("featuredThisWeek")}</div>
          </div>
        </div>
      </section>

      <section className="atlas-container py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {deals.map((product, index) => <DealTile key={product.id} product={product} index={index} memberPricing={t("memberPricing")} viewDeal={t("seeWeeklyDeals")} />)}
        </div>
        {!deals.length && <div className="border border-slate-200 bg-white p-12 text-center"><Tag className="mx-auto text-slate-300" size={38} /><h2 className="mt-4 text-2xl font-black text-atlas-navy">{t("weeklyDeals")}</h2><p className="mt-2 text-slate-600">{t("weeklyDealsBody")}</p></div>}
        <div className="mt-8 border-t border-slate-300 pt-5 text-xs font-semibold text-slate-500">Promotional availability is subject to inventory. Final case pricing appears for approved business members.</div>
      </section>
    </main>
  </>;
}

function DealTile({ product, index, memberPricing, viewDeal }: { product: Product; index: number; memberPricing: string; viewDeal: string }) {
  const badge = product.promotion || (index < 4 ? "Weekly deal" : "Featured");
  return <article className="group relative flex flex-col overflow-hidden border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
    <span className="absolute left-3 top-3 z-10 bg-atlas-red px-3 py-1.5 text-[11px] font-black uppercase text-white">{badge}</span>
    <div className="aspect-[4/3] overflow-hidden border-b border-slate-200 bg-white"><ProductImage product={product} className="h-full w-full transition duration-300 group-hover:scale-105" iconSize={40} /></div>
    <div className="flex flex-1 flex-col p-5">
      <p className="text-xs font-black uppercase text-atlas-blue">{product.brand}</p>
      <h2 className="mt-1 text-lg font-black text-atlas-navy">{product.productName || product.description}</h2>
      <p className="mt-2 text-sm font-semibold text-slate-500">{product.casePack} units / case · MOQ {Math.max(1, product.moq || 1)} cases</p>
      <div className="mt-auto flex items-end justify-between gap-3 pt-6">
        <div><p className="text-xs font-black uppercase text-slate-400">{memberPricing}</p><p className="text-lg font-black text-atlas-red">Sign in to unlock</p></div>
        <Link href={`/catalog?q=${encodeURIComponent(product.sku || product.brand)}`} className="flex h-11 w-11 items-center justify-center bg-atlas-navy text-white" aria-label={viewDeal}><ShoppingCart size={18} /></Link>
      </div>
    </div>
  </article>;
}
