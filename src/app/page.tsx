"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { Route as NextRoute } from "next";
import { ArrowRight, BadgePercent, Boxes, CheckCircle2, Clock3, MapPin, Search, ShieldCheck, ShoppingCart, Tag, Truck, Users } from "lucide-react";
import { AtlasMark } from "@/components/atlas-logo";
import { useAtlasStore } from "@/components/local-store";
import { Nav } from "@/components/nav";
import { ProductImage } from "@/components/product-image";
import { Reveal } from "@/components/reveal";
import { productCategories, stockImage } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import type { Product } from "@/lib/types";

const categoryStyles = ["bg-sky-50 text-atlas-blue", "bg-amber-50 text-amber-700", "bg-rose-50 text-rose-700", "bg-violet-50 text-violet-700", "bg-emerald-50 text-emerald-700", "bg-red-50 text-atlas-red"];

export default function HomePage() {
  const { t } = useI18n();
  const { store } = useAtlasStore();
  const approved = store.products.filter((product) => product.status === "approved");
  const featured = [...approved.filter((product) => product.placements?.homepageFeatured), ...approved.filter((product) => !product.placements?.homepageFeatured)].slice(0, 8);

  return (
    <>
      <Nav />
      <main className="bg-white">
        <section className="relative min-h-[610px] overflow-hidden bg-atlas-navy text-white">
          <img src={stockImage("wholesale warehouse grocery cases", 1800, 1000, 29)} alt="Wholesale products ready for business buyers" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,25,74,.96)_0%,rgba(16,25,74,.88)_48%,rgba(16,25,74,.55)_100%)]" />
          <div className="atlas-container relative grid min-h-[610px] items-center gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_390px]">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 border border-sky-300/30 bg-sky-300/10 px-3 py-2 text-xs font-black uppercase text-sky-200">
                <Tag size={15} />{t("heroEyebrow2")}
              </div>
              <h1 className="mt-5 text-5xl font-black leading-[1.02] sm:text-6xl lg:text-7xl">Atlas Discount</h1>
              <p className="mt-5 max-w-2xl text-xl font-bold leading-8 text-white sm:text-2xl">{t("heroHeadline2")}</p>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-200">{t("heroBody2")}</p>
              <form action="/catalog" className="mt-8 flex max-w-2xl items-center rounded-md bg-white p-1.5 shadow-2xl">
                <Search size={20} className="ml-3 shrink-0 text-slate-400" />
                <input name="q" className="h-12 min-w-0 flex-1 border-0 bg-transparent px-3 text-base text-atlas-navy placeholder:text-slate-400 focus:outline-none" placeholder={t("portalSearchPlaceholder")} aria-label={t("portalSearchPlaceholder")} />
                <button type="submit" className="min-h-12 rounded bg-atlas-blue px-6 text-sm font-black text-white transition hover:bg-atlas-navy">{t("searchButton")}</button>
              </form>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link className="btn-primary min-h-12 px-7" href="/catalog"><ShoppingCart size={18} />{t("shopDeals")}</Link>
                <Link className="inline-flex min-h-12 items-center gap-2 rounded-md border border-white/40 bg-white px-7 py-3 font-black text-atlas-navy shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-50" href="/register/buyer">{t("becomeMember")}<ArrowRight size={18} /></Link>
              </div>
            </div>
            <aside className="relative overflow-hidden rounded-lg bg-[#ffe500] p-7 text-atlas-navy shadow-2xl">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full border-[22px] border-white/30" />
              <p className="relative text-xs font-black uppercase">{t("weeklyPromos")}</p>
              <div className="relative mt-4 flex items-start gap-4"><BadgePercent size={42} className="shrink-0 text-atlas-red" /><div><p className="text-3xl font-black leading-tight">{t("weeklyDeals")}</p><p className="mt-2 text-sm font-semibold leading-6 text-atlas-navy/75">{t("weeklyDealsBody")}</p></div></div>
              <Link href="/catalog" className="relative mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-atlas-navy px-5 text-sm font-black text-white transition hover:bg-atlas-blue">{t("seeWeeklyDeals")}<ArrowRight size={16} /></Link>
            </aside>
          </div>
        </section>

        <section className="relative z-10 -mt-5 pb-2">
          <div className="atlas-container grid overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl sm:grid-cols-2 lg:grid-cols-4">
            <TrustItem icon={<ShieldCheck />} title={t("featVerifiedTitle")} body={t("featVerifiedBody")} />
            <TrustItem icon={<Boxes />} title={t("featMixedTitle")} body={t("featMixedBody")} />
            <TrustItem icon={<Truck />} title={t("featPickupTitle")} body={t("featPickupBody")} />
            <TrustItem icon={<Clock3 />} title={t("featWeeklyTitle")} body={t("featWeeklyBody")} />
          </div>
        </section>

        <Reveal><section className="atlas-container py-16">
          <SectionHeading eyebrow={t("catalog")} title={t("shopByCategory")} body={t("shopByCategoryBody")} />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(productCategories).map(([name, subs], index) => (
              <Link key={name} href={`/catalog?category=${encodeURIComponent(name)}` as NextRoute} className="interactive-card group flex min-h-28 items-center gap-4 p-5">
                <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-lg ${categoryStyles[index % categoryStyles.length]}`}><Boxes size={28} /></span>
                <span className="min-w-0 flex-1"><span className="block text-lg font-black text-atlas-navy">{name}</span><span className="mt-1 block text-xs font-semibold text-slate-500">{subs.length} {t("subcategoriesLabel")}</span></span>
                <ArrowRight size={20} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-atlas-blue" />
              </Link>
            ))}
          </div>
        </section></Reveal>

        {featured.length > 0 && <Reveal><section className="border-y border-slate-200 bg-atlas-light py-16"><div className="atlas-container">
          <SectionHeading eyebrow={t("featuredThisWeek")} title={t("weeklyDeals")} />
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{featured.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        </div></section></Reveal>}

        <Reveal><section className="atlas-container py-16">
          <div className="mx-auto max-w-3xl text-center"><p className="section-kicker">{t("buyerAccount")}</p><h2 className="section-title mt-2">{t("chooseYourPathBody")}</h2></div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <ProcessStep number="01" icon={<ShieldCheck />} title={t("uploadResale")} body={t("featVerifiedBody")} />
            <ProcessStep number="02" icon={<ShoppingCart />} title={t("unlockPricing")} body={t("memberBody")} />
            <ProcessStep number="03" icon={<Truck />} title={t("requestFulfillment")} body={t("featPickupBody")} />
          </div>
          <div className="mt-8 flex justify-center"><Link className="btn-primary min-h-12 px-8" href="/register/buyer">{t("becomeMember")}<ArrowRight size={18} /></Link></div>
        </section></Reveal>

        <section className="bg-atlas-navy py-16 text-white"><div className="atlas-container grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div><p className="text-sm font-black uppercase text-sky-300">{t("salesPartnerLabel")}</p><h2 className="mt-2 text-4xl font-black">{t("selr")}</h2><p className="mt-3 max-w-3xl text-slate-200">{t("selrBody")}</p><div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-sky-100"><span className="flex items-center gap-2"><MapPin size={16} />{t("chooseRoute")}</span><span className="flex items-center gap-2"><Users size={16} />{t("supportReorders")}</span><span className="flex items-center gap-2"><CheckCircle2 size={16} />{t("earnCommission")}</span></div></div>
          <Link className="inline-flex min-h-12 items-center gap-2 rounded-md bg-white px-7 py-3 font-black text-atlas-navy shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-50" href="/register/route-seller">{t("joinSelr")}<ArrowRight size={18} /></Link>
        </div></section>

        <section className="atlas-container grid gap-4 py-16 md:grid-cols-3">
          <PathCard title={t("member")} body={t("memberBody")} href="/register/buyer" cta={t("becomeMember")} />
          <PathCard title={t("supplierPathTitle")} body={t("supplierPathBody")} href="/register/supplier" cta={t("becomeSupplier")} />
          <PathCard title={t("selr")} body={t("selrBody")} href="/register/route-seller" cta={t("joinSelr")} />
        </section>
      </main>
      <Footer />
    </>
  );
}

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) { return <div><p className="section-kicker">{eyebrow}</p><h2 className="section-title mt-2">{title}</h2>{body && <p className="mt-2 max-w-2xl text-slate-600">{body}</p>}</div>; }
function TrustItem({ icon, title, body }: { icon: ReactNode; title: string; body: string }) { return <div className="flex gap-3 border-b border-slate-200 p-5 last:border-0 sm:border-b-0 sm:border-r"><span className="mt-0.5 text-atlas-blue">{icon}</span><div><p className="font-black text-atlas-navy">{title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{body}</p></div></div>; }
function ProcessStep({ number, icon, title, body }: { number: string; icon: ReactNode; title: string; body: string }) { return <div className="interactive-card relative overflow-hidden p-7"><span className="absolute right-4 top-2 text-6xl font-black text-slate-100">{number}</span><div className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-sky-50 text-atlas-blue">{icon}</div><h3 className="relative mt-6 text-xl font-black text-atlas-navy">{title}</h3><p className="relative mt-2 text-sm leading-6 text-slate-600">{body}</p></div>; }
function PathCard({ title, body, href, cta }: { title: string; body: string; href: NextRoute; cta: string }) { return <div className="interactive-card p-6"><h3 className="text-xl font-black text-atlas-navy">{title}</h3><p className="mt-2 min-h-20 text-sm leading-6 text-slate-600">{body}</p><Link href={href} className="mt-5 inline-flex items-center gap-2 font-black text-atlas-blue hover:underline">{cta}<ArrowRight size={16} /></Link></div>; }
function ProductCard({ product }: { product: Product }) { const { t } = useI18n(); return <Link href={`/catalog?q=${encodeURIComponent(product.sku || product.brand)}` as NextRoute} className="interactive-card group flex flex-col overflow-hidden"><div className="relative aspect-square overflow-hidden bg-white"><ProductImage product={product} className="h-full w-full transition duration-300 group-hover:scale-105" iconSize={36} /><span className="absolute left-3 top-3 rounded-full bg-atlas-red px-2.5 py-1 text-[10px] font-black uppercase text-white">{t("featuredThisWeek")}</span></div><div className="flex flex-1 flex-col border-t border-slate-100 p-4"><p className="text-xs font-black uppercase text-atlas-blue">{product.brand}</p><p className="mt-1 line-clamp-2 text-sm font-bold text-atlas-navy">{product.productName || product.description}</p><p className="mt-2 text-xs font-semibold text-slate-500">{product.casePack} {t("perCaseUnits")}</p><p className="mt-auto pt-3 text-sm font-black text-atlas-blue">{t("memberPricing")} →</p></div></Link>; }
function Footer() { const { t } = useI18n(); return <footer className="border-t border-slate-200 bg-white"><div className="atlas-container grid gap-8 py-10 md:grid-cols-[1.4fr_1fr_1fr]"><div><AtlasMark tone="navy" /><p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">{t("brandSubline")}</p></div><div><p className="text-xs font-black uppercase text-slate-400">{t("footerShop")}</p><Link href="/catalog" className="mt-3 block text-sm font-bold text-atlas-navy hover:text-atlas-blue">{t("catalog")}</Link></div><div><p className="text-xs font-black uppercase text-slate-400">{t("footerJoin")}</p><Link href="/login" className="mt-3 block text-sm font-bold text-atlas-navy hover:text-atlas-blue">{t("signIn")}</Link></div></div><div className="border-t border-slate-200"><div className="atlas-container py-5 text-xs text-slate-500">{t("footerRights")}</div></div></footer>; }
