"use client";

import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { whatsappLink } from "@/lib/data";
import { signIn } from "./actions";

export function LoginForm({
  error,
  isConfigured,
  next
}: {
  error?: string;
  isConfigured: boolean;
  next: string;
}) {
  const { language, t } = useI18n();

  return (
    <form action={signIn} className="panel w-full max-w-md overflow-hidden p-0">
      <div className="h-1 bg-atlas-red" />
      <div className="p-6 sm:p-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#eaf3ff] text-atlas-blue">
          <LockKeyhole size={21} />
        </div>
        <p className="mt-5 text-xs font-black uppercase text-atlas-red">{language === "es" ? "Cuenta de Atlas Discount" : "Atlas Discount account"}</p>
        <h1 className="mt-2 text-3xl font-black text-atlas-navy">{t("loginTitle")}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{t("loginBody")}</p>
        {!isConfigured && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {t("demoModeActive")}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <input name="next" type="hidden" value={next} />
        <label className="mt-5 grid gap-2">
          <span className="label">{t("email")}</span>
          <input className="field" name="email" type="email" autoComplete="email" required />
        </label>
        <label className="mt-4 grid gap-2">
          <span className="label">{t("password")}</span>
          <input className="field" name="password" type="password" autoComplete="current-password" required />
        </label>
        <button className="btn-primary mt-5 w-full" type="submit">
          {t("signIn")}
        </button>
        <div className="mt-5 grid grid-cols-2 gap-2 text-sm font-semibold text-atlas-blue">
          <Link href="/register/buyer">{t("registerBuyer")}</Link>
          <Link className="text-right" href="/register/supplier">{t("registerSupplier")}</Link>
          <Link className="col-span-2 text-center" href="/register/route-seller">{t("registerRouteSeller")}</Link>
        </div>
        <p className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-600">
          {t("loginTroubleLabel")}{" "}
          <a className="font-bold text-atlas-blue hover:underline" href={whatsappLink(t("loginTroublePrefill"))} target="_blank" rel="noreferrer">
            {t("contactSupport")}
          </a>
        </p>
      </div>
    </form>
  );
}
