"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BadgePercent,
  Boxes,
  CalendarClock,
  Headset,
  Mail,
  Megaphone,
  MessageCircle,
  PackageSearch,
  Sparkles,
  Star,
  Tag,
  Truck,
  Warehouse
} from "lucide-react";
import { Check } from "lucide-react";
import { Nav } from "@/components/nav";
import { AtlasMark } from "@/components/atlas-logo";
import { fulfillmentTiers, supplierPlans } from "@/lib/data";
import { type TranslationKey, useI18n } from "@/lib/i18n";

const whyCards: Array<{ titleKey: TranslationKey; bodyKey: TranslationKey; icon: typeof Boxes }> = [
  { titleKey: "sellWhy1Title", bodyKey: "sellWhy1Body", icon: Boxes },
  { titleKey: "sellWhy2Title", bodyKey: "sellWhy2Body", icon: Headset },
  { titleKey: "sellWhy3Title", bodyKey: "sellWhy3Body", icon: PackageSearch },
  { titleKey: "sellWhy4Title", bodyKey: "sellWhy4Body", icon: Megaphone }
];

const placements: Array<{ titleKey: TranslationKey; bodyKey: TranslationKey; icon: typeof Mail }> = [
  { titleKey: "placeWeeklyEmail", bodyKey: "placeWeeklyEmailBody", icon: Mail },
  { titleKey: "placeSponsoredCategory", bodyKey: "placeSponsoredCategoryBody", icon: Tag },
  { titleKey: "placeNewTrending", bodyKey: "placeNewTrendingBody", icon: Sparkles },
  { titleKey: "placeFeatured", bodyKey: "placeFeaturedBody", icon: Star },
  { titleKey: "placeCircular", bodyKey: "placeCircularBody", icon: CalendarClock },
  { titleKey: "placeCloseout", bodyKey: "placeCloseoutBody", icon: BadgePercent },
  { titleKey: "placeWhatsapp", bodyKey: "placeWhatsappBody", icon: MessageCircle },
  { titleKey: "placeMembership", bodyKey: "placeMembershipBody", icon: Star }
];

const lanes: Array<{ titleKey: TranslationKey; bodyKey: TranslationKey; icon: typeof Warehouse }> = [
  { titleKey: "laneHubTitle", bodyKey: "laneHubBody", icon: Warehouse },
  { titleKey: "laneDirectTitle", bodyKey: "laneDirectBody", icon: Boxes },
  { titleKey: "laneFreightTitle", bodyKey: "laneFreightBody", icon: Truck }
];

export default function SellPage() {
  const { t } = useI18n();

  return (
    <>
      <Nav />
      <main>
        <section className="border-b border-slate-200 bg-white py-16 lg:py-20">
          <div className="atlas-container max-w-3xl">
            <AtlasMark size={44} className="mb-6" />
            <p className="text-sm font-black uppercase tracking-wide text-atlas-blue">{t("sellEyebrow")}</p>
            <h1 className="mt-3 text-4xl font-black text-atlas-navy sm:text-5xl">{t("sellTitle")}</h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">{t("sellBody")}</p>
            <Link
              className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-atlas-blue px-8 py-3 text-base font-bold text-white transition hover:bg-atlas-navy"
              href="/register/supplier"
            >
              {t("sellCtaPrimary")}
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="atlas-container">
            <p className="text-sm font-bold uppercase text-atlas-blue">{t("sellWhyEyebrow")}</p>
            <h2 className="mt-2 max-w-2xl text-3xl font-black text-atlas-navy">{t("sellWhyTitle")}</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {whyCards.map(({ titleKey, bodyKey, icon: Icon }) => (
                <div key={titleKey} className="rounded-lg border border-slate-200 bg-atlas-light p-6">
                  <Icon className="text-atlas-blue" size={32} />
                  <h3 className="mt-4 text-lg font-black text-atlas-navy">{t(titleKey)}</h3>
                  <p className="mt-2 text-sm text-slate-600">{t(bodyKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-atlas-light py-16">
          <div className="atlas-container">
            <p className="flex items-center gap-2 text-sm font-bold uppercase text-atlas-blue">
              <Megaphone size={16} />
              {t("sellMenuEyebrow")}
            </p>
            <h2 className="mt-2 text-3xl font-black text-atlas-navy">{t("sellMenuTitle")}</h2>
            <p className="mt-2 max-w-3xl text-slate-600">{t("sellMenuBody")}</p>
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {placements.map(({ titleKey, bodyKey, icon: Icon }) => (
                <div key={titleKey} className="rounded-lg bg-white p-6 shadow-panel">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-50 text-atlas-blue">
                    <Icon size={22} />
                  </span>
                  <h3 className="mt-4 text-lg font-black text-atlas-navy">{t(titleKey)}</h3>
                  <p className="mt-2 text-sm text-slate-600">{t(bodyKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="atlas-container">
            <p className="text-sm font-bold uppercase text-atlas-blue">{t("sellLanesEyebrow")}</p>
            <h2 className="mt-2 text-3xl font-black text-atlas-navy">{t("sellLanesTitle")}</h2>
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              {lanes.map(({ titleKey, bodyKey, icon: Icon }) => (
                <div key={titleKey} className="rounded-lg border border-slate-200 p-6">
                  <Icon className="text-atlas-blue" size={32} />
                  <h3 className="mt-4 text-xl font-black text-atlas-navy">{t(titleKey)}</h3>
                  <p className="mt-2 text-slate-600">{t(bodyKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Supplier plans */}
        <section className="bg-white py-16">
          <div className="atlas-container">
            <p className="text-sm font-bold uppercase text-atlas-blue">Supplier plans</p>
            <h2 className="mt-2 text-3xl font-black text-atlas-navy">Choose how you grow with Atlas</h2>
            <p className="mt-2 max-w-2xl text-slate-600">Annual plans, billed yearly. Higher plans earn a lower commission and more visibility with verified Atlas buyers.</p>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {supplierPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${plan.highlight ? "border-atlas-blue ring-2 ring-atlas-blue/20" : "border-slate-200"}`}
                >
                  {plan.highlight && <span className="w-fit rounded-full bg-atlas-blue px-3 py-1 text-xs font-black uppercase text-white">Most popular</span>}
                  <h3 className="mt-3 text-2xl font-black text-atlas-navy">{plan.name}</h3>
                  <p className="mt-1 text-3xl font-black text-atlas-navy">
                    ${plan.priceYear.toLocaleString()}
                    <span className="text-sm font-semibold text-slate-500"> / year</span>
                  </p>
                  <p className="mt-1 text-sm font-bold text-emerald-700">{plan.commission}</p>
                  <ul className="mt-4 grid flex-1 gap-2 text-sm text-slate-700">
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <Check className="mt-0.5 shrink-0 text-atlas-blue" size={16} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link className="btn-secondary mt-5 w-fit rounded-full" href="/register/supplier">
                    Get started
                    <ArrowRight size={16} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Fulfillment service tiers */}
        <section className="bg-atlas-light py-16">
          <div className="atlas-container">
            <p className="text-sm font-bold uppercase text-atlas-blue">Fulfillment</p>
            <h2 className="mt-2 text-3xl font-black text-atlas-navy">Pick how your product is fulfilled</h2>
            <p className="mt-2 max-w-2xl text-slate-600">Atlas owns the buyer, pricing, and invoice. You choose how the goods move.</p>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {fulfillmentTiers.map((tier) => (
                <div key={tier.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-black text-atlas-navy">{tier.name}</h3>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black uppercase text-slate-600">{tier.fee}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{tier.blurb}</p>
                  <ul className="mt-4 grid gap-2 text-sm text-slate-700">
                    {tier.points.map((p) => (
                      <li key={p} className="flex gap-2">
                        <Check className="mt-0.5 shrink-0 text-atlas-blue" size={16} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-atlas-blue py-16 text-white">
          <div className="atlas-container flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-black">{t("sellFinalTitle")}</h2>
              <p className="mt-2 text-lg text-sky-50">{t("sellFinalBody")}</p>
            </div>
            <Link
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-8 py-3 text-base font-black text-atlas-blue transition hover:bg-sky-50"
              href="/register/supplier"
            >
              {t("sellCtaPrimary")}
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
