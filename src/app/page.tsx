"use client";

import Link from "next/link";
import type { Route as NextRoute } from "next";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  ClipboardCheck,
  Headset,
  Languages,
  MapPinned,
  Megaphone,
  Package,
  PackageSearch,
  Repeat2,
  ShieldCheck,
  ShoppingCart,
  Store,
  Tag,
  Truck,
  Warehouse
} from "lucide-react";
import { Nav } from "@/components/nav";
import { type TranslationKey, useI18n } from "@/lib/i18n";

const heroItems = [
  "/product-images/disinfecting-wipes.svg",
  "/product-images/hand-soap.svg",
  "/product-images/pasta-sauce.svg",
  "/product-images/copy-paper.svg"
];

const valueCards: Array<{ titleKey: TranslationKey; bodyKey: TranslationKey; icon: typeof Package }> = [
  { titleKey: "featureBuyingTitle", bodyKey: "featureBuyingBody", icon: Package },
  { titleKey: "featureFulfillmentTitle", bodyKey: "featureFulfillmentBody", icon: Truck },
  { titleKey: "featureSupplierTitle", bodyKey: "featureSupplierBody", icon: Warehouse }
];

const buyingSteps: Array<{ titleKey: TranslationKey; bodyKey: TranslationKey; icon: typeof Package; tone: string }> = [
  { titleKey: "stepLocationTitle", bodyKey: "stepLocationBody", icon: MapPinned, tone: "bg-sky-100" },
  { titleKey: "chooseProducts", bodyKey: "chooseProductsBody", icon: ShoppingCart, tone: "bg-white" },
  { titleKey: "pickOrderType", bodyKey: "pickOrderTypeBody", icon: Truck, tone: "bg-orange-50" },
  { titleKey: "atlasConfirms", bodyKey: "atlasConfirmsBody", icon: ClipboardCheck, tone: "bg-emerald-50" }
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

const tools: Array<{ titleKey: TranslationKey; bodyKey: TranslationKey; icon: typeof Package }> = [
  { titleKey: "requestSalesRep", bodyKey: "requestSalesRepBody", icon: Headset },
  { titleKey: "reorderCenter", bodyKey: "reorderCenterBody", icon: Repeat2 },
  { titleKey: "requestProductSourcing", bodyKey: "requestProductSourcingBody", icon: PackageSearch },
  { titleKey: "requestBulkQuote", bodyKey: "requestBulkQuoteBody", icon: ClipboardCheck }
];

export default function HomePage() {
  const { language, setLanguage, t } = useI18n();

  return (
    <>
      <Nav />
      <main>
        <section className="relative overflow-hidden bg-[#1237dc] text-white">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.13)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.13)_1px,transparent_1px)] bg-[size:170px_170px]" />
          <div className="atlas-container relative min-h-[620px] py-10">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div className="max-w-2xl">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 p-1 shadow-lg backdrop-blur">
                  <span className="flex items-center gap-2 px-3 text-sm font-black uppercase text-sky-100">
                    <Languages size={16} />
                    Language
                  </span>
                  <LanguageButton active={language === "en"} label="English" onClick={() => setLanguage("en")} />
                  <LanguageButton active={language === "es"} label="Español" onClick={() => setLanguage("es")} />
                </div>
                <p className="w-fit rounded-md border-2 border-yellow-300 px-4 py-2 text-2xl font-black uppercase tracking-normal text-yellow-300">
                  {t("newMemberRewards")}
                </p>
                <p className="mt-5 text-xl font-black uppercase tracking-normal text-sky-100">
                  {t("heroSubtitle")}
                </p>
                <h1 className="mt-4 text-5xl font-black tracking-normal sm:text-7xl">
                  {t("firstQualifiedOrder")}
                </h1>
                <div className="mt-1 flex flex-wrap items-end gap-3">
                  <span className="text-8xl font-black leading-none text-yellow-300 sm:text-[9rem]">$100</span>
                  <span className="pb-5 text-4xl font-black uppercase leading-none text-yellow-300 sm:text-5xl">{t("off")}</span>
                </div>
                <p className="text-2xl font-semibold text-sky-50">{t("firstOrderRule")}</p>
                <p className="mt-5 max-w-xl text-lg leading-8 text-sky-50">{t("heroBody")}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-yellow-300 px-8 py-3 text-base font-black text-atlas-navy transition hover:bg-yellow-200" href="/register/buyer">
                    {t("heroPrimaryCta")}
                    <ArrowRight size={18} />
                  </Link>
                  <Link className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-8 py-3 text-base font-black text-atlas-blue transition hover:bg-sky-50" href="/catalog">
                    {t("seeWeeklyDeals")}
                  </Link>
                </div>
              </div>

              <div className="relative min-h-[430px]">
                <div className="absolute right-0 top-0 w-full max-w-[680px] rounded-[2rem] border border-white/25 bg-white/12 p-5 shadow-2xl backdrop-blur">
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-5 py-4 text-atlas-navy">
                    <div>
                      <p className="text-sm font-black uppercase text-atlas-blue">{t("promoCartLabel")}</p>
                      <h2 className="text-2xl font-black">{t("promoCartTitle")}</h2>
                    </div>
                    <BadgeDollarSign className="text-atlas-blue" size={42} />
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {heroItems.map((src) => (
                      <div key={src} className="rounded-xl bg-white p-4 shadow-lg">
                        <img alt="" className="h-28 w-full object-contain" src={src} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <HubCard title={t("miamiHub")} body={t("miamiNote")} />
                    <HubCard title={t("orlandoHub")} body={t("orlandoNote")} />
                    <HubCard title={t("supplierDirect")} body={t("supplierDirectNote")} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="atlas-container relative -mt-20 pb-10">
            <div className="grid gap-4 lg:grid-cols-3">
              {valueCards.map(({ titleKey, bodyKey, icon: Icon }) => (
                <div key={titleKey} className="rounded-lg bg-white p-5 text-atlas-navy shadow-panel">
                  <div className="flex items-center gap-4">
                    <Icon className="shrink-0 text-atlas-blue" size={42} />
                    <div>
                      <h2 className="text-lg font-black">{t(titleKey)}</h2>
                      <p className="text-sm font-semibold text-slate-600">{t(bodyKey)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-atlas-light py-14">
          <div className="atlas-container grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase text-atlas-blue">{t("getStartedFast")}</p>
              <h2 className="mt-2 text-4xl font-black text-atlas-navy">{t("buyingProcessTitle")}</h2>
              <p className="mt-4 text-lg leading-8 text-slate-700">{t("buyingProcessBody")}</p>
              <div className="mt-8 flex h-48 w-48 items-center justify-center rounded-full border-[14px] border-atlas-blue bg-white text-center shadow-panel">
                <div>
                  <p className="text-6xl font-black text-atlas-navy">10</p>
                  <p className="text-xl font-black text-atlas-blue">min</p>
                </div>
              </div>
            </div>
            <div className="grid gap-5">
              {buyingSteps.map(({ titleKey, bodyKey, icon: Icon, tone }, index) => (
                <div key={titleKey} className={`grid gap-4 rounded-full ${tone} px-6 py-5 shadow-sm md:grid-cols-[88px_1fr] md:items-center`}>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-atlas-blue shadow-sm">
                    <Icon size={30} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-atlas-blue">0{index + 1}</p>
                    <h3 className="text-2xl font-black text-atlas-navy">{t(titleKey)}</h3>
                    <p className="mt-1 text-base text-slate-700">{t(bodyKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-12">
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
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <PromoCard icon={<Tag />} title={t("weeklyDeals")} body={t("weeklyDealsBody")} />
              <PromoCard icon={<PackageSearch />} title={t("sponsoredCategories")} body={t("sponsoredCategoriesBody")} />
              <PromoCard icon={<Megaphone />} title={t("campaignTracking")} body={t("campaignTrackingBody")} />
            </div>
          </div>
        </section>

        <section className="atlas-container py-12">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {roles.map((role) => (
              <div key={role.titleKey} className="panel overflow-hidden">
                <div className={`${role.color} px-6 py-5 text-white`}>
                  <p className="text-sm font-black uppercase text-white/80">{t(role.labelKey)}</p>
                  <h2 className="mt-1 text-2xl font-black">{t(role.titleKey)}</h2>
                </div>
                <div className="p-6">
                  <p className="text-slate-600">{t(role.bodyKey)}</p>
                  <ul className="mt-4 grid gap-2 text-sm text-slate-700">
                    {role.points.map((point) => (
                      <li key={point} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 shrink-0 text-atlas-blue" size={16} />
                        {t(point)}
                      </li>
                    ))}
                  </ul>
                  <Link className="btn-secondary mt-5 rounded-full" href={role.href}>
                    {t(role.ctaKey)}
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-atlas-light py-12">
          <div className="atlas-container">
            <p className="text-sm font-bold uppercase text-atlas-blue">{t("wholesaleToolsEyebrow")}</p>
            <h2 className="mt-2 text-3xl font-black text-atlas-navy">{t("wholesaleToolsTitle")}</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {tools.map(({ titleKey, bodyKey, icon: Icon }) => (
                <div key={titleKey} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <Icon className="text-atlas-blue" size={30} />
                  <h3 className="mt-3 text-lg font-black text-atlas-navy">{t(titleKey)}</h3>
                  <p className="mt-2 text-sm text-slate-600">{t(bodyKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-atlas-navy py-12 text-white">
          <div className="atlas-container grid gap-5 lg:grid-cols-3">
            <DarkFeature icon={<Store />} title={t("verifiedBuyers")} body={t("verifiedBuyersBody")} />
            <DarkFeature icon={<MapPinned />} title={t("floridaRouting")} body={t("floridaRoutingBody")} />
            <DarkFeature icon={<ShieldCheck />} title={t("quoteBeforePayment")} body={t("quoteBeforePaymentBody")} />
          </div>
        </section>
      </main>
    </>
  );
}

function LanguageButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={`min-h-10 rounded-full px-4 text-sm font-black transition ${
        active ? "bg-white text-atlas-blue" : "text-white hover:bg-white/15"
      }`}
      type="button"
      onClick={onClick}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

function HubCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg bg-atlas-navy/85 p-4">
      <p className="text-sm font-black uppercase text-sky-200">{title}</p>
      <p className="mt-1 text-sm text-white">{body}</p>
    </div>
  );
}

function PromoCard({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-atlas-light p-5">
      <span className="text-atlas-blue">{icon}</span>
      <h3 className="mt-3 text-lg font-black text-atlas-navy">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
    </div>
  );
}

function DarkFeature({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/10 p-6">
      <span className="text-sky-200">{icon}</span>
      <h2 className="mt-3 text-xl font-black">{title}</h2>
      <p className="mt-2 text-slate-200">{body}</p>
    </div>
  );
}
"use client";

import Link from "next/link";
import type { Route as NextRoute } from "next";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  Handshake,
  Headset,
  MapPinned,
  Megaphone,
  Package,
  PackageSearch,
  Repeat2,
  ShieldCheck,
  ShoppingCart,
  Store,
  Tag,
  Truck,
  Warehouse
} from "lucide-react";
import { Nav } from "@/components/nav";
import { type TranslationKey, useI18n } from "@/lib/i18n";

const heroFeatures: Array<{ titleKey: TranslationKey; bodyKey: TranslationKey; icon: typeof Package }> = [
  { titleKey: "featureBuyingTitle", bodyKey: "featureBuyingBody", icon: Package },
  { titleKey: "featureFulfillmentTitle", bodyKey: "featureFulfillmentBody", icon: Truck },
  { titleKey: "featureSupplierTitle", bodyKey: "featureSupplierBody", icon: Warehouse }
];

const startSteps: Array<{ titleKey: TranslationKey; bodyKey: TranslationKey; icon: typeof Package; tone: string }> = [
  { titleKey: "stepLocationTitle", bodyKey: "stepLocationBody", icon: MapPinned, tone: "bg-sky-50" },
  { titleKey: "stepBusinessTitle", bodyKey: "stepBusinessBody", icon: FileText, tone: "bg-sky-100" },
  { titleKey: "stepApprovalTitle", bodyKey: "stepApprovalBody", icon: ShieldCheck, tone: "bg-orange-50" },
  { titleKey: "stepCartTitle", bodyKey: "stepCartBody", icon: ShoppingCart, tone: "bg-emerald-50" }
];

const paths: Array<{
  titleKey: TranslationKey;
  labelKey: TranslationKey;
  bodyKey: TranslationKey;
  points: TranslationKey[];
  href: NextRoute;
  ctaKey: TranslationKey;
}> = [
  {
    titleKey: "member",
    labelKey: "buyerAccount",
    bodyKey: "memberBody",
    points: ["uploadResale", "unlockPricing", "requestFulfillment"],
    href: "/register/buyer" as NextRoute,
    ctaKey: "becomeMember"
  },
  {
    titleKey: "supplierPathTitle",
    labelKey: "supplierPathLabel",
    bodyKey: "supplierPathBody",
    points: ["submitDocs", "uploadSheets", "buyPlacement"],
    href: "/register/supplier" as NextRoute,
    ctaKey: "becomeSupplier"
  },
  {
    titleKey: "salesPartnerTitle",
    labelKey: "salesPartnerLabel",
    bodyKey: "salesPartnerBody",
    points: ["chooseRoute", "supportReorders", "earnCommission"],
    href: "/register/route-seller" as NextRoute,
    ctaKey: "becomeSalesPartner"
  },
  {
    titleKey: "fulfillmentPartnerTitle",
    labelKey: "fulfillmentPartnerLabel",
    bodyKey: "fulfillmentPartnerBody",
    points: ["supportCrossDock", "offerDeliveryCapacity", "helpBuildMixedPallets"],
    href: "/register/supplier" as NextRoute,
    ctaKey: "becomeFulfillmentPartner"
  }
];

const wholesaleTools: Array<{ titleKey: TranslationKey; bodyKey: TranslationKey; icon: typeof Package }> = [
  { titleKey: "requestSalesRep", bodyKey: "requestSalesRepBody", icon: Headset },
  { titleKey: "reorderCenter", bodyKey: "reorderCenterBody", icon: Repeat2 },
  { titleKey: "requestProductSourcing", bodyKey: "requestProductSourcingBody", icon: PackageSearch },
  { titleKey: "requestBulkQuote", bodyKey: "requestBulkQuoteBody", icon: ClipboardCheck }
];

export default function HomePage() {
  const { t } = useI18n();

  return (
    <>
      <Nav />
      <main>
        <section className="relative overflow-hidden bg-[#0d32d9] text-white">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.13)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.13)_1px,transparent_1px)] bg-[size:170px_170px]" />
          <div className="atlas-container relative min-h-[650px] py-12">
            <div className="grid min-h-[510px] gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div className="max-w-2xl">
                <p className="w-fit rounded-md border-2 border-yellow-300 px-4 py-2 text-2xl font-black uppercase tracking-normal text-yellow-300">
                  {t("newMemberRewards")}
                </p>
                <h1 className="mt-6 text-5xl font-black tracking-normal sm:text-7xl">
                  {t("firstQualifiedOrder")}
                </h1>
                <div className="mt-2 flex flex-wrap items-end gap-4">
                  <span className="text-8xl font-black leading-none text-yellow-300 sm:text-[9rem]">$100</span>
                  <span className="pb-5 text-4xl font-black uppercase leading-none text-yellow-300 sm:text-5xl">
                    {t("off")}
                  </span>
                </div>
                <p className="mt-3 text-2xl font-semibold text-sky-50">{t("firstOrderRule")}</p>
                <p className="mt-5 max-w-xl text-lg leading-8 text-sky-50">{t("heroBody")}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-yellow-300 px-8 py-3 text-base font-black text-atlas-navy transition hover:bg-yellow-200" href="/register/buyer">
                    {t("becomeMember")}
                    <ArrowRight size={18} />
                  </Link>
                  <Link className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-8 py-3 text-base font-black text-atlas-blue transition hover:bg-sky-50" href="/register/supplier">
                    {t("becomePartner")}
                  </Link>
                </div>
              </div>
              <div className="relative min-h-[390px]">
                <div className="absolute right-0 top-0 w-full max-w-[640px] rounded-[2rem] border border-white/25 bg-white/10 p-6 shadow-2xl">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {["/product-images/disinfecting-wipes.svg", "/product-images/hand-soap.svg", "/product-images/pasta-sauce.svg", "/product-images/copy-paper.svg"].map((src) => (
                      <div key={src} className="rounded-xl bg-white p-4 shadow-lg">
                        <img alt="" className="h-28 w-full object-contain" src={src} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-atlas-navy/80 p-4">
                      <p className="text-sm font-black uppercase text-sky-200">{t("miamiHub")}</p>
                      <p className="mt-1 text-sm text-white">{t("miamiAddress")}</p>
                    </div>
                    <div className="rounded-lg bg-atlas-navy/80 p-4">
                      <p className="text-sm font-black uppercase text-sky-200">{t("orlandoHub")}</p>
                      <p className="mt-1 text-sm text-white">{t("orlandoAddress")}</p>
                    </div>
                    <div className="rounded-lg bg-atlas-navy/80 p-4">
                      <p className="text-sm font-black uppercase text-sky-200">{t("supplierDirect")}</p>
                      <p className="mt-1 text-sm text-white">{t("atlasQuoteReview")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="atlas-container relative -mt-20 pb-10">
            <div className="grid gap-4 lg:grid-cols-3">
              {heroFeatures.map(({ titleKey, bodyKey, icon: Icon }) => (
                <div key={titleKey} className="rounded-lg bg-white p-5 text-atlas-navy shadow-panel">
                  <div className="flex items-center gap-4">
                    <Icon className="shrink-0 text-atlas-blue" size={42} />
                    <div>
                      <h2 className="text-lg font-black">{t(titleKey)}</h2>
                      <p className="text-sm font-semibold text-slate-600">{t(bodyKey)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-atlas-light py-14">
          <div className="atlas-container grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase text-atlas-blue">{t("getStartedFast")}</p>
              <h2 className="mt-2 text-4xl font-black text-atlas-navy">{t("routeOrderTitle")}</h2>
              <div className="mt-8 flex h-48 w-48 items-center justify-center rounded-full border-[14px] border-atlas-blue bg-white text-center shadow-panel">
                <div>
                  <p className="text-6xl font-black text-atlas-navy">10</p>
                  <p className="text-xl font-black text-atlas-blue">min</p>
                </div>
              </div>
            </div>
            <div className="grid gap-5">
              {startSteps.map(({ titleKey, bodyKey, icon: Icon, tone }) => (
                <div key={titleKey} className={`grid gap-4 rounded-full ${tone} px-6 py-5 md:grid-cols-[96px_1fr] md:items-center`}>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-atlas-blue shadow-sm">
                    <Icon size={30} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-atlas-navy">{t(titleKey)}</h3>
                    <p className="mt-1 text-lg text-slate-700">{t(bodyKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-12">
          <div className="atlas-container">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold uppercase text-atlas-blue">
                  <Megaphone size={16} />
                  {t("promotionsEyebrow")}
                </p>
                <h2 className="mt-2 text-3xl font-black text-atlas-navy">{t("promotionsTitle")}</h2>
              </div>
              <Link className="btn-primary rounded-full" href="/catalog">
                {t("seeWeeklyDeals")}
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <PromoCard icon={<Tag />} title={t("weeklyDeals")} body={t("weeklyDealsBody")} />
              <PromoCard icon={<PackageSearch />} title={t("sponsoredCategories")} body={t("sponsoredCategoriesBody")} />
              <PromoCard icon={<Megaphone />} title={t("campaignTracking")} body={t("campaignTrackingBody")} />
            </div>
          </div>
        </section>

        <section className="atlas-container grid gap-4 py-12 md:grid-cols-2 xl:grid-cols-4">
          {paths.map((path) => (
            <div key={path.titleKey} className="panel p-6">
              <Handshake className="text-atlas-blue" />
              <p className="mt-3 text-sm font-black uppercase text-atlas-blue">{t(path.labelKey)}</p>
              <h2 className="mt-1 text-2xl font-black text-atlas-navy">{t(path.titleKey)}</h2>
              <p className="mt-2 text-slate-600">{t(path.bodyKey)}</p>
              <ul className="mt-4 grid gap-2 text-sm text-slate-700">
                {path.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-atlas-blue" size={16} />
                    {t(point)}
                  </li>
                ))}
              </ul>
              <Link className="btn-secondary mt-5 rounded-full" href={path.href}>
                {t(path.ctaKey)}
                <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </section>

        <section className="bg-atlas-light py-12">
          <div className="atlas-container">
            <p className="text-sm font-bold uppercase text-atlas-blue">{t("wholesaleToolsEyebrow")}</p>
            <h2 className="mt-2 text-3xl font-black text-atlas-navy">{t("wholesaleToolsTitle")}</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {wholesaleTools.map(({ titleKey, bodyKey, icon: Icon }) => (
                <div key={titleKey} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <Icon className="text-atlas-blue" size={30} />
                  <h3 className="mt-3 text-lg font-black text-atlas-navy">{t(titleKey)}</h3>
                  <p className="mt-2 text-sm text-slate-600">{t(bodyKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-atlas-navy py-12 text-white">
          <div className="atlas-container grid gap-5 lg:grid-cols-3">
            <DarkFeature icon={<Store />} title={t("verifiedBuyers")} body={t("verifiedBuyersBody")} />
            <DarkFeature icon={<MapPinned />} title={t("floridaRouting")} body={t("floridaRoutingBody")} />
            <DarkFeature icon={<Clock3 />} title={t("quoteBeforePayment")} body={t("quoteBeforePaymentBody")} />
          </div>
        </section>
      </main>
    </>
  );
}

function PromoCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-atlas-light p-5">
      <span className="text-atlas-blue">{icon}</span>
      <h3 className="mt-3 text-lg font-black text-atlas-navy">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
    </div>
  );
}

function DarkFeature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/10 p-6">
      <span className="text-sky-200">{icon}</span>
      <h2 className="mt-3 text-xl font-black">{title}</h2>
      <p className="mt-2 text-slate-200">{body}</p>
    </div>
  );
}
