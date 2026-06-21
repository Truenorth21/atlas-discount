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
  const { t } = useI18n();

  return (
    <form action={signIn} className="panel w-full max-w-md p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-atlas-navy to-atlas-blue text-white shadow-panel">
        <LockKeyhole size={22} />
      </div>
      <h1 className="mt-5 text-3xl font-black text-atlas-navy">{t("loginTitle")}</h1>
      <p className="mt-2 text-sm text-slate-600">{t("loginBody")}</p>
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
        <input className="field" name="email" type="email" required />
      </label>
      <label className="mt-4 grid gap-2">
        <span className="label">{t("password")}</span>
        <input className="field" name="password" type="password" required />
      </label>
      <button className="btn-primary mt-5 w-full" type="submit">
        {t("signIn")}
      </button>
      <div className="mt-5 flex flex-wrap justify-between gap-x-4 gap-y-2 text-sm font-semibold text-atlas-blue">
        <Link href="/register/buyer">{t("registerBuyer")}</Link>
        <Link href="/register/supplier">{t("registerSupplier")}</Link>
        <Link href="/register/route-seller">{t("registerRouteSeller")}</Link>
      </div>
      <p className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-600">
        {t("loginTroubleLabel")}{" "}
        <a className="font-bold text-atlas-blue hover:underline" href={whatsappLink(t("loginTroublePrefill"))} target="_blank" rel="noreferrer">
          {t("contactSupport")}
        </a>
      </p>
    </form>
  );
}
