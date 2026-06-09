"use client";

import Link from "next/link";
import type { Route as NextRoute } from "next";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  ClipboardCheck,
  Droplets,
  FileText,
  MapPinned,
  Megaphone,
  Package,
  PackageSearch,
  ShoppingCart,
  SprayCan,
  Tag,
  Truck,
  UtensilsCrossed,
  Warehouse
} from "lucide-react";
import { Nav } from "@/components/nav";
import { AtlasMark } from "@/components/atlas-logo";
import { type TranslationKey, useI18n } from "@/lib/i18n";

const heroProducts: Array<{ name: string; icon: typeof Package; tint: string; tag: string }> = [
  { name: "BrightPro", icon: SprayCan, tint: "bg-sky-50 text-atlas-blue", tag: "Weekly deal" },
  { name: "Pure Harbor", icon: Droplets, tint: "bg-rose-50 text-rose-500", tag: "New" },
  { name: "North Table", icon: UtensilsCrossed, tint: "bg-amber-50 text-amber-600", tag: "Popular" },
  { name: "Deskline", icon: FileText, tint: "bg-emerald-50 text-emerald-600", tag: "Closeout" }
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

export default function HomePage() {
  const { t } = useI18n();

  return (
    <>
      <Nav />
      <main>
        <section className="bg-white">
          <div className="atlas-container grid gap-12 py-14 lg:grid-cols-2 lg:items-center lg:py-20">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-atlas-blue">
                {t("brandSubline")}
              </span>
              <h1 className="mt-5 text-4xl font-black leading-[1.1] tracking-tight text-atlas-navy sm:text-5xl">
                {t("heroHeadline")}
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">{t("heroBody")}</p>
              <div className="mt-6 flex max-w-md items-center gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-300 text-base font-black text-atlas-navy">$100</span>
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-atlas-navy">{t("newMemberRewards")}</p>
                  <p className="text-sm text-slate-600">{t("firstOrderRule")}</p>
                </div>
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-atlas-blue px-7 py-3 text-base font-bold text-white transition hover:bg-atlas-navy" href="/register/buyer">
                  {t("heroPrimaryCta")}
                  <ArrowRight size={18} />
                </Link>
                <Link className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-3 text-base font-bold text-atlas-navy transition hover:border-atlas-blue hover:text-atlas-blue" href="/catalog">
                  {t("seeWeeklyDeals")}
                </Link>
              </div>
              <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
                <HeroStat value={t("heroStat1")} label={t("heroStat1Sub")} />
                <HeroStat value={t("heroStat2")} label={t("heroStat2Sub")} />
                <HeroStat value={t("heroStat3")} label={t("heroStat3Sub")} />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel">
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-atlas-navy px-5 py-4 text-white">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-sky-300">{t("promoCartLabel")}</p>
                  <h2 className="mt-0.5 text-lg font-black">{t("promoCartTitle")}</h2>
                </div>
                <BadgeDollarSign className="shrink-0 text-sky-300" size={32} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {heroProducts.map(({ name, icon: Icon, tint, tag }) => (
                  <div key={name} className="rounded-xl border border-slate-200 p-3 text-center">
                    <span className={`mx-auto flex h-11 w-11 items-center justify-center rounded-lg ${tint}`}>
                      <Icon size={20} />
                    </span>
                    <p className="mt-2 truncate text-xs font-black text-atlas-navy">{name}</p>
                    <p className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{tag}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <HubCard title={t("miamiHub")} body={t("miamiNote")} />
                <HubCard title={t("orlandoHub")} body={t("orlandoNote")} />
                <HubCard title={t("supplierDirect")} body={t("supplierDirectNote")} />
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-atlas-light py-12">
          <div className="atlas-container grid gap-5 lg:grid-cols-3">
            {valueCards.map(({ titleKey, bodyKey, icon: Icon }) => (
              <div key={titleKey} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-atlas-blue">
                    <Icon size={24} />
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-atlas-navy">{t(titleKey)}</h2>
                    <p className="text-sm font-semibold text-slate-600">{t(bodyKey)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-atlas-light py-16 lg:py-20">
          <div className="atlas-container grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
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
            <div className="grid gap-6">
              {buyingSteps.map(({ titleKey, bodyKey, icon: Icon, tone }, index) => (
                <div key={titleKey} className={`grid gap-4 rounded-2xl ${tone} px-7 py-6 shadow-sm md:grid-cols-[88px_1fr] md:items-center`}>
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

        <section className="bg-white py-16">
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

        <section className="bg-atlas-light py-16">
          <div className="atlas-container">
            <p className="text-sm font-bold uppercase text-atlas-blue">{t("chooseYourPath")}</p>
            <h2 className="mt-2 text-3xl font-black text-atlas-navy">{t("chooseYourPathBody")}</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {roles.map((role) => (
              <div key={role.titleKey} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-black uppercase text-white ${role.color}`}>
                  {t(role.labelKey)}
                </span>
                <h2 className="mt-3 text-2xl font-black text-atlas-navy">{t(role.titleKey)}</h2>
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

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
      <p className="text-base font-black text-atlas-navy">{value}</p>
      <p className="text-[11px] font-semibold leading-tight text-slate-500">{label}</p>
    </div>
  );
}

function HubCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-black uppercase text-atlas-blue">{title}</p>
      <p className="mt-1 text-xs leading-snug text-slate-600">{body}</p>
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

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="atlas-container grid gap-8 py-12 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <span className="flex items-center gap-3">
            <AtlasMark size={40} />
            <span className="text-2xl font-black text-atlas-navy">Atlas Discount</span>
          </span>
          <p className="mt-3 max-w-xs text-sm text-slate-500">{t("brandSubline")}</p>
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-atlas-blue">{t("footerShop")}</p>
          <ul className="mt-3 grid gap-2 text-sm text-slate-600">
            <li><Link className="transition hover:text-atlas-blue" href="/catalog">{t("catalog")}</Link></li>
            <li><Link className="transition hover:text-atlas-blue" href="/sell">{t("sellOnAtlas")}</Link></li>
            <li><Link className="transition hover:text-atlas-blue" href="/playbooks">{t("routePlaybook")}</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-atlas-blue">{t("footerJoin")}</p>
          <ul className="mt-3 grid gap-2 text-sm text-slate-600">
            <li><Link className="transition hover:text-atlas-blue" href="/register/buyer">{t("member")}</Link></li>
            <li><Link className="transition hover:text-atlas-blue" href="/register/route-seller">{t("selr")}</Link></li>
            <li><Link className="transition hover:text-atlas-blue" href="/sell">{t("supplierPathTitle")}</Link></li>
            <li><Link className="transition hover:text-atlas-blue" href="/login">{t("signIn")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200">
        <div className="atlas-container py-5 text-sm text-slate-500">© 2026 Atlas Discount. {t("footerRights")}</div>
      </div>
    </footer>
  );
}
