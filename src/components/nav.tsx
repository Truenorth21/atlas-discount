"use client";

import Link from "next/link";
import { ChevronDown, Eye, LayoutDashboard, LifeBuoy, LogIn, MapPin, ShieldCheck, ShoppingCart, UserRound, X } from "lucide-react";
import { AtlasMark } from "./atlas-logo";
import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/browser";
import { productCategories, readHomeHub, whatsappLink, writeHomeHub } from "@/lib/data";
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
  }
];

// The picker id maps to the canonical home hub used by the cart.
function hubForLocationId(id: string): "Miami hub" | "Orlando hub" {
  return id === "orlando" ? "Orlando hub" : "Miami hub";
}

export function Nav() {
  const { t, language, setLanguage } = useI18n();
  const [role, setRole] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<(typeof atlasLocations)[number]>(atlasLocations[0]);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    // Sync the picker to the shared home hub (also set from the cart).
    const applyHomeHub = () => {
      const hub = readHomeHub();
      const match = atlasLocations.find((item) => hubForLocationId(item.id) === hub);
      if (match) setSelectedLocation(match);
    };
    applyHomeHub();
    const onHubChange = () => applyHomeHub();
    window.addEventListener("atlas-home-hub", onHubChange);

    if (!isSupabaseConfigured || !supabase) {
      return () => window.removeEventListener("atlas-home-hub", onHubChange);
    }

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
      window.removeEventListener("atlas-home-hub", onHubChange);
    };
  }, []);

  const dashboardHref =
    role === "admin"
      ? "/admin"
      : role === "supplier"
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
          <div className="relative">
            <button
              type="button"
              className="inline-flex items-center gap-1 hover:text-atlas-blue"
              onClick={() => setCategoriesOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={categoriesOpen}
            >
              {t("navCategories")}
              <ChevronDown size={14} />
            </button>
            {categoriesOpen && (
              <>
                <button className="fixed inset-0 z-40 cursor-default" tabIndex={-1} aria-hidden onClick={() => setCategoriesOpen(false)} />
                <div className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-panel" role="menu">
                  <Link
                    className="block px-4 py-2.5 text-sm font-bold text-atlas-navy hover:bg-atlas-light"
                    href="/catalog"
                    role="menuitem"
                    onClick={() => setCategoriesOpen(false)}
                  >
                    {t("allProducts")}
                  </Link>
                  <div className="my-1 border-t border-slate-100" />
                  {Object.keys(productCategories).map((name) => (
                    <Link
                      key={name}
                      className="block px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-atlas-light hover:text-atlas-blue"
                      href={`/catalog?category=${encodeURIComponent(name)}`}
                      role="menuitem"
                      onClick={() => setCategoriesOpen(false)}
                    >
                      {name}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
          <Link className="hover:text-atlas-blue" href={signedIn ? dashboardHref : "/login?next=/catalog"}>{t("navReorder")}</Link>
          <Link className="hover:text-atlas-blue" href="/sell">{t("navSuppliers")}</Link>
          <a className="inline-flex items-center gap-1.5 text-atlas-blue hover:text-atlas-navy" href={whatsappLink(t("supportPrefill"))} target="_blank" rel="noreferrer">
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
                      {role !== "admin" && (
                        <Link
                          className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-atlas-navy hover:bg-atlas-light"
                          href={dashboardHref}
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                        >
                          <LayoutDashboard size={16} className="text-atlas-blue" />
                          {t("dashboard")}
                        </Link>
                      )}
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
                      {role === "admin" && (
                        <div className="border-t border-slate-200">
                          <p className="flex items-center gap-1.5 px-4 pb-1 pt-3 text-[11px] font-black uppercase tracking-wide text-slate-400">
                            <Eye size={13} />
                            {t("previewAs")}
                          </p>
                          {([
                            { href: "/catalog", label: t("previewBuyerCatalog") },
                            { href: "/dashboard/retailer", label: t("previewBuyerDashboard") },
                            { href: "/dashboard/supplier", label: t("previewSupplierDashboard") },
                            { href: "/dashboard/route-seller", label: t("previewRepDashboard") }
                          ] as const).map((item) => (
                            <Link
                              key={item.href}
                              className="block px-4 py-2 pl-9 text-sm font-semibold text-atlas-navy hover:bg-atlas-light"
                              href={item.href}
                              role="menuitem"
                              onClick={() => setMenuOpen(false)}
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
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
                      writeHomeHub(hubForLocationId(location.id));
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
