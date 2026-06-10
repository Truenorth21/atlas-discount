"use client";

import Link from "next/link";
import {
  Apple,
  ArrowRight,
  Baby,
  BadgePercent,
  Boxes,
  Car,
  Clock,
  Droplets,
  FileText,
  Flame,
  HeartPulse,
  Lock,
  MessageCircle,
  PawPrint,
  Repeat2,
  Search,
  ShieldCheck,
  SprayCan,
  Tag,
  Truck,
  UtensilsCrossed,
  Wine,
  Wrench,
  Zap,
} from "lucide-react";

import { AtlasMark } from "@/components/atlas-logo";
import { Nav } from "@/components/nav";
import { type TranslationKey, useI18n } from "@/lib/i18n";

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

const homeCategories = [
  { name: "House & Cleaning", count: "26", icon: SprayCan, tint: "bg-sky-50 text-atlas-blue" },
  { name: "Groceries", count: "33", icon: Apple, tint: "bg-amber-50 text-amber-600" },
  { name: "Health & Beauty", count: "24", icon: HeartPulse, tint: "bg-rose-50 text-rose-500" },
  { name: "Babies & Children", count: "8", icon: Baby, tint: "bg-violet-50 text-violet-500" },
  { name: "Auto Products", count: "4", icon: Car, tint: "bg-slate-100 text-slate-600" },
  { name: "Pet Supplies", count: "6", icon: PawPrint, tint: "bg-emerald-50 text-emerald-600" },
  { name: "Electric & Tools", count: "11", icon: Wrench, tint: "bg-orange-50 text-orange-500" },
  { name: "Office Supply", count: "4", icon: FileText, tint: "bg-sky-50 text-atlas-blue" },
  { name: "Tobacco, Beer & Wine", count: "9", icon: Wine, tint: "bg-rose-50 text-rose-500" },
  { name: "Closeouts", count: "", icon: BadgePercent, tint: "bg-red-50 text-atlas-red" },
];

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

export default function HomePage() {
  const { t } = useI18n();

  return (
    <>
      <Nav />
      <main className="bg-atlas-light">
        {/* Hero + live ordering portal */}
        <section className="bg-white">
          <div className="atlas-container grid gap-10 py-12 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:py-16">
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

              <div className="mt-3 grid gap-2">
                {portalDeals.map(({ name, pack, meta, tag, icon: Icon, tint }) => (
                  <div key={name} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${tint}`}>
                      <Icon size={22} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-600">
                        {tag}
                      </span>
                      <p className="mt-1 truncate font-black text-atlas-navy">{name}</p>
                      <p className="truncate text-xs text-slate-500">{pack}</p>
                      <p className="truncate text-[11px] text-slate-400">{meta}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="flex items-center justify-end gap-1 text-xs font-bold text-slate-400">
                        <Lock size={12} />
                        {t("memberPricing")}
                      </p>
                      <Link
                        href="/login?next=/catalog"
                        className="mt-2 inline-flex rounded-full bg-atlas-blue px-4 py-2 text-xs font-bold text-white transition hover:bg-atlas-navy"
                      >
                        {t("quickAdd")}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
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
          <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            {homeCategories.map(({ name, count, icon: Icon, tint }) => (
              <Link
                key={name}
                href="/catalog"
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
        <section className="atlas-container pb-14">
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
      </main>
      <Footer />
    </>
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
