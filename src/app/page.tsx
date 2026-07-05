"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  Boxes,
  CheckCircle2,
  Clock3,
  MapPin,
  Search,
  ShieldCheck,
  ShoppingCart,
  Tag,
  Truck,
  Users,
} from "lucide-react";

import { AtlasMark } from "@/components/atlas-logo";
import { useAtlasStore } from "@/components/local-store";
import { Nav } from "@/components/nav";
import { ProductImage } from "@/components/product-image";
import { Reveal } from "@/components/reveal";
import { productCategories, stockImage } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import type { Product } from "@/lib/types";

const categoryStyles = [
  "bg-sky-50 text-atlas-blue",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-700",
  "bg-violet-50 text-violet-700",
  "bg-emerald-50 text-emerald-700",
  "bg-red-50 text-atlas-red",
];

export default function HomePage() {
  const { t } = useI18n();
  const { store } = useAtlasStore();
  const approvedProducts = store.products.filter((product) => product.status === "approved");
  const featured = [
    ...approvedProducts.filter((product) => product.placements?.homepageFeatured),
    ...approvedProducts.filter((product) => !product.placements?.homepageFeatured),
  ].slice(0, 8);

  return (
    <>
      <Nav />
      <main className="bg-white">
        <section className="relative min-h-[560px] overflow-hidden bg-atlas-navy text-white">
          <img
            src={stockImage("wholesale warehouse grocery cases", 1800, 1000, 29)}
            alt="Wholesale products ready for business buyers"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-atlas-navy/82" />
          <div className="atlas-container relative grid min-h-[560px] items-center gap-10 py-14 lg:grid-cols-[1fr_420px]">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase text-sky-300">{t("heroEyebrow2")}</p>
              <h1 className="mt-3 text-5xl font-black leading-tight sm:text-6xl">Atlas Discount</h1>
              <p className="mt-4 max-w-2xl text-xl font-bold text-white">{t("heroHeadline2")}</p>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-200">{t("heroBody2")}</p>

              <form action="/catalog" className="mt-7 flex max-w-2xl items-center bg-white p-1.5 shadow-xl">
                <Search size={20} className="ml-3 shrink-0 text-slate-400" />
                <input
                  name="q"
                  className="h-11 min-w-0 flex-1 border-0 bg-transparent px-3 text-base text-atlas-navy placeholder:text-slate-400 focus:outline-none"
                  placeholder={t("portalSearchPlaceholder")}
                  aria-label={t("portalSearchPlaceholder")}
                />
                <button type="submit" className="min-h-11 bg-atlas-blue px-5 text-sm font-black text-white hover:bg-atlas-navy">
                  {t("searchButton")}
                </button>
              </form>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link className="btn-primary min-h-12 px-6" href="/catalog">
                  <ShoppingCart size={18} />
                  {t("shopDeals")}
                </Link>
                <Link className="inline-flex min-h-12 items-center gap-2 border border-white/40 bg-white px-6 py-3 font-black text-atlas-navy hover:bg-sky-50" href="/register/buyer">
                  {t("becomeMember")}
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>

            <aside className="border border-white/20 bg-white p-6 text-atlas-navy shadow-xl">
              <p className="text-xs font-black uppercase text-atlas-blue">{t("weeklyPromos")}</p>
              <div className="mt-3 flex items-start gap-3">
                <BadgePercent size={34} className="shrink-0 text-atlas-red" />
                <div>
                  <p className="text-2xl font-black">{t("weeklyDeals")}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{t("weeklyDealsBody")}</p>
                </div>
              </div>
              <Link href="/catalog" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-atlas-blue hover:underline">
                {t("seeWeeklyDeals")}
                <ArrowRight size={16} />
              </Link>
            </aside>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-atlas-light">
          <div className="atlas-container grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
            <TrustItem icon={<ShieldCheck />} title={t("featVerifiedTitle")} body={t("featVerifiedBody")} />
            <TrustItem icon={<Boxes />} title={t("featMixedTitle")} body={t("featMixedBody")} />
            <TrustItem icon={<Truck />} title={t("featPickupTitle")} body={t("featPickupBody")} />
            <TrustItem icon={<Clock3 />} title={t("featWeeklyTitle")} body={t("featWeeklyBody")} />
          </div>
        </section>

        <Reveal>
          <section className="atlas-container py-14">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase text-atlas-blue">{t("catalog")}</p>
                <h2 className="mt-1 text-3xl font-black text-atlas-navy">{t("shopByCategory")}</h2>
                <p className="mt-1 text-slate-600">{t("shopByCategoryBody")}</p>
              </div>
              <Link href="/catalog" className="hidden items-center gap-1 font-black text-atlas-blue hover:underline sm:flex">
                {t("viewAll")}
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(productCategories).map(([name, subcategories], index) => (
                <Link
                  key={name}
                  href={`/catalog?category=${encodeURIComponent(name)}`}
                  className="group flex min-h-24 items-center gap-4 border border-slate-200 bg-white p-4 transition hover:border-atlas-blue hover:shadow-panel"
                >
                  <span className={`flex h-14 w-14 shrink-0 items-center justify-center ${categoryStyles[index % categoryStyles.length]}`}>
                    <Boxes size={26} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-black text-atlas-navy">{name}</span>
                    <span className="text-xs font-semibold text-slate-500">{subcategories.length} {t("subcategoriesLabel")}</span>
                  </span>
                  <ArrowRight size={18} className="text-slate-300 group-hover:text-atlas-blue" />
                </Link>
              ))}
            </div>
          </section>
        </Reveal>

        {featured.length > 0 && (
          <Reveal>
            <section className="border-y border-slate-200 bg-atlas-light py-14">
              <div className="atlas-container">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-black uppercase text-atlas-blue">
                      <Tag size={15} />
                      {t("featuredThisWeek")}
                    </p>
                    <h2 className="mt-1 text-3xl font-black text-atlas-navy">{t("weeklyDeals")}</h2>
                  </div>
                  <Link href="/catalog" className="hidden items-center gap-1 font-black text-atlas-blue hover:underline sm:flex">
                    {t("seeFullCatalog")}
                    <ArrowRight size={16} />
                  </Link>
                </div>
                <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {featured.map((product) => <ProductCard key={product.id} product={product} />)}
                </div>
              </div>
            </section>
          </Reveal>
        )}

        <Reveal>
          <section className="atlas-container py-16">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-black uppercase text-atlas-blue">{t("buyerAccount")}</p>
              <h2 className="mt-2 text-3xl font-black text-atlas-navy">{t("chooseYourPathBody")}</h2>
            </div>
            <div className="mt-9 grid gap-px bg-slate-200 md:grid-cols-3">
              <ProcessStep number="01" icon={<ShieldCheck />} title={t("uploadResale")} body={t("featVerifiedBody")} />
              <ProcessStep number="02" icon={<ShoppingCart />} title={t("unlockPricing")} body={t("memberBody")} />
              <ProcessStep number="03" icon={<Truck />} title={t("requestFulfillment")} body={t("featPickupBody")} />
            </div>
          </section>
        </Reveal>

        <section className="bg-atlas-navy py-14 text-white">
          <div className="atlas-container grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="text-sm font-black uppercase text-sky-300">{t("salesPartnerLabel")}</p>
              <h2 className="mt-2 text-3xl font-black">{t("selr")}</h2>
              <p className="mt-3 max-w-3xl text-slate-200">{t("selrBody")}</p>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-sky-100">
                <span className="flex items-center gap-2"><MapPin size={16} />{t("chooseRoute")}</span>
                <span className="flex items-center gap-2"><Users size={16} />{t("supportReorders")}</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={16} />{t("earnCommission")}</span>
              </div>
            </div>
            <Link className="inline-flex min-h-12 items-center gap-2 bg-white px-6 py-3 font-black text-atlas-navy hover:bg-sky-50" href="/register/route-seller">
              {t("joinSelr")}
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        <section className="atlas-container grid gap-4 py-14 md:grid-cols-3">
          <PathCard title={t("member")} body={t("memberBody")} href="/register/buyer" cta={t("becomeMember")} />
          <PathCard title={t("supplierPathTitle")} body={t("supplierPathBody")} href="/register/supplier" cta={t("becomeSupplier")} />
          <PathCard title={t("selr")} body={t("selrBody")} href="/register/route-seller" cta={t("joinSelr")} />
        </section>
      </main>
      <Footer />
    </>
  );
}

function TrustItem({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-3 bg-white p-5">
      <span className="mt-0.5 text-atlas-blue">{icon}</span>
      <div><p className="font-black text-atlas-navy">{title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{body}</p></div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { t } = useI18n();
  return (
    <Link href={`/catalog?q=${encodeURIComponent(product.sku || product.brand)}`} className="group flex flex-col border border-slate-200 bg-white transition hover:border-atlas-blue hover:shadow-panel">
      <div className="aspect-square overflow-hidden bg-white"><ProductImage product={product} className="h-full w-full" iconSize={36} /></div>
      <div className="flex flex-1 flex-col border-t border-slate-100 p-4">
        <p className="text-xs font-black uppercase text-atlas-blue">{product.brand}</p>
        <p className="mt-1 line-clamp-2 text-sm font-bold text-atlas-navy">{product.productName || product.description}</p>
        <p className="mt-2 text-xs font-semibold text-slate-500">{product.casePack} {t("perCaseUnits")}</p>
        <p className="mt-auto pt-3 text-sm font-black text-atlas-blue">{t("memberPricing")} →</p>
      </div>
    </Link>
  );
}

function ProcessStep({ number, icon, title, body }: { number: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="bg-atlas-light p-7">
      <div className="flex items-center justify-between"><span className="text-atlas-blue">{icon}</span><span className="text-sm font-black text-slate-400">{number}</span></div>
      <h3 className="mt-5 text-xl font-black text-atlas-navy">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

function PathCard({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return (
    <div className="border border-slate-200 bg-white p-6">
      <h3 className="text-xl font-black text-atlas-navy">{title}</h3>
      <p className="mt-2 min-h-20 text-sm leading-6 text-slate-600">{body}</p>
      <Link href={href} className="mt-5 inline-flex items-center gap-2 font-black text-atlas-blue hover:underline">{cta}<ArrowRight size={16} /></Link>
    </div>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="atlas-container grid gap-8 py-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div><AtlasMark tone="navy" /><p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">{t("brandSubline")}</p></div>
        <div><p className="text-xs font-black uppercase text-slate-400">{t("footerShop")}</p><Link href="/catalog" className="mt-3 block text-sm font-bold text-atlas-navy hover:text-atlas-blue">{t("catalog")}</Link></div>
        <div><p className="text-xs font-black uppercase text-slate-400">{t("footerJoin")}</p><Link href="/login" className="mt-3 block text-sm font-bold text-atlas-navy hover:text-atlas-blue">{t("signIn")}</Link></div>
      </div>
      <div className="border-t border-slate-200"><div className="atlas-container py-5 text-xs text-slate-500">{t("footerRights")}</div></div>
    </footer>
  );
}
