"use client";

import { ChangeEvent, useState } from "react";
import readXlsxFile from "read-excel-file/browser";
import { AlertTriangle, Download, UploadCloud } from "lucide-react";
import { atlasHubs, productFields } from "@/lib/data";
import type { AtlasHub, Product } from "@/lib/types";
import { useAtlasStore } from "./local-store";

function normalize(row: Record<string, unknown>, index: number): Product {
  const get = (name: string) => String(row[name] ?? row[name.toLowerCase()] ?? "").trim();
  const number = (name: string) => Number(get(name).replace(/[$,]/g, "")) || 0;
  const preferredHub = atlasHubs.includes(get("preferred Atlas hub") as AtlasHub)
    ? (get("preferred Atlas hub") as AtlasHub)
    : "Orlando hub";

  return {
    id: `upload-${Date.now()}-${index}`,
    sku: get("SKU") || `SKU-${index + 1}`,
    brand: get("brand"),
    upc: get("UPC"),
    productName: get("product name") || get("description"),
    description: get("description"),
    category: get("category"),
    subcategory: get("subcategory"),
    unitSize: get("unit size"),
    imageUrl: get("image URL") || "",
    productDimensions: get("product dimensions"),
    unitWeight: get("unit weight"),
    casePack: number("case pack"),
    caseDimensions: get("case dimensions"),
    caseWeight: get("case weight"),
    palletConfiguration: get("pallet configuration"),
    supplierCost: number("supplier cost"),
    suggestedRetail: number("suggested retail"),
    moq: number("MOQ"),
    leadTime: get("lead time"),
    inventoryAvailable: number("inventory available"),
    location: get("pickup/shipping location"),
    pickupLocation: get("pickup location") || get("pickup/shipping location"),
    shippingLocation: get("shipping location") || get("pickup/shipping location"),
    deliveryRadius: get("delivery radius"),
    preferredHub,
    routeRecommendation:
      preferredHub === "Miami hub"
        ? "Route through Miami for South Florida, port-adjacent, and import-closeout lanes."
        : preferredHub === "Orlando hub"
          ? "Route through Orlando for Central Florida consolidation and statewide delivery lanes."
          : "Supplier can ship or release orders directly without Atlas hub handling.",
    status: "pending",
    supplierName: "Current Supplier"
  };
}

function validate(product: Product) {
  const errors: string[] = [];
  if (!product.sku) errors.push("Missing SKU");
  if (!product.brand) errors.push("Missing brand");
  if (!product.upc) errors.push("Missing UPC");
  if (!product.productName) errors.push("Missing product name");
  if (!product.description) errors.push("Missing description");
  if (!product.category) errors.push("Missing category");
  if (!product.unitSize) errors.push("Missing unit size");
  if (!product.productDimensions) errors.push("Missing product dimensions");
  if (!product.caseDimensions) errors.push("Missing case dimensions");
  if (!product.palletConfiguration) errors.push("Missing pallet configuration");
  if (product.casePack <= 0) errors.push("Case pack must be greater than 0");
  if (product.supplierCost <= 0) errors.push("Supplier cost must be greater than 0");
  if (product.moq <= 0) errors.push("MOQ must be greater than 0");
  if (product.inventoryAvailable < 0) errors.push("Inventory cannot be negative");
  if (!product.location) errors.push("Missing pickup/shipping location");
  if (!product.pickupLocation) errors.push("Missing pickup location");
  if (!product.shippingLocation) errors.push("Missing shipping location");
  if (!product.deliveryRadius) errors.push("Missing delivery radius");
  return errors;
}

export function ProductUpload({
  defaultStatus = "pending",
  supplierName = "Current Supplier",
  submitLabel = "Submit valid rows",
  submittedMessage = "valid products submitted for admin review."
}: {
  defaultStatus?: Product["status"];
  supplierName?: string;
  submitLabel?: string;
  submittedMessage?: string;
}) {
  const { addProducts } = useAtlasStore();
  const [message, setMessage] = useState("No upload yet.");
  const [preview, setPreview] = useState<Array<{ product: Product; errors: string[] }>>([]);

  function downloadTemplate() {
    const blob = new Blob([`${productFields.join(",")}\n`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "atlas-discount-product-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function parseCsv(text: string) {
    const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
    const headers = headerLine.split(",").map((item) => item.trim());
    return lines.map((line) =>
      Object.fromEntries(line.split(",").map((value, index) => [headers[index], value.trim()]))
    );
  }

  async function onUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    let rows: Record<string, unknown>[] = [];
    if (file.name.toLowerCase().endsWith(".csv")) {
      rows = parseCsv(await file.text());
    } else {
      const [headerRow, ...dataRows] = (await readXlsxFile(file) as unknown) as unknown[][];
      const headers = headerRow.map((value) => String(value ?? ""));
      rows = dataRows.map((row) =>
        Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]))
      );
    }
    const products = rows.map((row, index) => ({
      ...normalize(row, index),
      status: defaultStatus,
      supplierName
    }));
    setPreview(products.map((product) => ({ product, errors: validate(product) })));
    setMessage(`${products.length} rows parsed. Review validation before submitting.`);
  }

  function submitValidProducts() {
    const validProducts = preview.filter((row) => row.errors.length === 0).map((row) => row.product);
    addProducts(validProducts);
    setMessage(`${validProducts.length} ${submittedMessage}`);
    setPreview([]);
  }

  return (
    <div className="panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-atlas-navy">Product sheet</h2>
          <p className="mt-1 text-sm text-slate-600">Download the template, fill it in, then upload CSV or Excel.</p>
        </div>
        <button className="btn-secondary" type="button" onClick={downloadTemplate}>
          <Download size={16} />
          Template
        </button>
      </div>
      <label className="mt-5 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-atlas-light p-4 text-sm text-slate-600">
        <UploadCloud className="mb-2 text-atlas-blue" />
        Upload completed `.xlsx` or `.csv` sheet
        <input className="sr-only" type="file" accept=".xlsx,.xls,.csv" onChange={onUpload} />
      </label>
      <p className="mt-3 text-sm font-semibold text-atlas-blue">{message}</p>
      {preview.length > 0 && (
        <div className="mt-5 rounded-lg border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-3">
            <div>
              <p className="font-black text-atlas-navy">Upload preview</p>
              <p className="text-sm text-slate-600">
                {preview.filter((row) => row.errors.length === 0).length} valid / {preview.length} total rows
              </p>
            </div>
            <button className="btn-primary" type="button" onClick={submitValidProducts}>
              {submitLabel}
            </button>
          </div>
          <div className="max-h-80 overflow-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-atlas-light text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">SKU</th>
                  <th className="px-3 py-2">Brand</th>
                  <th className="px-3 py-2">Hub</th>
                  <th className="px-3 py-2">Cost</th>
                  <th className="px-3 py-2">Validation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {preview.map(({ product, errors }) => (
                  <tr key={product.id}>
                    <td className="px-3 py-2 font-bold">{product.sku}</td>
                    <td className="px-3 py-2">{product.brand}</td>
                    <td className="px-3 py-2">{product.preferredHub}</td>
                    <td className="px-3 py-2">${product.supplierCost.toFixed(2)}</td>
                    <td className="px-3 py-2">
                      {errors.length === 0 ? (
                        <span className="badge bg-emerald-50 text-emerald-700">Valid</span>
                      ) : (
                        <span className="flex gap-2 text-red-700">
                          <AlertTriangle className="shrink-0" size={16} />
                          {errors.join(", ")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
