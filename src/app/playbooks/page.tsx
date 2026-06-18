"use client";

import type { TranslationKey } from "@/lib/i18n";
import { MapPinned, Boxes, BadgeDollarSign, Repeat2, Megaphone, ShieldCheck } from "lucide-react";
import { Nav } from "@/components/nav";
import { AtlasMark } from "@/components/atlas-logo";
import { useI18n } from "@/lib/i18n";

const plays: Array<{ titleKey: TranslationKey; bodyKey: TranslationKey; icon: typeof MapPinned }> = [
  { titleKey: "play1Title", bodyKey: "play1Body", icon: MapPinned },
  { titleKey: "play2Title", bodyKey: "play2Body", icon: Boxes },
  { titleKey: "play3Title", bodyKey: "play3Body", icon: BadgeDollarSign },
  { titleKey: "play4Title", bodyKey: "play4Body", icon: Repeat2 },
  { titleKey: "play5Title", bodyKey: "play5Body", icon: Megaphone },
  { titleKey: "play6Title", bodyKey: "play6Body", icon: ShieldCheck }
];

export default function PlaybooksPage() {
  const { t } = useI18n();

  return (
    <>
      <Nav />
      <main>
        <section className="relative overflow-hidden bg-atlas-navy text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_-10%,rgba(10,99,176,0.65),transparent_55%),radial-gradient(circle_at_95%_25%,rgba(10,99,176,0.4),transparent_45%)]" />
          <div className="atlas-container relative max-w-3xl py-16 lg:py-20">
            <AtlasMark size={44} tone="light" className="mb-6" />
            <p className="text-sm font-black uppercase tracking-wide text-sky-200">{t("routePlaybook")}</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">{t("playbookTitle")}</h1>
            <p className="mt-4 text-lg text-sky-100/90">{t("playbookBody")}</p>
          </div>
        </section>
        <section className="atlas-container py-12">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {plays.map(({ titleKey, bodyKey, icon: Icon }, index) => (
              <div key={titleKey} className="panel p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-50 text-atlas-blue">
                    <Icon size={22} />
                  </span>
                  <span className="text-sm font-black text-atlas-blue">0{index + 1}</span>
                </div>
                <h2 className="mt-4 text-xl font-black text-atlas-navy">{t(titleKey)}</h2>
                <p className="mt-2 text-slate-600">{t(bodyKey)}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
