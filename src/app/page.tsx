"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import type { Route as NextRoute } from "next";
import {
  Apple,
  ArrowRight,
  BadgePercent,
  Boxes,
  CheckCircle2,
  Clock,
  FileText,
  HeartPulse,
  Lock,
  Megaphone,
  MessageCircle,
  PackageSearch,
  Repeat2,
  Search,
  ShieldCheck,
  Sparkles,
  SprayCan,
  Tag,
  Truck,
  UtensilsCrossed,
} from "lucide-react";

import { AtlasMark } from "@/components/atlas-logo";
import { useAtlasStore } from "@/components/local-store";
import { Nav } from "@/components/nav";
import { ProductImage } from "@/components/product-image";
import { Reveal } from "@/components/reveal";
import type { Product } from "@/lib/types";
import { productCategories } from "@/lib/data";
import { type TranslationKey, useI18n } from "@/lib/i18n";

// Real catalog categories (kept in sync with productCategories in lib/data.ts) so
// every tile deep-links into a filtered catalog.
const homeCategories = Object.entries(productCategories).map(([name, subcategories]) => {
  const icons: Record<string, { icon: typeof SprayCan; grad: string }> = {
    "Janitorial / Cleaning Supplies": { icon: SprayCan, grad: "from-sky-500 to-atlas-blue" },
    "Grocery / Pantry": { icon: Apple, grad: "from-amber-400 to-orange-500" },
    "Health & Beauty (HBA)": { icon: HeartPulse, grad: "from-rose-400 to-pink-500" },
    "Office / Paper": { icon: FileText, grad: "from-violet-400 to-violet-600" },
    "Foodservice / Disposables": { icon: UtensilsCrossed, grad: "from-emerald-400 to-emerald-600" },
    "Closeout / Special buys": { icon: BadgePercent, grad: "from-rose-500 to-atlas-red" }
  };
  const style = icons[name] ?? { icon: Boxes, grad: "from-slate-400 to-slate-600" };
  return { name, count: String(subcategories.length), icon: style.icon, grad: style.grad };
});

const featureCards: { icon: typeof ShieldCheck; titleKey: TranslationKey; bodyKey: TranslationKey }[] = [
  { icon: ShieldCheck, titleKey: "featVerifiedTitle", bodyKey: "featVerifiedBody" },
  { icon: Clock, titleKey: "featWeeklyTitle", bodyKey: "featWeeklyBody" },
  { icon: Repeat2, titleKey: "featBuyAgainTitle", bodyKey: "featBuyAgainBody" },
  { icon: Truck, titleKey: "featPickupTitle", bodyKey: "featPickupBody" },
  { icon: MessageCircle, titleKey: "featWhatsappTitle", bodyKey: "featWhatsappBody" },
  { icon: Boxes, titleKey: "featMixedTitle", bodyKey: "featMixedBody" },
];

const darkStrip: { titleKey: TranslationKey; bodyKey: TranslationKey }[] = [
  { titleKey: "stripInventoryTitle", bodyKey: "stripInventoryBody" },
  { titleKey: "stripCrossDockTitle", bodyKey: "stripCrossDockBody" },
  { titleKey: "stripMixedTitle", bodyKey: "stripMixedBody" },
  { titleKey: "stripPaymentTitle", bodyKey: "stripPaymentBody" },
  { titleKey: "stripFulfillmentTitle", bodyKey: "stripFulfillmentBody" },
];

const roles: Array<{
  titleKey: TranslationKey;
  labelKey: TranslationKey;
  bodyKey: TranslationKey;
  points: TranslationKey[];
  href: NextRoute;
  ctaKey: TranslationKey;
  color: string;
}> = [
  {
    titleKey: "member",
    labelKey: "buyerAccount",
    bodyKey: "memberBody",
    points: ["uploadResale", "unlockPricing", "requestFulfillment"],
    href: "/register/buyer" as NextRoute,
    ctaKey: "becomeMember",
    color: "bg-atlas-navy"
  },
  {
    titleKey: "supplierPathTitle",
    labelKey: "supplierPathLabel",
    bodyKey: "supplierPathBody",
    points: ["submitDocs", "uploadSheets", "buyPlacement"],
    href: "/register/supplier" as NextRoute,
    ctaKey: "becomeSupplier",
    color: "bg-atlas-blue"
  },
  {
    titleKey: "selr",
    labelKey: "salesPartnerLabel",
    bodyKey: "selrBody",
    points: ["chooseRoute", "supportReorders", "earnCommission"],
    href: "/register/route-seller" as NextRoute,
    ctaKey: "joinSelr",
    color: "bg-atlas-red"
  },
  {
    titleKey: "fulfillmentPartnerTitle",
    labelKey: "fulfillmentPartnerLabel",
    bodyKey: "fulfillmentPartnerBody",
    points: ["supportCrossDock", "offerDeliveryCapacity", "helpBuildMixedPallets"],
    href: "/register/supplier" as NextRoute,
    ctaKey: "becomeFulfillmentPartner",
    color: "bg-slate-700"
  }
];

export default function HomePage() {
  const { t } = useI18n();
  const { store } = useAtlasStore();

  // The live catalog drives the storefront: homepage-featured products first,
  // then any other approved product, as real shoppable cards.
  const approvedProducts = store.products.filter((product) => product.status === "approved");
  const featured = [
    ...approvedProducts.filter((product) => product.placements?.homepageFeatured),
    ...approvedProducts.filter((product) => !product.placements?.homepageFeatured)
  ].slice(0, 8);

  return (
    <>
      <Nav />
      <main className="bg-atlas-light">
        {/* Modern gradient hero banner */}
        <section className="relative overflow-hidden bg-atlas-navy text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_-10%,rgba(10,99,176,0.65),transparent_55%),radial-gradient(circle_at_95%_25%,rgba(10,99,176,0.4),transparent_45%)]" />
          <div className="atlas-container relative py-16 lg:py-24">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-sky-200">
                <Tag size={13} />
                {t("heroEyebrow2")}
              </span>
              <h1 className="mt-5 text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl">
                {t("heroHeadline2")}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-sky-100/90">{t("heroBody2")}</p>

              <form action="/catalog" className="mt-8 flex max-w-2xl items-center gap-2 rounded-full bg-white p-1.5 pl-5 shadow-2xl shadow-atlas-navy/40">
                <Search size={20} className="shrink-0 text-slate-400" />
                <input
                  name="q"
                  className="h-11 flex-1 border-0 bg-transparent text-base text-atlas-navy placeholder:text-slate-400 focus:outline-none"
                  placeholder={t("portalSearchPlaceholder")}
                  aria-label={t("portalSearchPlaceholder")}
                />
                <button type="submit" className="shrink-0 rounded-full bg-atlas-blue px-6 py-2.5 text-sm font-bold text-white transition hover:bg-atlas-navy">
                  {t("searchButton")}
                </button>
              </form>

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-sky-100">
                <span className="inline-flex items-center gap-1.5"><ShieldCheck size={15} className="text-sky-300" />{t("chipVerified")}</span>
                <span className="inline-flex items-center gap-1.5"><Lock size={15} className="text-sky-300" />{t("chipMembersPricing")}</span>
                <span className="inline-flex items-center gap-1.5"><Truck size={15} className="text-sky-300" />{t("chipFulfillment")}</span>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-base font-black text-atlas-navy transition hover:bg-sky-50"
                  href="/catalog"
                >
                  {t("shopDeals")}
                  <ArrowRight size={18} />
                </Link>
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 bg-white/5 px-7 py-3 text-base font-bold text-white transition hover:bg-white/15"
                  href="/register/buyer"
                >
                  {t("becomeMember")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Shop by category — gradient tiles */}
        <Reveal>
        <section className="atlas-container py-12">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-3xl font-black text-atlas-navy">{t("shopByCategory")}</h2>
              <p className="mt-1 text-slate-600">{t("shopByCategoryBody")}</p>
            </div>
            <Link href="/catalog" className="hidden shrink-0 items-center gap-1 text-sm font-black text-atlas-blue hover:underline sm:flex">
              {t("viewAll")}
              <ArrowRight size={15} />
            </Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {homeCategories.map(({ name, count, icon: Icon, grad }) => (
              <Link
                key={name}
                href={`/catalog?category=${encodeURIComponent(name)}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-panel"
              >
                <div className={`flex h-28 items-center justify-center bg-gradient-to-br ${grad}`}>
                  <Icon size={40} className="text-white drop-shadow" />
                </div>
                <div className="flex items-center justify-between gap-2 p-4">
                  <div>
                    <h3 className="font-black text-atlas-navy">{name}</h3>
                    <p className="text-xs text-slate-500">{count ? `${count} ${t("subcategoriesLabel")}` : t("wholesaleCases")}</p>
                  </div>
                  <ArrowRight size={18} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-atlas-blue" />
                </div>
              </Link>
            ))}
          </div>
        </section>
        </Reveal>

        {/* Featured products — full-width shoppable grid */}
        {featured.length > 0 && (
          <Reveal>
          <section className="border-y border-slate-200 bg-white py-12">
            <div className="atlas-container">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-black uppercase tracking-wide text-atlas-blue">
                    <Sparkles size={15} />
                    {t("featuredThisWeek")}
                  </p>
                  <h2 className="mt-1 text-3xl font-black text-atlas-navy">{t("heroEyebrow2")}</h2>
                </div>
                <Link href="/catalog" className="hidden shrink-0 items-center gap-1 text-sm font-black text-atlas-blue hover:underline sm:flex">
                  {t("seeFullCatalog")}
                  <ArrowRight size={15} />
                </Link>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {featured.map((product) => (
                  <HomeProductCard key={product.id} product={product} />
                ))}
              </div>
              <Link
                href="/catalog"
                className="mt-6 flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white py-3 text-sm font-bold text-atlas-navy transition hover:border-atlas-blue hover:text-atlas-blue sm:hidden"
              >
                {t("seeFullCatalog")}
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>
          </Reveal>
        )}

        {/* How Atlas moves goods */}
        <section className="bg-atlas-navy py-8 text-white">
          <div className="atlas-container grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {darkStrip.map(({ titleKey, bodyKey }) => (
              <div key={titleKey}>
                <p className="text-xs font-black uppercase tracking-wide text-sky-300">{t(titleKey)}</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">{t(bodyKey)}</p>
              </div>
            ))}
          </div>
        </section>


        {/* Why Atlas */}
        <Reveal>
        <section className="atlas-container py-14">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {featureCards.map(({ icon: Icon, titleKey, bodyKey }) => (
              <div key={titleKey} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-atlas-navy text-white">
                  <Icon size={20} />
                </span>
                <h3 className="mt-4 font-black text-atlas-navy">{t(titleKey)}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{t(bodyKey)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Supplier promotions & advertising */}
        <section className="bg-white py-14">
          <div className="atlas-container">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold uppercase text-atlas-blue">
                  <Megaphone size={16} />
                  {t("promotionsEyebrow")}
                </p>
                <h2 className="mt-2 text-3xl font-black text-atlas-navy">{t("promotionsTitle")}</h2>
                <p className="mt-2 max-w-3xl text-slate-600">{t("promotionsHomeBody")}</p>
              </div>
              <Link className="btn-primary rounded-full" href="/catalog">
                {t("seeWeeklyDeals")}
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <PromoCard icon={<Tag />} title={t("weeklyDeals")} body={t("weeklyDealsBody")} />
              <PromoCard icon={<PackageSearch />} title={t("sponsoredCategories")} body={t("sponsoredCategoriesBody")} />
              <PromoCard icon={<Megaphone />} title={t("campaignTracking")} body={t("campaignTrackingBody")} />
            </div>
          </div>
        </section>

        {/* Choose your path */}
        <section className="bg-atlas-light py-14">
          <div className="atlas-container">
            <p className="text-sm font-bold uppercase text-atlas-blue">{t("chooseYourPath")}</p>
            <h2 className="mt-2 text-3xl font-black text-atlas-navy">{t("chooseYourPathBody")}</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {roles.map((role) => (
                <div key={role.titleKey} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-black uppercase text-white ${role.color}`}>
                    {t(role.labelKey)}
                  </span>
                  <h3 className="mt-3 text-2xl font-black text-atlas-navy">{t(role.titleKey)}</h3>
                  <p className="mt-2 text-sm text-slate-600">{t(role.bodyKey)}</p>
                  <ul className="mt-4 grid gap-2 text-sm text-slate-700">
                    {role.points.map((point) => (
                      <li key={point} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 shrink-0 text-atlas-blue" size={16} />
                        {t(point)}
                      </li>
                    ))}
                  </ul>
                  <Link className="btn-secondary mt-5 w-fit rounded-full" href={role.href}>
                    {t(role.ctaKey)}
                    <ArrowRight size={16} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
        </Reveal>
      </main>
      <Footer />
    </>
  );
}

function PromoCard({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-atlas-light p-5">
      <span className="text-atlas-blue">{icon}</span>
      <h3 className="mt-3 text-lg font-black text-atlas-navy">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
    </div>
  );
}

function HomeProductCard({ product }: { product: Product }) {
  const { t } = useI18n();
  return (
    <Link
      href="/catalog"
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-atlas-blue hover:shadow-panel"
    >
      <div className="aspect-square w-full overflow-hidden bg-atlas-light">
        <ProductImage product={product} className="h-full w-full" iconSize={36} />
      </div>
      <div className="flex flex-1 flex-col p-3">
        <span className="w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-600">
          {product.subcategory || product.category}
        </span>
        <p className="mt-1.5 line-clamp-1 font-black text-atlas-navy">{product.brand}</p>
        <p className="line-clamp-1 text-xs text-slate-600">{product.productName || product.description}</p>
        <p className="mt-auto flex items-center gap-1.5 pt-2 text-xs font-bold text-atlas-blue">
          <Lock size={12} />
          {t("memberPricing")}
        </p>
      </div>
    </Link>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="atlas-container grid gap-8 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <AtlasMark tone="navy" />
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-600">{t("brandSubline")}</p>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">{t("footerShop")}</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>
              <Link className="hover:text-atlas-blue" href="/catalog">
                {t("catalog")}
              </Link>
            </li>
            <li>
              <Link className="hover:text-atlas-blue" href="/sell">
                {t("sellOnAtlas")}
              </Link>
            </li>
            <li>
              <Link className="hover:text-atlas-blue" href="/playbooks">
                {t("routePlaybook")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">{t("footerJoin")}</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>
              <Link className="hover:text-atlas-blue" href="/register/buyer">
                {t("member")}
              </Link>
            </li>
            <li>
              <Link className="hover:text-atlas-blue" href="/register/supplier">
                {t("supplierPathTitle")}
              </Link>
            </li>
            <li>
              <Link className="hover:text-atlas-blue" href="/login">
                {t("signIn")}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200">
        <div className="atlas-container py-5 text-xs text-slate-500">{t("footerRights")}</div>
      </div>
    </footer>
  );
}
