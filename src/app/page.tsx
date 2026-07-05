"use client";

import Link from "next/link";
import type { Route as NextRoute } from "next";
import { ArrowRight, BadgePercent, Boxes, CheckCircle2, MapPin, Search, ShoppingCart, Truck, Users } from "lucide-react";
import { AtlasMark } from "@/components/atlas-logo";
import { useAtlasStore } from "@/components/local-store";
import { Nav } from "@/components/nav";
import { ProductImage } from "@/components/product-image";
import { productCategories, stockImage } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import type { Product } from "@/lib/types";

const categoryPhotos: Record<string, string> = {
  "Janitorial / Cleaning Supplies": "commercial cleaning supplies cases warehouse",
  "Grocery / Pantry": "grocery pantry products cases wholesale",
  "Health & Beauty (HBA)": "health beauty products retail shelf",
  "Office / Paper": "paper products wholesale warehouse",
  "Foodservice / Disposables": "foodservice disposables wholesale cases",
  "Closeout / Special buys": "closeout merchandise pallets warehouse"
};

export default function HomePage() {
  const { t } = useI18n();
  const { store } = useAtlasStore();
  const approved = store.products.filter((product) => product.status === "approved");
  const featured = [...approved.filter((product) => product.placements?.homepageFeatured), ...approved]
    .filter((product, index, list) => list.findIndex((item) => item.id === product.id) === index)
    .slice(0, 8);

  return <>
    <Nav />
    <main className="bg-[#f6f4ef]">
      <section className="relative min-h-[540px] overflow-hidden bg-atlas-navy text-white">
        <img src={stockImage("wholesale grocery household products warehouse pallet", 1900, 900, 44)} alt="Wholesale products prepared for retail distribution" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-black/55" />
        <div className="atlas-container relative flex min-h-[540px] items-center py-12">
          <div className="max-w-3xl border-l-[10px] border-yellow-300 pl-6 sm:pl-9">
            <p className="text-sm font-black uppercase text-yellow-300">{t("heroEyebrow2")}</p>
            <h1 className="mt-3 max-w-2xl text-5xl font-black leading-[.94] sm:text-7xl">Stock your shelves. Grow your margin.</h1>
            <p className="mt-5 max-w-xl text-lg font-semibold leading-7 text-white/90">Case, pallet, and mixed-SKU wholesale buying with Miami and Orlando fulfillment.</p>
            <form action="/catalog" className="mt-7 flex max-w-2xl bg-white p-1 shadow-2xl">
              <Search className="ml-4 self-center text-slate-400" size={20} />
              <input name="q" className="h-13 min-w-0 flex-1 border-0 bg-transparent px-3 text-atlas-navy outline-none" placeholder={t("portalSearchPlaceholder")} aria-label={t("portalSearchPlaceholder")} />
              <button className="bg-atlas-blue px-5 text-sm font-black text-white sm:px-8" type="submit">{t("searchButton")}</button>
            </form>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/deals" className="inline-flex min-h-12 items-center gap-2 bg-yellow-300 px-7 font-black text-atlas-navy transition hover:bg-white"><BadgePercent size={18} />{t("shopDeals")}</Link>
              <Link href="/register/buyer" className="inline-flex min-h-12 items-center gap-2 border-2 border-white px-7 font-black text-white transition hover:bg-white hover:text-atlas-navy">{t("becomeMember")}<ArrowRight size={18} /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-white">
        <div className="atlas-container grid md:grid-cols-3">
          <Benefit icon={<Boxes />} title="Mixed cases welcome" body="Build one order across multiple products." />
          <Benefit icon={<Truck />} title="Pickup or delivery" body="Choose Miami, Orlando, local delivery, or freight." />
          <Benefit icon={<CheckCircle2 />} title="Verified wholesale" body="Business-only pricing from approved suppliers." />
        </div>
      </section>

      <section className="atlas-container py-12">
        <div className="flex items-end justify-between gap-4 border-b-4 border-atlas-navy pb-4">
          <div><p className="text-xs font-black uppercase text-atlas-blue">Shop inventory</p><h2 className="mt-1 text-3xl font-black text-atlas-navy sm:text-4xl">Buy by category</h2></div>
          <Link href="/catalog" className="inline-flex items-center gap-2 text-sm font-black text-atlas-blue">{t("allProducts")}<ArrowRight size={17} /></Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
          {Object.entries(productCategories).map(([name, subs], index) => <Link key={name} href={`/catalog?category=${encodeURIComponent(name)}` as NextRoute} className="group relative aspect-[4/5] overflow-hidden bg-atlas-navy">
            <img src={stockImage(categoryPhotos[name] || name, 650, 800, index + 70)} alt={name} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/35" />
            <div className="absolute inset-x-0 bottom-0 bg-atlas-navy/90 p-4 text-white"><h3 className="text-sm font-black leading-tight">{name}</h3><p className="mt-1 text-[11px] font-semibold text-white/65">{subs.length} departments</p></div>
          </Link>)}
        </div>
      </section>

      <section className="bg-atlas-navy py-12 text-white">
        <div className="atlas-container">
          <div className="grid gap-8 lg:grid-cols-[340px_1fr] lg:items-stretch">
            <div className="flex flex-col justify-center border-l-8 border-yellow-300 pl-6">
              <span className="text-xs font-black uppercase text-yellow-300">{t("weeklyPromos")}</span>
              <h2 className="mt-3 text-5xl font-black leading-none">This week’s best buys.</h2>
              <p className="mt-4 text-sm leading-6 text-white/70">Limited-time supplier promotions, closeouts, and volume opportunities selected for independent retailers.</p>
              <Link href="/deals" className="mt-6 inline-flex min-h-12 w-fit items-center gap-2 bg-atlas-blue px-6 font-black text-white">{t("seeWeeklyDeals")}<ArrowRight size={18} /></Link>
            </div>
            <div className="grid grid-cols-2 gap-px bg-white/15 sm:grid-cols-4">
              {featured.slice(0, 4).map((product) => <DealTile key={product.id} product={product} />)}
              {!featured.length && <img src={stockImage("wholesale grocery beverage cleaning product cases", 1200, 640, 94)} alt="Wholesale weekly promotions" className="col-span-2 h-full min-h-80 w-full object-cover sm:col-span-4" />}
            </div>
          </div>
        </div>
      </section>

      {featured.length > 0 && <section className="bg-white py-12">
        <div className="atlas-container">
          <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase text-atlas-blue">Fast-moving inventory</p><h2 className="mt-1 text-3xl font-black text-atlas-navy sm:text-4xl">Popular with retailers</h2></div><Link href="/catalog" className="hidden items-center gap-2 text-sm font-black text-atlas-blue sm:inline-flex">Shop all inventory<ArrowRight size={17} /></Link></div>
          <div className="mt-6 grid grid-cols-2 gap-px bg-slate-200 md:grid-cols-4">{featured.slice(0, 4).map((product) => <ProductTile key={product.id} product={product} />)}</div>
        </div>
      </section>}

      <section className="border-y border-black/10 bg-[#f6f4ef] py-12">
        <div className="atlas-container grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div><p className="text-xs font-black uppercase text-atlas-blue">Wholesale access</p><h2 className="mt-2 text-4xl font-black leading-tight text-atlas-navy">From registration to restock in three clear steps.</h2><p className="mt-3 max-w-lg text-slate-600">Apply once, verify your business, then shop by case or pallet whenever your shelves need replenishment.</p><Link href="/register/buyer" className="btn-primary mt-6">{t("becomeMember")}<ArrowRight size={18} /></Link></div>
          <div className="divide-y divide-black/10 border-y border-black/10 bg-white">
            <Step number="01" title={t("uploadResale")} body="Create your business account and upload the required documents." />
            <Step number="02" title={t("unlockPricing")} body="Atlas reviews your account and unlocks wholesale pricing." />
            <Step number="03" title={t("requestFulfillment")} body="Build a mixed order, choose fulfillment, and submit." />
          </div>
        </div>
      </section>

      <section className="bg-atlas-blue py-10 text-white"><div className="atlas-container flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div><p className="text-xs font-black uppercase text-yellow-300">{t("salesPartnerLabel")}</p><h2 className="mt-1 text-3xl font-black">Bring Atlas products to retailers in your territory.</h2><p className="mt-2 max-w-2xl text-sm text-white/80">Approved route sellers build local relationships, support reorders, and earn commission.</p></div>
        <Link href="/register/route-seller" className="inline-flex min-h-12 shrink-0 items-center gap-2 bg-white px-7 font-black text-atlas-navy">{t("joinSelr")}<ArrowRight size={18} /></Link>
      </div></section>
    </main>
    <Footer />
  </>;
}

function Benefit({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return <div className="flex gap-4 border-b border-black/10 py-5 last:border-0 md:border-b-0 md:border-r md:px-6 md:first:pl-0"><span className="text-atlas-blue">{icon}</span><div><p className="font-black text-atlas-navy">{title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{body}</p></div></div>;
}
function Step({ number, title, body }: { number: string; title: string; body: string }) {
  return <div className="grid grid-cols-[56px_1fr] gap-4 p-5"><span className="text-2xl font-black text-atlas-blue">{number}</span><div><h3 className="font-black text-atlas-navy">{title}</h3><p className="mt-1 text-sm text-slate-600">{body}</p></div></div>;
}
function DealTile({ product }: { product: Product }) {
  const { t } = useI18n();
  return <Link href={`/catalog?q=${encodeURIComponent(product.sku || product.brand)}` as NextRoute} className="group flex min-h-80 flex-col bg-white p-3 text-atlas-navy"><div className="aspect-square overflow-hidden bg-[#f6f4ef]"><ProductImage product={product} className="h-full w-full transition duration-300 group-hover:scale-105" iconSize={34} /></div><p className="mt-3 text-[10px] font-black uppercase text-atlas-blue">{product.brand}</p><p className="line-clamp-2 text-sm font-black">{product.productName || product.description}</p><p className="mt-1 text-xs text-slate-500">{product.casePack} {t("perCaseUnits")}</p><p className="mt-auto pt-3 text-sm font-black text-atlas-red">{t("memberPricing")} →</p></Link>;
}
function ProductTile({ product }: { product: Product }) {
  const { t } = useI18n();
  return <Link href={`/catalog?q=${encodeURIComponent(product.sku || product.brand)}` as NextRoute} className="group flex min-h-[360px] flex-col bg-white p-4"><div className="aspect-square overflow-hidden bg-[#f6f4ef]"><ProductImage product={product} className="h-full w-full transition duration-300 group-hover:scale-105" iconSize={38} /></div><p className="mt-3 text-[10px] font-black uppercase text-atlas-blue">{product.brand}</p><p className="line-clamp-2 font-black text-atlas-navy">{product.productName || product.description}</p><p className="mt-1 text-xs font-semibold text-slate-500">Case pack: {product.casePack}</p><p className="mt-auto pt-3 font-black text-atlas-red">{t("memberPricing")} →</p></Link>;
}
function Footer() {
  const { t } = useI18n();
  return <footer className="bg-[#0b0d12] text-white"><div className="atlas-container grid gap-8 py-10 md:grid-cols-[1.4fr_1fr_1fr]"><div><AtlasMark tone="white" /><p className="mt-4 max-w-sm text-sm leading-6 text-white/60">{t("brandSubline")}</p></div><div><p className="text-xs font-black uppercase text-white/40">{t("footerShop")}</p><Link href="/catalog" className="mt-3 block text-sm font-bold">{t("catalog")}</Link><Link href="/deals" className="mt-2 block text-sm font-bold">{t("weeklyDeals")}</Link></div><div><p className="text-xs font-black uppercase text-white/40">{t("footerJoin")}</p><Link href="/login" className="mt-3 block text-sm font-bold">{t("signIn")}</Link></div></div><div className="border-t border-white/10"><div className="atlas-container py-5 text-xs text-white/45">{t("footerRights")}</div></div></footer>;
}
