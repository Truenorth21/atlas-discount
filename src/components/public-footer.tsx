"use client";

import Link from "next/link";
import { AtlasMark } from "@/components/atlas-logo";
import { useI18n } from "@/lib/i18n";

export function PublicFooter() {
  const { language } = useI18n();
  const es = language === "es";

  return (
    <footer className="atlas-public-footer text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[1.35fr_1fr_1fr] md:px-8">
        <div>
          <AtlasMark size={62} tone="white" />
          <p className="mt-5 max-w-md text-sm leading-6 text-white/70">
            {es
              ? "Suministro mayorista para comercios, revendedores y compradores empresariales verificados."
              : "Wholesale supply for verified retailers, resellers, and business buyers."}
          </p>
          <p className="mt-5 text-sm font-semibold text-white">
            {es
              ? "Atlas Discount es una empresa de True North Trading, LLC."
              : "Atlas Discount is a True North Trading, LLC company."}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-white/50">
            {es ? "Comprar" : "Shop"}
          </h3>
          <div className="mt-4 grid gap-3 text-sm">
            <Link href="/catalog" className="text-white/80 hover:text-white">
              {es ? "Catálogo" : "Catalog"}
            </Link>
            <Link href="/deals" className="text-white/80 hover:text-white">
              {es ? "Ofertas semanales" : "Weekly deals"}
            </Link>
            <Link href="/register/buyer" className="text-white/80 hover:text-white">
              {es ? "Abrir cuenta mayorista" : "Open a wholesale account"}
            </Link>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-white/50">
            {es ? "Trabaja con Atlas" : "Work with Atlas"}
          </h3>
          <div className="mt-4 grid gap-3 text-sm">
            <Link href="/register/supplier" className="text-white/80 hover:text-white">
              {es ? "Proveedores" : "Suppliers"}
            </Link>
            <Link href="/register/route-seller" className="text-white/80 hover:text-white">
              {es ? "Representantes de ventas" : "Sales representatives"}
            </Link>
            <Link href="/login" className="text-white/80 hover:text-white">
              {es ? "Iniciar sesión" : "Sign in"}
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-5 text-xs text-white/50 md:px-8">
          <span>© 2026 Atlas Discount</span>
          <span>Marketplace · Fulfillment · Wholesale Network</span>
        </div>
      </div>
    </footer>
  );
}
