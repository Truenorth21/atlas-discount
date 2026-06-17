"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, FileUp, UploadCloud } from "lucide-react";
import { registerUser } from "@/app/register/actions";
import { documentHints, documentRequirements, routeSellerProductLanes, routeSellerPrograms, routeSellerTerritories } from "@/lib/data";
import { requiresExpirationDate } from "@/lib/documents";
import { useI18n } from "@/lib/i18n";
import { isSupabaseConfigured } from "@/lib/supabase/browser";
import type { AtlasHub, BusinessDocument, RouteSellerPreference } from "@/lib/types";
import { useAtlasStore } from "./local-store";

function documentId(type: "buyer" | "supplier" | "route_seller", label: string) {
  return `${type}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

export function RegistrationForm({ type, error }: { type: "buyer" | "supplier" | "route_seller"; error?: string }) {
  const { t } = useI18n();
  const { addApplication } = useAtlasStore();
  const [submitted, setSubmitted] = useState(false);
  const requirements = documentRequirements[type];
  const [routeHub, setRouteHub] = useState<Exclude<AtlasHub, "Supplier direct">>("Miami hub");
  const [routeTerritory, setRouteTerritory] = useState(routeSellerTerritories["Miami hub"][0]);
  const territoryOptions = routeSellerTerritories[routeHub];
  const [documents, setDocuments] = useState<BusinessDocument[]>(
    requirements.map((label) => ({
      id: documentId(type, label),
      label,
      status: "needed"
    }))
  );

  function onDocumentUpload(documentIdToUpdate: string, fileName?: string) {
    setDocuments((current) =>
      current.map((document) =>
        document.id === documentIdToUpdate
          ? {
              ...document,
              fileName,
              status: fileName ? "uploaded" : "needed",
              rejectionReason: undefined
            }
          : document
      )
    );
  }

  function onExpirationChange(documentIdToUpdate: string, expiresAt: string) {
    setDocuments((current) =>
      current.map((document) =>
        document.id === documentIdToUpdate
          ? {
              ...document,
              expiresAt: expiresAt || undefined
            }
          : document
      )
    );
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (isSupabaseConfigured) return;

    event.preventDefault();
    const form = new FormData(event.currentTarget);

    addApplication({
      id: `app-${Date.now()}`,
      type,
      companyName: String(form.get("companyName")),
      contactName: String(form.get("contactName")),
      email: String(form.get("email")),
      phone: String(form.get("phone")),
      status: "pending",
      documents,
      newsletterOptIn: type === "buyer" ? form.get("newsletterOptIn") === "on" : undefined,
      businessDetails:
        type === "buyer"
          ? {
              ein: String(form.get("businessEin") ?? ""),
              address: String(form.get("businessAddress") ?? ""),
              city: String(form.get("businessCity") ?? ""),
              state: String(form.get("businessState") ?? ""),
              zip: String(form.get("businessZip") ?? "")
            }
          : undefined,
      pickupLocation:
        type === "supplier"
          ? {
              address: String(form.get("warehouseAddress") ?? ""),
              city: String(form.get("warehouseCity") ?? ""),
              state: String(form.get("warehouseState") ?? ""),
              zip: String(form.get("warehouseZip") ?? ""),
              contact: String(form.get("warehouseContact") ?? "") || undefined,
              phone: String(form.get("warehousePhone") ?? "") || undefined,
              hours: String(form.get("warehouseHours") ?? "") || undefined
            }
          : undefined,
      routePreference:
        type === "route_seller"
          ? {
              program: String(form.get("routeProgram")) as RouteSellerPreference["program"],
              hub: String(form.get("routeHub")) as RouteSellerPreference["hub"],
              territory: String(form.get("routeTerritory")),
              productLane: String(form.get("productLane"))
            }
          : undefined,
      submittedAt: new Date().toISOString().slice(0, 10)
    });
    setSubmitted(true);
    event.currentTarget.reset();
  }

  if (submitted) {
    return (
      <div className="panel p-8">
        <h1 className="text-2xl font-black text-atlas-navy">{t("applicationReceived")}</h1>
        <p className="mt-3 text-slate-600">
          {t("applicationReceivedBody")}
        </p>
        <a className="btn-primary mt-6" href={type === "buyer" ? "/dashboard/retailer" : type === "route_seller" ? "/dashboard/route-seller" : "/dashboard/supplier"}>
          {t("continueToDashboard")}
        </a>
      </div>
    );
  }

  return (
    <form action={isSupabaseConfigured ? registerUser : undefined} onSubmit={onSubmit} className="panel grid gap-5 p-6">
      <input name="role" type="hidden" value={type} />
      <div>
        <h1 className="text-3xl font-black text-atlas-navy">
          {type === "buyer" ? t("buyerRegistrationTitle") : type === "route_seller" ? t("routeSellerRegistrationTitle") : t("supplierRegistrationTitle")}
        </h1>
        <p className="mt-2 text-slate-600">
          {type === "buyer"
            ? t("buyerRegistrationBody")
            : type === "route_seller"
              ? t("routeSellerRegistrationBody")
              : t("supplierRegistrationBody")}
        </p>
      </div>
      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="label">{t("companyName")}</span>
          <input className="field" name="companyName" required />
        </label>
        <label className="grid gap-2">
          <span className="label">{t("contactName")}</span>
          <input className="field" name="contactName" required />
        </label>
        <label className="grid gap-2">
          <span className="label">{t("email")}</span>
          <input className="field" name="email" type="email" required />
        </label>
        <label className="grid gap-2">
          <span className="label">{t("phone")}</span>
          <input className="field" name="phone" required />
        </label>
        <label className="grid gap-2">
          <span className="label">{t("password")}</span>
          <input className="field" name="password" minLength={8} type="password" required />
        </label>
      </div>
      {type === "buyer" && (
        <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-atlas-light p-4">
          <input className="mt-0.5 h-5 w-5 shrink-0 accent-atlas-blue" name="newsletterOptIn" type="checkbox" defaultChecked />
          <span>
            <span className="block text-sm font-bold text-atlas-navy">{t("newsletterOptInLabel")}</span>
            <span className="mt-0.5 block text-xs text-slate-600">{t("newsletterOptInHelp")}</span>
          </span>
        </label>
      )}
      {type === "route_seller" && (
        <div className="grid gap-3 rounded-lg border border-slate-200 bg-atlas-light p-4">
          <div>
            <p className="text-sm font-black text-atlas-navy">{t("routeAssignmentPreferences")}</p>
            <p className="mt-1 text-sm text-slate-600">
              {t("routeAssignmentBody")}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="label">{t("sellerProgram")}</span>
              <select className="field" name="routeProgram" required>
                {routeSellerPrograms.map((program) => (
                  <option key={program}>{program}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="label">{t("preferredAtlasHub")}</span>
              <select
                className="field"
                name="routeHub"
                required
                value={routeHub}
                onChange={(event) => {
                  const nextHub = event.target.value as Exclude<AtlasHub, "Supplier direct">;
                  setRouteHub(nextHub);
                  setRouteTerritory(routeSellerTerritories[nextHub][0]);
                }}
              >
                {Object.keys(routeSellerTerritories).map((hub) => (
                  <option key={hub}>{hub}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="label">{t("preferredTerritory")}</span>
              <select
                className="field"
                name="routeTerritory"
                required
                value={routeTerritory}
                onChange={(event) => setRouteTerritory(event.target.value)}
              >
                {territoryOptions.map((territory) => (
                  <option key={territory}>{territory}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="label">{t("primaryProductLane")}</span>
              <select className="field" name="productLane" required>
                {routeSellerProductLanes.map((lane) => (
                  <option key={lane}>{lane}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}
      {type === "buyer" && (
        <div className="grid gap-3 rounded-lg border border-slate-200 bg-atlas-light p-4">
          <div>
            <p className="text-sm font-black text-atlas-navy">{t("businessSectionTitle")}</p>
            <p className="mt-1 text-sm text-slate-600">{t("businessSectionBody")}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="label">{t("businessEinLabel")}</span>
              <input className="field" name="businessEin" required />
            </label>
            <label className="grid gap-2">
              <span className="label">{t("businessAddressLabel")}</span>
              <input className="field" name="businessAddress" required />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2">
              <span className="label">{t("warehouseCityLabel")}</span>
              <input className="field" name="businessCity" required />
            </label>
            <label className="grid gap-2">
              <span className="label">{t("warehouseStateLabel")}</span>
              <input className="field" name="businessState" required />
            </label>
            <label className="grid gap-2">
              <span className="label">{t("warehouseZipLabel")}</span>
              <input className="field" name="businessZip" required />
            </label>
          </div>
        </div>
      )}
      {type === "supplier" && (
        <div className="grid gap-3 rounded-lg border border-slate-200 bg-atlas-light p-4">
          <div>
            <p className="text-sm font-black text-atlas-navy">{t("warehouseSectionTitle")}</p>
            <p className="mt-1 text-sm text-slate-600">{t("warehouseSectionBody")}</p>
          </div>
          <label className="grid gap-2">
            <span className="label">{t("warehouseAddressLabel")}</span>
            <input className="field" name="warehouseAddress" required />
          </label>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2">
              <span className="label">{t("warehouseCityLabel")}</span>
              <input className="field" name="warehouseCity" required />
            </label>
            <label className="grid gap-2">
              <span className="label">{t("warehouseStateLabel")}</span>
              <input className="field" name="warehouseState" required />
            </label>
            <label className="grid gap-2">
              <span className="label">{t("warehouseZipLabel")}</span>
              <input className="field" name="warehouseZip" required />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2">
              <span className="label">{t("warehouseContactLabel")}</span>
              <input className="field" name="warehouseContact" />
            </label>
            <label className="grid gap-2">
              <span className="label">{t("warehousePhoneLabel")}</span>
              <input className="field" name="warehousePhone" />
            </label>
            <label className="grid gap-2">
              <span className="label">{t("warehouseHoursLabel")}</span>
              <input className="field" name="warehouseHours" placeholder={t("warehouseHoursPlaceholder")} />
            </label>
          </div>
        </div>
      )}
      <div className="grid gap-2">
        <span className="label">
          {type === "buyer" ? t("buyerDocumentLabel") : type === "route_seller" ? t("routeSellerDocumentLabel") : t("supplierDocumentLabel")}
        </span>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-black text-atlas-navy">{t("requiredDocumentChecklist")}</p>
          <div className="mt-3 grid gap-3">
            {documents.map((document, index) => (
              <div key={document.id} className="rounded-md border border-slate-200 bg-atlas-light p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2">
                    <CheckCircle2
                      className={`mt-0.5 shrink-0 ${document.status === "uploaded" ? "text-emerald-600" : "text-atlas-blue"}`}
                      size={17}
                    />
                    <div>
                      <p className="text-sm font-bold text-atlas-navy">{document.label}</p>
                      {documentHints[document.label] && (
                        <p className="mt-0.5 text-xs text-slate-500">{documentHints[document.label]}</p>
                      )}
                      <p className="mt-0.5 text-xs text-slate-600">
                        {document.fileName ? `${t("uploaded")}: ${document.fileName}` : t("waitingForUpload")}
                      </p>
                      {document.expiresAt && (
                        <p className="text-xs font-semibold text-atlas-blue">{t("expires")}: {document.expiresAt}</p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`badge ${
                      document.status === "uploaded" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {document.status}
                  </span>
                </div>
                <label className="btn-secondary mt-3 w-fit cursor-pointer">
                  <FileUp size={16} />
                  {document.fileName ? t("replaceFile") : t("uploadFile")}
                  <input
                    className="sr-only"
                    name={`document-${index}`}
                    type="file"
                    required={!document.fileName}
                    onChange={(event) => onDocumentUpload(document.id, event.target.files?.[0]?.name)}
                  />
                </label>
                {requiresExpirationDate(document.label) && (
                  <label className="mt-3 grid max-w-xs gap-2">
                    <span className="label">{t("expirationDate")}</span>
                    <input
                      className="field"
                      name={`document-expiration-${index}`}
                      type="date"
                      value={document.expiresAt ?? ""}
                      required
                      onChange={(event) => onExpirationChange(document.id, event.target.value)}
                    />
                  </label>
                )}
                <input name="documentLabels" type="hidden" value={document.label} />
              </div>
            ))}
          </div>
        </div>
        <span className="flex min-h-20 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-atlas-light p-5 text-center text-sm text-slate-600">
          <UploadCloud className="mb-2 text-atlas-blue" />
          {t("uploadOneByOne")}
        </span>
      </div>
      <button className="btn-primary" type="submit">
        {t("submitForApproval")}
      </button>
    </form>
  );
}
