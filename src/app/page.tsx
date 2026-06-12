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
  Droplets,
  FileText,
  Flame,
  HeartPulse,
  Lock,
  Megaphone,
  MessageCircle,
  Minus,
  PackageSearch,
  Plus,
  Repeat2,
  Search,
  ShieldCheck,
  Sparkles,
  SprayCan,
  Tag,
  Truck,
  UtensilsCrossed,
  Zap,
} from "lucide-react";

import { AtlasMark } from "@/components/atlas-logo";
import { useAtlasStore } from "@/components/local-store";
import { Nav } from "@/components/nav";
import { productCategories } from "@/lib/data";
import { type TranslationKey, useI18n } from "@/lib/i18n";

type PortalDeal = { name: string; pack: string; meta: string; tag: string };

const portalDeals = [
  {
    name: "Imported Cookies",
    pack: "12 units / case",
    meta: "Hialeah Gardens · Ready today · Local delivery",
    tag: "Weekly deal",
    icon: UtensilsCrossed,
    tint: "bg-amber-50 text-amber-600",
  },
  {
    name: "Energy Drinks",
    pack: "24 cans / case",
    meta: "Orlando · Pickup tomorrow · Local delivery",
    tag: "Fast mover",
    icon: Zap,
    tint: "bg-yellow-50 text-yellow-600",
  },
  {
    name: "Hot Sauce Assortment",
    pack: "12 bottles / case",
    meta: "Both hubs · Ready today · Local delivery",
    tag: "New arrival",
    icon: Flame,
    tint: "bg-rose-50 text-rose-500",
  },
  {
    name: "Coconut Water",
    pack: "12 cartons / case",
    meta: "National shipping · Supplier direct",
    tag: "Popular",
    icon: Droplets,
    tint: "bg-sky-50 text-atlas-blue",
  },
];

// Real catalog categories (kept in sync with productCategories in lib/data.ts) so
// every tile deep-links into a filtered catalog.
const homeCategories = Object.entries(productCategories).map(([name, subcategories]) => {
  const icons: Record<string, { icon: typeof SprayCan; tint: string }> = {
    "Janitorial / Cleaning Supplies": { icon: SprayCan, tint: "bg-sky-50 text-atlas-blue" },
    "Grocery / Pantry": { icon: Apple, tint: "bg-amber-50 text-amber-600" },
    "Health & Beauty (HBA)": { icon: HeartPulse, tint: "bg-rose-50 text-rose-500" },
    "Office / Paper": { icon: FileText, tint: "bg-violet-50 text-violet-500" },
    "Foodservice / Disposables": { icon: UtensilsCrossed, tint: "bg-emerald-50 text-emerald-600" },
    "Closeout / Special buys": { icon: BadgePercent, tint: "bg-red-50 text-atlas-red" }
  };
  const style = icons[name] ?? { icon: Boxes, tint: "bg-slate-100 text-slate-600" };
  return { name, count: String(subcategories.length), icon: style.icon, tint: style.tint };
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

  // Admin-controlled deals: promoted, approved products replace the mockup rows.
  // Admin edits/removes these from Marketing → Promote products (the promotion flag).
  const livePortalDeals: PortalDeal[] = store.products
    .filter((product) => product.status === "approved" && product.placements?.homepageFeatured)
    .slice(0, 4)
    .map((product) => ({
      name: product.brand || product.productName,
      pack: product.unitSize || `${product.casePack} / case`,
      meta: [product.preferredHub, product.location].filter(Boolean).join(" · ") || "Local delivery available",
      tag: product.promotion || "Featured"
    }));
  const deals: PortalDeal[] = livePortalDeals.length > 0 ? livePortalDeals : portalDeals;

  return (
    <>
      <Nav />
      <main className="bg-atlas-light">
        {/* Hero + live ordering portal */}
        <section className="bg-white">
          <div className="atlas-container grid grid-cols-1 gap-10 py-12 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:py-16">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-atlas-blue">
                <Tag size={13} />
                {t("heroEyebrow2")}
              </span>
              <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight text-atlas-navy sm:text-5xl">
                {t("heroHeadline2")}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">{t("heroBody2")}</p>
              <div className="mt-6 max-w-xl rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                <p className="flex items-center gap-2 text-sm font-black text-atlas-navy">
                  <ShieldCheck size={16} className="text-yellow-600" />
                  {t("verifyNoticeTitle")}
                </p>
                <p className="mt-1 text-sm text-slate-600">{t("verifyNoticeBody")}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-atlas-blue px-7 py-3 text-base font-bold text-white transition hover:bg-atlas-navy"
                  href="/catalog"
                >
                  {t("shopDeals")}
                  <ArrowRight size={18} />
                </Link>
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-3 text-base font-bold text-atlas-navy transition hover:border-atlas-blue hover:text-atlas-blue"
                  href="/register/buyer"
                >
                  {t("applyBusinessAccess")}
                </Link>
              </div>

              {/* Customer-focused promotions filling the left column */}
              <div className="mt-8">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">{t("shopThisWeek")}</p>
                <div className="mt-3 grid max-w-xl grid-cols-3 gap-3">
                  <PromoTile icon={<Flame size={18} />} label={t("weeklyDeals")} tint="bg-rose-50 text-rose-500" />
                  <PromoTile icon={<Tag size={18} />} label={t("promoNewArrivals")} tint="bg-sky-50 text-atlas-blue" />
                  <PromoTile icon={<BadgePercent size={18} />} label={t("promoCloseouts")} tint="bg-amber-50 text-amber-600" />
                </div>
              </div>
            </div>

            {/* Ordering portal card — pricing locked until signed in + verified */}
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-panel">
              <div className="rounded-2xl bg-atlas-navy p-4 text-white">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black">{t("portalTitle")}</p>
                  <span className="rounded-full bg-yellow-300 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-atlas-navy">
                    {t("businessOnly")}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm text-slate-400">
                  <Search size={16} />
                  <span className="truncate">{t("portalSearchPlaceholder")}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 rounded-lg bg-white/10 py-2 text-sm font-bold text-white transition hover:bg-white/20"
                  >
                    <Repeat2 size={15} />
                    {t("buyAgain")}
                  </Link>
                  <a
                    href="https://wa.me/"
                    className="flex items-center justify-center gap-2 rounded-lg bg-white/10 py-2 text-sm font-bold text-white transition hover:bg-white/20"
                  >
                    <MessageCircle size={15} />
                    {t("whatsapp")}
                  </a>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between px-1">
                <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-slate-500">
                  <Sparkles size={13} className="text-atlas-blue" />
                  {t("featuredPlacements")}
                </p>
              </div>
              <div className="mt-2 grid gap-2">
                {deals.map((deal) => (
                  <PortalDealRow key={deal.name} deal={deal} />
                ))}
              </div>
              <Link
                href="/catalog"
                className="mt-3 flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white py-2.5 text-sm font-bold text-atlas-navy transition hover:border-atlas-blue hover:text-atlas-blue"
              >
                {t("seeFullCatalog")}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

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

        {/* Shop by category */}
        <section className="atlas-container py-12">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-3xl font-black text-atlas-navy">{t("shopByCategory")}</h2>
              <p className="mt-1 text-slate-600">{t("shopByCategoryBody")}</p>
            </div>
            <Link
              href="/catalog"
              className="hidden shrink-0 items-center gap-1 text-sm font-black text-atlas-blue hover:underline sm:flex"
            >
              {t("viewAll")}
              <ArrowRight size={15} />
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {homeCategories.map(({ name, count, icon: Icon, tint }) => (
              <Link
                key={name}
                href={`/catalog?category=${encodeURIComponent(name)}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-atlas-blue hover:shadow-panel"
              >
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${tint}`}>
                  <Icon size={24} />
                </span>
                <h3 className="mt-4 font-black text-atlas-navy">{name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {count ? `${count} ${t("subcategoriesLabel")}` : t("wholesaleCases")}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Why Atlas */}
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
      </main>
      <Footer />
    </>
  );
}

function PromoTile({ icon, label, tint }: { icon: ReactNode; label: string; tint: string }) {
  return (
    <Link
      href="/catalog"
      className="flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-atlas-blue hover:shadow-sm"
    >
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tint}`}>{icon}</span>
      <span className="text-sm font-black leading-tight text-atlas-navy">{label}</span>
    </Link>
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

function PortalDealRow({ deal }: { deal: PortalDeal }) {
  const { t } = useI18n();
  const [qty, setQty] = useState(1);

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-600">
            {deal.tag}
          </span>
          <p className="mt-1 truncate font-black text-atlas-navy">{deal.name}</p>
          <p className="truncate text-xs text-slate-500">{deal.pack}</p>
        </div>
        <p className="flex shrink-0 items-center gap-1 text-xs font-bold text-slate-400">
          <Lock size={12} />
          {t("memberPricing")}
        </p>
      </div>
      <p className="mt-1 truncate text-[11px] text-slate-400">{deal.meta}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setQty((current) => Math.max(1, current - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-atlas-blue hover:text-atlas-blue"
            aria-label={`Decrease ${deal.name} quantity`}
          >
            <Minus size={14} />
          </button>
          <span className="w-8 text-center text-sm font-black text-atlas-navy">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((current) => current + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-atlas-blue hover:text-atlas-blue"
            aria-label={`Increase ${deal.name} quantity`}
          >
            <Plus size={14} />
          </button>
        </div>
        <Link
          href="/login?next=/catalog"
          className="inline-flex rounded-full bg-atlas-blue px-4 py-2 text-xs font-bold text-white transition hover:bg-atlas-navy"
        >
          {t("quickAdd")}
        </Link>
      </div>
    </div>
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
