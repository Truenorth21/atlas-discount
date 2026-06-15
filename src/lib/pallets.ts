import type { CartLine, Product } from "./types";
import { productPalletSize } from "./pricing";

/** Default max stacked weight for a single pallet load (lb) — standard GMA pallet ballpark. */
export const DEFAULT_MAX_PALLET_WEIGHT_LB = 2200;

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Master-case weight in pounds: prefer the structured spec, else parse the legacy string. */
export function caseWeightLb(product: Product): number {
  const spec = product.spec?.caseDims;
  if (spec?.weight && spec.weight > 0) return spec.weightUnit === "oz" ? spec.weight / 16 : spec.weight;
  const raw = product.caseWeight?.trim();
  if (!raw) return 0;
  const value = Number(raw.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(value) || value <= 0) return 0;
  return /oz/i.test(raw) ? value / 16 : value;
}

export type PalletItem = { sku: string; productName: string; cases: number; weightLb: number };

export type PlannedPallet = {
  index: number;
  kind: "full" | "mixed";
  items: PalletItem[];
  cases: number;
  weightLb: number;
  /** Footprint/stack utilization 0–100, using each product's cases-per-pallet (which bakes in its Ti×Hi). */
  fillPct: number;
  /** True when a single case already exceeds the max pallet weight (placed alone, flagged). */
  overweight?: boolean;
};

export type PalletPlan = {
  pallets: PlannedPallet[];
  totalPallets: number;
  fullPallets: number;
  mixedPallets: number;
  totalCases: number;
  totalWeightLb: number;
  /** Supplier-direct lines ship from the supplier and are not palletized at the hub. */
  supplierDirect: PalletItem[];
  /** Lines missing a cases-per-pallet config — can't be planned until set. */
  needsConfig: PalletItem[];
  maxPalletWeightLb: number;
};

type WorkingPallet = { items: PalletItem[]; fill: number; weight: number; cases: number; overweight: boolean };

/**
 * Plan how an order's cases pack onto pallets for the hub.
 *
 * Strategy: each product first fills as many dedicated full pallets as it can
 * (capped by count AND max weight), then all leftovers are packed together into
 * mixed pallets with a first-fit-decreasing greedy. A case of product P occupies
 * 1/casesPerPallet(P) of a pallet's footprint; a pallet closes when footprint
 * reaches 100% or the next case would exceed the max weight.
 */
export function planOrderPallets(lines: CartLine[], opts: { maxPalletWeightLb?: number } = {}): PalletPlan {
  const maxWeight = opts.maxPalletWeightLb && opts.maxPalletWeightLb > 0 ? opts.maxPalletWeightLb : DEFAULT_MAX_PALLET_WEIGHT_LB;
  const pallets: PlannedPallet[] = [];
  const supplierDirect: PalletItem[] = [];
  const needsConfig: PalletItem[] = [];
  const remainders: Array<{ sku: string; productName: string; cases: number; cpp: number; caseWeight: number }> = [];

  const name = (p: Product) => p.brand || p.productName || p.sku;
  const itemOf = (p: Product, cases: number, cw: number): PalletItem => ({ sku: p.sku, productName: name(p), cases, weightLb: round1(cases * cw) });

  for (const line of lines) {
    const p = line.product;
    const qty = line.quantity;
    if (qty <= 0) continue;
    const cw = caseWeightLb(p);
    if (p.preferredHub === "Supplier direct") {
      supplierDirect.push(itemOf(p, qty, cw));
      continue;
    }
    const cpp = productPalletSize(p);
    if (!cpp || cpp <= 0) {
      needsConfig.push(itemOf(p, qty, cw));
      continue;
    }
    // Weight-aware full-pallet capacity: never stack heavier than the max.
    const cap = cw > 0 ? Math.max(1, Math.min(cpp, Math.floor(maxWeight / cw))) : cpp;
    const full = Math.floor(qty / cap);
    for (let i = 0; i < full; i++) {
      pallets.push({
        index: 0,
        kind: "full",
        items: [itemOf(p, cap, cw)],
        cases: cap,
        weightLb: round1(cap * cw),
        fillPct: Math.min(100, Math.round((cap / cpp) * 100)),
        overweight: cw > 0 && cw > maxWeight
      });
    }
    const rem = qty - full * cap;
    if (rem > 0) remainders.push({ sku: p.sku, productName: name(p), cases: rem, cpp, caseWeight: cw });
  }

  // Pack leftovers into mixed pallets (first-fit decreasing by footprint share).
  remainders.sort((a, b) => b.cases / b.cpp - a.cases / a.cpp);
  const closed: WorkingPallet[] = [];
  let cur: WorkingPallet | null = null;
  const fresh = (): WorkingPallet => ({ items: [], fill: 0, weight: 0, cases: 0, overweight: false });
  const place = (pal: WorkingPallet, r: (typeof remainders)[number], cases: number) => {
    const existing = pal.items.find((it) => it.sku === r.sku);
    if (existing) {
      existing.cases += cases;
      existing.weightLb = round1(existing.cases * r.caseWeight);
    } else {
      pal.items.push({ sku: r.sku, productName: r.productName, cases, weightLb: round1(cases * r.caseWeight) });
    }
    pal.fill += cases / r.cpp;
    pal.weight += cases * r.caseWeight;
    pal.cases += cases;
  };

  for (const r of remainders) {
    let left = r.cases;
    while (left > 0) {
      if (!cur) cur = fresh();
      const fillRoom = 1 - cur.fill;
      const byFill = Math.floor((fillRoom + 1e-9) * r.cpp);
      const byWeight = r.caseWeight > 0 ? Math.floor((maxWeight - cur.weight) / r.caseWeight) : Infinity;
      let fit = Math.min(left, byFill, byWeight);
      if (fit <= 0) {
        if (cur.cases === 0) {
          // A single case already overflows an empty pallet (overweight) — place it alone and flag.
          place(cur, r, 1);
          cur.overweight = true;
          left -= 1;
          closed.push(cur);
          cur = null;
          continue;
        }
        closed.push(cur);
        cur = null;
        continue;
      }
      place(cur, r, fit);
      left -= fit;
    }
  }
  if (cur && cur.cases > 0) closed.push(cur);

  for (const wp of closed) {
    pallets.push({
      index: 0,
      kind: "mixed",
      items: wp.items,
      cases: wp.cases,
      weightLb: round1(wp.weight),
      fillPct: Math.min(100, Math.round(wp.fill * 100)),
      overweight: wp.overweight
    });
  }

  pallets.forEach((pallet, i) => (pallet.index = i + 1));
  const fullPallets = pallets.filter((p) => p.kind === "full").length;
  const mixedPallets = pallets.filter((p) => p.kind === "mixed").length;

  return {
    pallets,
    totalPallets: pallets.length,
    fullPallets,
    mixedPallets,
    totalCases: pallets.reduce((s, p) => s + p.cases, 0),
    totalWeightLb: round1(pallets.reduce((s, p) => s + p.weightLb, 0)),
    supplierDirect,
    needsConfig,
    maxPalletWeightLb: maxWeight
  };
}
