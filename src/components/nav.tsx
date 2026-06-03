"use client";

import Link from "next/link";
import { Building2, ChevronDown, Languages, LayoutDashboard, LogIn, MapPin, ShieldCheck, ShoppingCart, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/browser";
import { type TranslationKey, useI18n } from "@/lib/i18n";
import { SignOutButton } from "./sign-out-button";

function roleForUser(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } | null) {
  return String(
    user?.app_metadata?.role ??
      user?.user_metadata?.role ??
      ""
  );
}

const atlasLocations: Array<{
  id: string;
  nameKey: TranslationKey;
  companyKey: TranslationKey;
  addressKey: TranslationKey;
  noteKey: TranslationKey;
}> = [
  {
    id: "miami",
    nameKey: "miamiHub",
    companyKey: "miamiCompany",
    addressKey: "miamiAddress",
    noteKey: "miamiNote"
  },
  {
    id: "orlando",
    nameKey: "orlandoHub",
    companyKey: "orlandoCompany",
    addressKey: "orlandoAddress",
    noteKey: "orlandoNote"
  },
  {
    id: "supplier-direct",
    nameKey: "supplierDirect",
    companyKey: "supplierDirectCompany",
    addressKey: "supplierDirectAddress",
    noteKey: "supplierDirectNote"
  }
];

export function Nav() {
  const { t, toggleLanguage } = useI18n();
  const [role, setRole] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<(typeof atlasLocations)[number]>(atlasLocations[0]);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    const savedLocation = window.localStorage.getItem("atlas-location");
    const location = atlasLocations.find((item) => item.id === savedLocation);
    if (location) setSelectedLocation(location);

    if (!isSupabaseConfigured || !supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setSignedIn(Boolean(data.user));
      setRole(roleForUser(data.user));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSignedIn(Boolean(session?.user));
      setRole(roleForUser(session?.user ?? null));
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const dashboardHref =
    role === "supplier"
      ? "/dashboard/supplier"
      : role === "route_seller"
        ? "/dashboard/route-seller"
        : "/dashboard/retailer";

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-white">
        <div className="atlas-container flex min-h-10 flex-wrap items-center justify-between gap-3 py-2">
          <p className="text-sm font-black text-atlas-navy">{t("topTagline")}</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-bold text-atlas-navy"
              type="button"
              onClick={() => setLocationOpen(true)}
              aria-label={t("locationButtonLabel")}
            >
              <MapPin size={16} className="text-atlas-blue" />
              {t(selectedLocation.nameKey)}
              <ChevronDown size={15} />
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-black text-atlas-navy transition hover:border-atlas-blue hover:text-atlas-blue"
              type="button"
              onClick={toggleLanguage}
              aria-label={t("languageLabel")}
            >
              <Languages size={15} />
              {t("languageShort")}
            </button>
          </div>
        </div>
      </div>
      <div className="atlas-container flex min-h-20 flex-wrap items-center justify-between gap-3 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-atlas-navy text-white">
            <Building2 size={22} />
          </span>
          <span>
            <span className="block text-2xl font-black tracking-normal text-atlas-navy">Atlas Discount</span>
            <span className="block text-xs font-semibold uppercase text-atlas-blue">
              {t("brandSubline")}
            </span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          {signedIn ? (
            <>
              <Link className="btn-secondary rounded-full" href="/catalog">
                <ShoppingCart size={16} />
                {t("catalog")}
              </Link>
              <Link className="btn-secondary rounded-full" href={dashboardHref}>
                <LayoutDashboard size={16} />
                {t("dashboard")}
              </Link>
              {role === "admin" && (
                <Link className="btn-primary rounded-full" href="/admin">
                  <ShieldCheck size={16} />
                  {t("admin")}
                </Link>
              )}
              <SignOutButton />
            </>
          ) : (
            <>
              <span className="hidden text-base font-semibold text-slate-700 md:inline">{t("becomeA")}</span>
              <Link className="rounded-full bg-atlas-blue px-6 py-2.5 text-base font-semibold text-white transition hover:bg-atlas-navy" href="/register/supplier">
                {t("supplierPathTitle")}
              </Link>
              <Link className="rounded-full bg-atlas-navy px-6 py-2.5 text-base font-semibold text-white transition hover:bg-atlas-blue" href="/register/buyer">
                {t("member")}
              </Link>
              <Link className="rounded-full bg-atlas-red px-6 py-2.5 text-base font-semibold text-white transition hover:bg-red-700" href="/register/route-seller">
                {t("selr")}
              </Link>
              <Link className="rounded-full bg-atlas-navy px-6 py-2.5 text-base font-semibold text-white transition hover:bg-atlas-blue" href="/login">
                <LogIn size={16} />
                {t("signIn")}
              </Link>
            </>
          )}
        </nav>
      </div>
      {locationOpen && (
        <div className="fixed inset-0 z-50 bg-atlas-navy/45" role="dialog" aria-modal="true">
          <div className="ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div className="flex items-center gap-3">
                <MapPin className="text-atlas-blue" />
                <h2 className="text-2xl font-black text-atlas-navy">{t("selectLocation")}</h2>
              </div>
              <button className="rounded-md p-2 text-slate-500 hover:bg-atlas-light hover:text-atlas-navy" type="button" onClick={() => setLocationOpen(false)} aria-label="Close location selector">
                <X size={24} />
              </button>
            </div>
            <div className="border-b border-slate-200 bg-sky-50 p-5">
              <p className="text-sm font-bold uppercase text-atlas-blue">{t("currentLocation")}</p>
              <p className="mt-1 text-lg font-black text-atlas-navy">{t(selectedLocation.nameKey)}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{t(selectedLocation.addressKey)}</p>
            </div>
            <div className="grid flex-1 content-start divide-y divide-slate-200 overflow-y-auto">
              {atlasLocations.map((location) => {
                const active = selectedLocation.id === location.id;
                return (
                  <button
                    key={location.id}
                    className={`grid gap-2 p-5 text-left transition hover:bg-atlas-light ${active ? "border-l-4 border-atlas-blue bg-sky-50" : "border-l-4 border-transparent"}`}
                    type="button"
                    onClick={() => {
                      setSelectedLocation(location);
                      window.localStorage.setItem("atlas-location", location.id);
                    }}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-lg font-black text-atlas-navy">{t(location.nameKey)}</span>
                      <span className={`h-5 w-5 rounded-full border ${active ? "border-atlas-blue bg-atlas-blue" : "border-slate-300 bg-white"}`} />
                    </span>
                    <span className="text-sm font-semibold text-slate-600">{t(location.companyKey)}</span>
                    <span className="text-sm text-slate-600">{t(location.addressKey)}</span>
                    <span className="text-sm font-semibold text-atlas-blue">{t(location.noteKey)}</span>
                  </button>
                );
              })}
            </div>
            <div className="border-t border-slate-200 p-5 text-sm font-semibold text-slate-600">
              {t("savedPreference")}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
