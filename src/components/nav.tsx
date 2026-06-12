"use client";

import Link from "next/link";
import { ChevronDown, LayoutDashboard, LifeBuoy, LogIn, MapPin, ShieldCheck, ShoppingCart, UserRound, X } from "lucide-react";
import { AtlasMark } from "./atlas-logo";
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
  const { t, language, setLanguage } = useI18n();
  const [role, setRole] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<(typeof atlasLocations)[number]>(atlasLocations[0]);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    const savedLocation = window.localStorage.getItem("atlas-location");
    const location = atlasLocations.find((item) => item.id === savedLocation);
    if (location) setSelectedLocation(location);

    if (!isSupabaseConfigured || !supabase) return;

    // The authoritative role comes from the user's profile row; fall back to
    // auth metadata. This keeps the Admin link reliably gated to real admins.
    async function resolveRole(user: { id: string; app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } | null) {
      if (!user || !supabase) return "";
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      return String(data?.role ?? roleForUser(user));
    }

    supabase.auth.getUser().then(async ({ data }) => {
      if (!mounted) return;
      setSignedIn(Boolean(data.user));
      const resolved = await resolveRole(data.user);
      if (mounted) setRole(resolved);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSignedIn(Boolean(session?.user));
      resolveRole(session?.user ?? null).then((resolved) => {
        if (mounted) setRole(resolved);
      });
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
      <div className="bg-atlas-navy text-white">
        <div className="atlas-container flex min-h-10 flex-wrap items-center justify-between gap-3 py-2">
          <Link href="/register/buyer" className="group flex flex-wrap items-center gap-2 text-sm font-bold">
            <span className="rounded-full bg-yellow-300 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-atlas-navy">
              {t("promoBarTag")}
            </span>
            <span>{t("promoBarText")}</span>
            <span className="font-black text-yellow-300 underline-offset-2 group-hover:underline">{t("promoBarCta")} →</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-white/20"
              type="button"
              onClick={() => setLocationOpen(true)}
              aria-label={t("locationButtonLabel")}
            >
              <MapPin size={16} className="text-sky-300" />
              {t(selectedLocation.nameKey)}
              <ChevronDown size={15} />
            </button>
            <div className="inline-flex items-center gap-1.5 text-sm font-semibold" role="group" aria-label="Language">
              <button
                className={`transition ${language === "en" ? "font-bold text-white" : "text-white/50 hover:text-white"}`}
                type="button"
                onClick={() => setLanguage("en")}
                aria-pressed={language === "en"}
              >
                EN
              </button>
              <span className="text-white/30">/</span>
              <button
                className={`transition ${language === "es" ? "font-bold text-white" : "text-white/50 hover:text-white"}`}
                type="button"
                onClick={() => setLanguage("es")}
                aria-pressed={language === "es"}
              >
                ES
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="atlas-container flex min-h-20 flex-wrap items-center gap-x-6 gap-y-3 py-4">
        <Link href="/" className="flex items-center gap-3">
          <AtlasMark size={48} />
          <span>
            <span className="block text-2xl font-black leading-none tracking-tight text-atlas-navy">
              Atlas <span className="text-atlas-blue">Discount</span>
            </span>
            <span className="mt-1 block text-xs font-semibold uppercase text-atlas-blue">
              {t("brandSubline")}
            </span>
          </span>
        </Link>

        {/* Primary shopping menu */}
        <nav className="flex flex-1 flex-wrap items-center gap-x-5 gap-y-2 text-sm font-bold text-atlas-navy">
          <Link className="hover:text-atlas-blue" href="/catalog">{t("navDeals")}</Link>
          <Link className="hover:text-atlas-blue" href="/catalog">{t("navCategories")}</Link>
          <Link className="hover:text-atlas-blue" href={signedIn ? dashboardHref : "/login?next=/catalog"}>{t("navReorder")}</Link>
          <Link className="hover:text-atlas-blue" href="/sell">{t("navSuppliers")}</Link>
          <a className="inline-flex items-center gap-1.5 text-atlas-blue hover:text-atlas-navy" href="https://wa.me/">
            <LifeBuoy size={15} />
            {t("navSupport")}
          </a>
        </nav>

        {/* Right-side actions */}
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          {signedIn ? (
            <>
              <div className="relative">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 font-bold text-atlas-navy transition hover:border-atlas-blue hover:text-atlas-blue"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <UserRound size={16} />
                  {t("account")}
                  <ChevronDown size={15} />
                </button>
                {menuOpen && (
                  <>
                    <button className="fixed inset-0 z-40 cursor-default" tabIndex={-1} aria-hidden onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel" role="menu">
                      <Link
                        className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-atlas-navy hover:bg-atlas-light"
                        href={dashboardHref}
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        <LayoutDashboard size={16} className="text-atlas-blue" />
                        {t("dashboard")}
                      </Link>
                      {role === "admin" && (
                        <Link
                          className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-atlas-navy hover:bg-atlas-light"
                          href="/admin"
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                        >
                          <ShieldCheck size={16} className="text-atlas-blue" />
                          {t("admin")}
                        </Link>
                      )}
                      <div className="border-t border-slate-200 p-2">
                        <SignOutButton />
                      </div>
                    </div>
                  </>
                )}
              </div>
              <Link className="inline-flex items-center gap-2 rounded-full bg-atlas-blue px-6 py-2.5 font-bold text-white transition hover:bg-atlas-navy" href="/catalog">
                <ShoppingCart size={16} />
                {t("shopWholesale")}
              </Link>
            </>
          ) : (
            <>
              <Link className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 font-bold text-atlas-navy transition hover:border-atlas-blue hover:text-atlas-blue" href="/login">
                <LogIn size={16} />
                {t("businessLogin")}
              </Link>
              <Link className="inline-flex items-center gap-2 rounded-full bg-atlas-blue px-6 py-2.5 font-bold text-white transition hover:bg-atlas-navy" href="/catalog">
                <ShoppingCart size={16} />
                {t("shopWholesale")}
              </Link>
            </>
          )}
        </div>
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
