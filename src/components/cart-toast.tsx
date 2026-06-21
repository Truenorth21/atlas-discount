"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, ShoppingCart, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/** Confirmation toast shown after adding to cart from a page that has no visible
 *  cart (the dashboards). Links the buyer to the catalog where the cart lives so
 *  "Add to cart" is never a silent dead end. Auto-dismisses. */
export function CartToast({ brand, onClose }: { brand: string | null; onClose: () => void }) {
  const { t } = useI18n();

  useEffect(() => {
    if (!brand) return;
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [brand, onClose]);

  if (!brand) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2.5 shadow-panel">
      <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
      <p className="text-sm font-bold text-atlas-navy">
        {brand} — {t("addedToCart")}
      </p>
      <Link
        className="inline-flex items-center gap-1.5 rounded-full bg-atlas-blue px-4 py-1.5 text-sm font-bold text-white transition hover:bg-atlas-navy"
        href="/catalog"
        onClick={onClose}
      >
        <ShoppingCart size={15} />
        {t("viewCart")}
      </Link>
      <button
        type="button"
        className="rounded-md p-1 text-slate-400 hover:bg-atlas-light hover:text-atlas-navy"
        onClick={onClose}
        aria-label={t("close")}
      >
        <X size={16} />
      </button>
    </div>
  );
}
