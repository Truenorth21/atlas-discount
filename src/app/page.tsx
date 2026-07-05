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
  "Janitorial / Cleaning Supplies": "commercial cleaning products wholesale",
  "Grocery / Pantry": "grocery pantry products cases",
  "Health & Beauty (HBA)": "health beauty products wholesale",
  "Office / Paper": "paper products wholesale warehouse",
  "Foodservice / Disposables": "foodservice disposable products cases",
  "Closeout / Special buys": "warehouse closeout merchandise pallets"
};

export default function HomePage() {
  const { t } = useI18n();
  const { store } = useAtlasStore();
  const approved = store.products.filter((product) => product.status === "approved");
  const featured = [...approved.filter((product) => product.placements?.homepageFeatured), ...approved].filter((product, index, list) => list.findIndex((item) => item.id === product.id) === index).slice(0, 8);

  return <>
    <Nav />
    <main className="bg-white">
      <section className="relative overflow-hidden bg-[#0757d3] text-white">
        <img src={stockImage("wholesale grocery products cases pallet", 1900, 920, 44)} alt="Wholesale grocery and household products" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,55,175,.97)_0%,rgba(7,75,210,.88)_48%,rgba(16,25,74,.42)_100%)]" />
        <div className="atlas-container relative min-h-[600px] py-14 sm:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase text-yellow-300">{t("heroEyebrow2")}</p>
            <h1 className="mt-3 text-5xl font-black leading-[.95] sm:text-7xl">Atlas Discount</h1>
            <p className="mt-5 max-w-2xl text-2xl font-bold leading-tight sm:text-3xl">{t("heroHeadline2")}</p>
            <p className="mt-4 max-w-xl text-base leading-7 text-blue-50">{t("heroBody2")}</p>
            <form action="/catalog" className="mt-7 flex max-w-2xl rounded-md bg-white p-1.5 shadow-2xl">
              <Search className="ml-3 self-center text-slate-400" size={20} />
              <input name="q" className="h-12 min-w-0 flex-1 border-0 bg-transparent px-3 text-atlas-navy outline-none" placeholder={t("portalSearchPlaceholder")} aria-label={t("portalSearchPlaceholder")} />
              <button className="rounded bg-atlas-navy px-6 text-sm font-black text-white" type="submit">{t("searchButton")}</button>
            </form>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/deals" className="inline-flex min-h-12 items-center gap-2 rounded-md bg-yellow-300 px-7 font-black text-atlas-navy shadow-lg transition hover:bg-white"><ShoppingCart size={18} />{t("shopDeals")}</Link>
              <Link href="/register/buyer" className="inline-flex min-h-12 items-center gap-2 rounded-md border-2 border-white bg-white/10 px-7 font-black text-white transition hover:bg-white hover:text-atlas-navy">{t("becomeMember")}<ArrowRight size={18} /></Link>
            </div>
          </div>

          <div className="mt-12 grid overflow-hidden rounded-lg bg-white text-atlas-navy shadow-2xl md:grid-cols-3 lg:absolute lg:inset-x-8 lg:bottom-0 lg:translate-y-1/2">
            <Benefit icon={<Boxes />} title={t("featMixedTitle")} body={t("featMixedBody")} />
            <Benefit icon={<Truck />} title={t("featPickupTitle")} body={t("featPickupBody")} />
            <Benefit icon={<CheckCircle2 />} title={t("featVerifiedTitle")} body={t("featVerifiedBody")} />
          </div>
        </div>
      </section>

      <section className="atlas-container pt-16 lg:pt-32">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-black uppercase text-atlas-blue">{t("catalog")}</p><h2 className="mt-2 text-4xl font-black text-atlas-navy">{t("shopByCategory")}</h2><p className="mt-2 text-slate-600">{t("shopByCategoryBody")}</p></div>
          <Link href="/catalog" className="inline-flex items-center gap-2 font-black text-atlas-blue">{t("allProducts")}<ArrowRight size={17} /></Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(productCategories).map(([name, subs], index) => <Link key={name} href={`/catalog?category=${encodeURIComponent(name)}` as NextRoute} className="group relative min-h-56 overflow-hidden rounded-lg bg-atlas-navy">
            <img src={stockImage(categoryPhotos[name] || name, 900, 600, index + 70)} alt={name} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-atlas-navy via-atlas-navy/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white"><div><h3 className="text-xl font-black">{name}</h3><p className="mt-1 text-xs font-semibold text-blue-100">{subs.length} {t("subcategoriesLabel")}</p></div><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-atlas-navy"><ArrowRight size={19} /></span></div>
          </Link>)}
        </div>
      </section>

      <section className="mt-16 bg-atlas-light py-16">
        <div className="atlas-container">
          <div className="overflow-hidden rounded-lg border-[6px] border-yellow-300 bg-[#0757d3] shadow-xl">
            <div className="grid lg:grid-cols-[.8fr_1.2fr]">
              <div className="flex flex-col justify-center p-7 text-white sm:p-10">
                <span className="inline-flex w-fit items-center gap-2 rounded bg-yellow-300 px-3 py-2 text-xs font-black uppercase text-atlas-navy"><BadgePercent size={16} />{t("weeklyPromos")}</span>
                <h2 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">{t("weeklyDeals")}</h2>
                <p className="mt-3 max-w-md text-blue-100">{t("weeklyDealsBody")}</p>
                <Link href="/deals" className="mt-7 inline-flex min-h-12 w-fit items-center gap-2 rounded-md bg-white px-7 font-black text-atlas-navy">{t("seeWeeklyDeals")}<ArrowRight size={18} /></Link>
              </div>
              <div className="grid grid-cols-2 bg-white sm:grid-cols-4">
                {featured.slice(0, 4).map((product) => <FlyerProduct key={product.id} product={product} />)}
                {!featured.length && <img src={stockImage("wholesale grocery cleaning household products", 1200, 700, 94)} alt="Wholesale weekly promotions" className="col-span-2 h-full min-h-80 w-full object-cover sm:col-span-4" />}
              </div>
            </div>
          </div>
        </div>
      </section>

      {featured.length > 0 && <section className="atlas-container py-16">
        <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase text-atlas-blue">{t("featuredThisWeek")}</p><h2 className="mt-2 text-4xl font-black text-atlas-navy">{t("weeklyDeals")}</h2></div><Link href="/deals" className="hidden items-center gap-2 font-black text-atlas-blue sm:inline-flex">{t("seeWeeklyDeals")}<ArrowRight size={17} /></Link></div>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{featured.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>}

      <section className="border-y border-slate-200 bg-white py-16">
        <div className="atlas-container">
          <div className="text-center"><p className="text-xs font-black uppercase text-atlas-blue">{t("buyerAccount")}</p><h2 className="mt-2 text-4xl font-black text-atlas-navy">{t("chooseYourPathBody")}</h2></div>
          <div className="mx-auto mt-10 grid max-w-5xl md:grid-cols-3">
            <Step number="1" title={t("uploadResale")} body={t("featVerifiedBody")} />
            <Step number="2" title={t("unlockPricing")} body={t("memberBody")} />
            <Step number="3" title={t("requestFulfillment")} body={t("featPickupBody")} />
          </div>
          <div className="mt-9 text-center"><Link href="/register/buyer" className="btn-primary min-h-12 px-8">{t("becomeMember")}<ArrowRight size={18} /></Link></div>
        </div>
      </section>

      <section className="bg-atlas-navy py-16 text-white"><div className="atlas-container grid items-center gap-8 lg:grid-cols-[1fr_auto]">
        <div><p className="text-xs font-black uppercase text-yellow-300">{t("salesPartnerLabel")}</p><h2 className="mt-2 text-4xl font-black">{t("selr")}</h2><p className="mt-3 max-w-3xl text-slate-200">{t("selrBody")}</p><div className="mt-6 flex flex-wrap gap-5 text-sm font-bold text-blue-100"><span className="flex items-center gap-2"><MapPin size={17} />{t("chooseRoute")}</span><span className="flex items-center gap-2"><Users size={17} />{t("supportReorders")}</span></div></div>
        <Link href="/register/route-seller" className="inline-flex min-h-12 items-center gap-2 rounded-md bg-yellow-300 px-7 font-black text-atlas-navy">{t("joinSelr")}<ArrowRight size={18} /></Link>
      </div></section>
    </main>
    <Footer />
  </>;
}

function Benefit({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) { return <div className="flex gap-4 border-b border-slate-200 p-6 last:border-0 md:border-b-0 md:border-r"><span className="text-atlas-blue">{icon}</span><div><p className="font-black">{title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{body}</p></div></div>; }
function Step({ number, title, body }: { number: string; title: string; body: string }) { return <div className="relative border-b border-slate-200 p-7 text-center last:border-0 md:border-b-0 md:border-r"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-atlas-blue text-xl font-black text-white">{number}</span><h3 className="mt-5 text-xl font-black text-atlas-navy">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{body}</p></div>; }
function FlyerProduct({ product }: { product: Product }) { const { t } = useI18n(); return <Link href={`/catalog?q=${encodeURIComponent(product.sku || product.brand)}` as NextRoute} className="group flex min-h-80 flex-col border-b border-r border-slate-200 bg-white p-3"><div className="aspect-square overflow-hidden"><ProductImage product={product} className="h-full w-full transition group-hover:scale-105" iconSize={34} /></div><p className="mt-2 text-[10px] font-black uppercase text-atlas-blue">{product.brand}</p><p className="line-clamp-2 text-xs font-bold text-atlas-navy">{product.productName || product.description}</p><p className="mt-auto pt-2 text-sm font-black text-atlas-red">{t("memberPricing")}</p></Link>; }
function ProductCard({ product }: { product: Product }) { const { t } = useI18n(); return <Link href={`/catalog?q=${encodeURIComponent(product.sku || product.brand)}` as NextRoute} className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-atlas-blue hover:shadow-xl"><div className="aspect-square overflow-hidden bg-white"><ProductImage product={product} className="h-full w-full transition duration-300 group-hover:scale-105" iconSize={38} /></div><div className="flex flex-1 flex-col border-t p-4"><p className="text-xs font-black uppercase text-atlas-blue">{product.brand}</p><p className="mt-1 line-clamp-2 text-sm font-bold text-atlas-navy">{product.productName || product.description}</p><p className="mt-2 text-xs font-semibold text-slate-500">{product.casePack} {t("perCaseUnits")}</p><p className="mt-auto pt-3 font-black text-atlas-red">{t("memberPricing")} →</p></div></Link>; }
function Footer() { const { t } = useI18n(); return <footer className="border-t border-slate-200 bg-white"><div className="atlas-container grid gap-8 py-10 md:grid-cols-[1.4fr_1fr_1fr]"><div><AtlasMark tone="navy" /><p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">{t("brandSubline")}</p></div><div><p className="text-xs font-black uppercase text-slate-400">{t("footerShop")}</p><Link href="/catalog" className="mt-3 block text-sm font-bold text-atlas-navy">{t("catalog")}</Link></div><div><p className="text-xs font-black uppercase text-slate-400">{t("footerJoin")}</p><Link href="/login" className="mt-3 block text-sm font-bold text-atlas-navy">{t("signIn")}</Link></div></div><div className="border-t"><div className="atlas-container py-5 text-xs text-slate-500">{t("footerRights")}</div></div></footer>; }
