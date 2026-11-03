import type { CartLine, ShippingRateMethod, SupplierFulfillmentRules } from "@/lib/types";

export type BuyerDestination = { zip: string; city?: string; state?: string };
export type SupplierFulfillmentOption = {
  id: "pickup" | "included_delivery" | "shipping";
  label: string;
  detail: string;
  leadTime: string;
  cost: number;
};
export type SupplierFulfillmentGroup = {
  supplierName: string;
  lines: CartLine[];
  cases: number;
  pallets: number;
  palletOnly: boolean;
  options: SupplierFulfillmentOption[];
};

function rulesFor(line: CartLine): SupplierFulfillmentRules | undefined {
  return line.product.spec?.fulfillment;
}

function casesPerPallet(line: CartLine) {
  const configured = Number(line.product.spec?.casesPerPallet);
  if (configured > 0) return configured;
  const ti = Number(line.product.spec?.palletCasesPerFloor);
  const hi = Number(line.product.spec?.palletLayers);
  return ti > 0 && hi > 0 ? ti * hi : 0;
}

function covered(prefixes: string[] | undefined, zip: string) {
  const cleanZip = zip.replace(/\D/g, "").slice(0, 5);
  return Boolean(cleanZip && prefixes?.some((prefix) => cleanZip.startsWith(prefix.replace(/\D/g, ""))));
}

function sameRule<T>(lines: CartLine[], select: (rules: SupplierFulfillmentRules) => T | undefined): T | undefined {
  const values = lines.map((line) => rulesFor(line)).map((rules) => rules && select(rules));
  if (values.some((value) => !value)) return undefined;
  return values[0];
}

function shippingCost(method: ShippingRateMethod, rate: number, cases: number, pallets: number) {
  if (method === "per_case") return rate * cases;
  if (method === "per_pallet") return rate * pallets;
  return rate;
}

export function calculateSupplierFulfillment(cart: CartLine[], destination: BuyerDestination): SupplierFulfillmentGroup[] {
  const bySupplier = new Map<string, CartLine[]>();
  for (const line of cart) {
    const key = line.product.supplierName || "Atlas Supplier";
    bySupplier.set(key, [...(bySupplier.get(key) ?? []), line]);
  }

  return Array.from(bySupplier, ([supplierName, lines]) => {
    const cases = lines.reduce((sum, line) => sum + line.quantity, 0);
    const palletCounts = lines.map((line) => {
      const perPallet = casesPerPallet(line);
      return perPallet > 0 ? line.quantity / perPallet : 0;
    });
    const palletOnly = palletCounts.length > 0 && palletCounts.every((count) => count >= 1 && Number.isInteger(count));
    const pallets = palletOnly ? palletCounts.reduce((sum, count) => sum + count, 0) : 0;
    const options: SupplierFulfillmentOption[] = [];

    const pickup = sameRule(lines, (rules) => rules.pickup);
    if (pickup?.enabled && pickup.address && pickup.city && pickup.state && pickup.zip) {
      options.push({
        id: "pickup",
        label: `Pickup at ${pickup.locationName || supplierName}`,
        detail: `${pickup.address}, ${pickup.city}, ${pickup.state} ${pickup.zip}${pickup.instructions ? ` · ${pickup.instructions}` : ""}`,
        leadTime: pickup.leadTime,
        cost: 0,
      });
    }

    const included = sameRule(lines, (rules) => rules.includedDelivery);
    if (included?.enabled && palletOnly && pallets >= Math.max(1, included.minimumPallets) && covered(included.zipPrefixes, destination.zip)) {
      options.push({
        id: "included_delivery",
        label: "Pallet delivery included",
        detail: `${included.areaLabel || "Supplier delivery area"} · ${pallets} pallet${pallets === 1 ? "" : "s"}`,
        leadTime: included.leadTime,
        cost: 0,
      });
    }

    const shipping = sameRule(lines, (rules) => rules.shipping);
    if (shipping?.enabled && covered(shipping.zipPrefixes, destination.zip)) {
      options.push({
        id: "shipping",
        label: shipping.method || "Supplier shipping",
        detail: `${shipping.coverageLabel || "Supplier shipping area"} · ${shipping.rateMethod.replaceAll("_", " ")}`,
        leadTime: shipping.leadTime,
        cost: shippingCost(shipping.rateMethod, Math.max(0, shipping.rate), cases, Math.max(1, pallets)),
      });
    }

    return { supplierName, lines, cases, pallets, palletOnly, options };
  });
}

export function parseZipPrefixes(value: string) {
  return Array.from(new Set(value.split(/[\s,]+/).map((item) => item.replace(/\D/g, "").slice(0, 5)).filter((item) => item.length >= 2)));
}
