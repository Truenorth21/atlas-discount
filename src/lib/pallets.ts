import type { CartLine, OrderRequest, Product } from "./types";

export function casesPerPallet(palletConfiguration: string) {
  const match = palletConfiguration.match(/(\d+)\s*cases?/i);
  return match ? Number(match[1]) : 0;
}

/** Pallet size: a direct cases-per-pallet override wins, then Ti×Hi spec, then the legacy text field. */
export function productPalletSize(product: Product) {
  const direct = product.spec?.casesPerPallet ?? 0;
  if (direct > 0) return direct;
  const fromSpec = (product.spec?.palletCasesPerFloor ?? 0) * (product.spec?.palletLayers ?? 0);
  return fromSpec > 0 ? fromSpec : casesPerPallet(product.palletConfiguration);
}

/** Default max stacked weight for a single pallet load (lb) — standard GMA pallet ballpark. */
export const DEFAULT_MAX_PALLET_WEIGHT_LB = 2200;
/** Default max stacked height for a single pallet (in) — common single-stack DC limit. */
export const DEFAULT_MAX_PALLET_HEIGHT_IN = 60;
/** Default pallet deck height (in) subtracted before stacking cases. */
export const DEFAULT_PALLET_BASE_HEIGHT_IN = 6;
/** Default GMA pallet footprint (in). */
export const DEFAULT_PALLET_LENGTH_IN = 48;
export const DEFAULT_PALLET_WIDTH_IN = 40;

/** Cases that fit on one pallet floor from the case footprint (better of two
 *  orientations). 0 when case length/width are unknown. */
export function caseFootprintCasesPerFloor(
  product: Product,
  palletLengthIn = DEFAULT_PALLET_LENGTH_IN,
  palletWidthIn = DEFAULT_PALLET_WIDTH_IN
): number {
  const d = product.spec?.caseDims;
  const length = d?.length ?? 0;
  const width = d?.width ?? 0;
  if (length <= 0 || width <= 0) return 0;
  const fitA = Math.floor(palletLengthIn / length) * Math.floor(palletWidthIn / width);
  const fitB = Math.floor(palletLengthIn / width) * Math.floor(palletWidthIn / length);
  return Math.max(fitA, fitB);
}

/** The cases-per-pallet Atlas will use: explicit config (Ti×Hi / override / legacy)
 *  wins, else computed from the case dimensions. 0 when neither is available. */
export function resolvedCasesPerPallet(
  product: Product,
  opts: { palletLengthIn?: number; palletWidthIn?: number; maxPalletHeightIn?: number; palletBaseHeightIn?: number; maxPalletWeightLb?: number } = {}
): number {
  const explicit = productPalletSize(product);
  return explicit > 0 ? explicit : cppFromDims(product, opts);
}

/** Cases-per-pallet computed purely from case dimensions + weight + pallet limits.
 *  Used as the fallback when a product has no explicit pallet config. 0 when the
 *  case length/width/height are unknown (can't be derived). */
export function cppFromDims(
  product: Product,
  opts: {
    palletLengthIn?: number;
    palletWidthIn?: number;
    maxPalletHeightIn?: number;
    palletBaseHeightIn?: number;
    maxPalletWeightLb?: number;
  } = {}
): number {
  const palletL = opts.palletLengthIn && opts.palletLengthIn > 0 ? opts.palletLengthIn : DEFAULT_PALLET_LENGTH_IN;
  const palletW = opts.palletWidthIn && opts.palletWidthIn > 0 ? opts.palletWidthIn : DEFAULT_PALLET_WIDTH_IN;
  const maxHeight = opts.maxPalletHeightIn && opts.maxPalletHeightIn > 0 ? opts.maxPalletHeightIn : DEFAULT_MAX_PALLET_HEIGHT_IN;
  const base = opts.palletBaseHeightIn && opts.palletBaseHeightIn > 0 ? opts.palletBaseHeightIn : DEFAULT_PALLET_BASE_HEIGHT_IN;
  const maxWeight = opts.maxPalletWeightLb && opts.maxPalletWeightLb > 0 ? opts.maxPalletWeightLb : DEFAULT_MAX_PALLET_WEIGHT_LB;
  const floor = caseFootprintCasesPerFloor(product, palletL, palletW);
  const ch = caseHeightIn(product);
  if (floor <= 0 || ch <= 0) return 0;
  const usable = Math.max(0, maxHeight - base);
  const layers = Math.max(1, Math.floor(usable / ch));
  let cpp = floor * layers;
  const cw = caseWeightLb(product);
  if (cw > 0) cpp = Math.min(cpp, Math.floor(maxWeight / cw));
  return Math.max(0, cpp);
}

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

/** Master-case height in inches from the structured spec (0 when unknown). */
export function caseHeightIn(product: Product): number {
  const h = product.spec?.caseDims?.height;
  return h && h > 0 ? h : 0;
}

/** Cases that fit on one pallet floor/layer (the "Ti"), 0 when unknown. */
export function casesPerFloor(product: Product): number {
  const f = product.spec?.palletCasesPerFloor;
  return f && f > 0 ? f : 0;
}

export type PalletItem = { sku: string; productName: string; cases: number; weightLb: number };

export type PlannedPallet = {
  index: number;
  kind: "full" | "mixed";
  items: PalletItem[];
  cases: number;
  weightLb: number;
  /** Estimated stacked height (in, incl. deck) — tallest column on the pallet. 0 when case heights are unknown. */
  heightIn: number;
  /** Footprint/stack utilization 0–100, using each product's cases-per-pallet (which bakes in its Ti×Hi). */
  fillPct: number;
  /** True when a single case already exceeds the max pallet weight (placed alone, flagged). */
  overweight?: boolean;
  /** True when the stack exceeds the max pallet height (e.g. one case taller than the limit). */
  overheight?: boolean;
};

export type PalletPlan = {
  pallets: PlannedPallet[];
  totalPallets: number;
  fullPallets: number;
  mixedPallets: number;
  totalCases: number;
  totalWeightLb: number;
  /** Tallest planned pallet (in), for a quick max-height read. 0 when heights are unknown. */
  tallestPalletIn: number;
  /** Supplier-direct lines ship from the supplier and are not palletized at the hub. */
  supplierDirect: PalletItem[];
  /** Lines missing a cases-per-pallet config — can't be planned until set. */
  needsConfig: PalletItem[];
  maxPalletWeightLb: number;
  maxPalletHeightIn: number;
  palletBaseHeightIn: number;
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
export function planOrderPallets(
  lines: CartLine[],
  opts: { maxPalletWeightLb?: number; maxPalletHeightIn?: number; palletBaseHeightIn?: number; palletLengthIn?: number; palletWidthIn?: number } = {}
): PalletPlan {
  const maxWeight = opts.maxPalletWeightLb && opts.maxPalletWeightLb > 0 ? opts.maxPalletWeightLb : DEFAULT_MAX_PALLET_WEIGHT_LB;
  const maxHeight = opts.maxPalletHeightIn && opts.maxPalletHeightIn > 0 ? opts.maxPalletHeightIn : DEFAULT_MAX_PALLET_HEIGHT_IN;
  const base = opts.palletBaseHeightIn && opts.palletBaseHeightIn > 0 ? opts.palletBaseHeightIn : DEFAULT_PALLET_BASE_HEIGHT_IN;
  const palletL = opts.palletLengthIn && opts.palletLengthIn > 0 ? opts.palletLengthIn : DEFAULT_PALLET_LENGTH_IN;
  const palletW = opts.palletWidthIn && opts.palletWidthIn > 0 ? opts.palletWidthIn : DEFAULT_PALLET_WIDTH_IN;
  const usableHeight = Math.max(0, maxHeight - base);
  const pallets: PlannedPallet[] = [];
  const supplierDirect: PalletItem[] = [];
  const needsConfig: PalletItem[] = [];
  const remainders: Array<{ sku: string; productName: string; cases: number; cpp: number; caseWeight: number }> = [];
  // Per-SKU case height + cases-per-floor, used to estimate pallet stack height.
  const dims = new Map<string, { h: number; floor: number }>();

  const name = (p: Product) => p.brand || p.productName || p.sku;
  const itemOf = (p: Product, cases: number, cw: number): PalletItem => ({ sku: p.sku, productName: name(p), cases, weightLb: round1(cases * cw) });

  // Estimated stack height of a set of items = the tallest single-SKU column on the
  // pallet (cases stack in floors of `floor` cases each). 0 when no item has dims.
  const heightOf = (items: PalletItem[]): { heightIn: number; over: boolean } => {
    let tallest = 0;
    let known = false;
    for (const it of items) {
      const d = dims.get(it.sku);
      if (!d || d.h <= 0 || d.floor <= 0) continue;
      known = true;
      const layers = Math.ceil(it.cases / d.floor);
      const colHeight = base + layers * d.h;
      if (colHeight > tallest) tallest = colHeight;
    }
    return { heightIn: known ? round1(tallest) : 0, over: known && tallest > maxHeight + 1e-6 };
  };

  for (const line of lines) {
    const p = line.product;
    const qty = line.quantity;
    if (qty <= 0) continue;
    const cw = caseWeightLb(p);
    if (p.preferredHub === "Supplier direct") {
      supplierDirect.push(itemOf(p, qty, cw));
      continue;
    }
    const ch = caseHeightIn(p);
    // Cases per floor: explicit Ti if set, else computed from the case footprint.
    const floor = casesPerFloor(p) || caseFootprintCasesPerFloor(p, palletL, palletW);
    dims.set(p.sku, { h: ch, floor });
    const configuredCpp = productPalletSize(p);
    let cpp: number;
    if (configuredCpp > 0) {
      // Height-aware: tall cases fit fewer layers, so fewer cases.
      cpp = configuredCpp;
      if (ch > 0 && floor > 0 && usableHeight > 0) {
        const maxLayers = Math.floor(usableHeight / ch);
        cpp = maxLayers >= 1 ? Math.min(cpp, floor * maxLayers) : floor; // <1 layer = a case taller than the limit
      }
    } else {
      // No explicit pallet config — derive it from the case dimensions + weight.
      cpp = cppFromDims(p, {
        palletLengthIn: palletL,
        palletWidthIn: palletW,
        maxPalletHeightIn: maxHeight,
        palletBaseHeightIn: base,
        maxPalletWeightLb: maxWeight
      });
      if (cpp <= 0) {
        needsConfig.push(itemOf(p, qty, cw));
        continue;
      }
    }
    // Capacity is the tighter of the height-adjusted footprint and the weight ceiling.
    const cap = cw > 0 ? Math.max(1, Math.min(cpp, Math.floor(maxWeight / cw))) : cpp;
    const full = Math.floor(qty / cap);
    for (let i = 0; i < full; i++) {
      const items = [itemOf(p, cap, cw)];
      const h = heightOf(items);
      pallets.push({
        index: 0,
        kind: "full",
        items,
        cases: cap,
        weightLb: round1(cap * cw),
        heightIn: h.heightIn,
        fillPct: Math.min(100, Math.round((cap / cpp) * 100)),
        overweight: cw > 0 && cw > maxWeight,
        overheight: h.over || (ch > 0 && ch > usableHeight)
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
    const h = heightOf(wp.items);
    pallets.push({
      index: 0,
      kind: "mixed",
      items: wp.items,
      cases: wp.cases,
      weightLb: round1(wp.weight),
      heightIn: h.heightIn,
      fillPct: Math.min(100, Math.round(wp.fill * 100)),
      overweight: wp.overweight,
      overheight: h.over
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
    tallestPalletIn: pallets.reduce((s, p) => Math.max(s, p.heightIn), 0),
    supplierDirect,
    needsConfig,
    maxPalletWeightLb: maxWeight,
    maxPalletHeightIn: maxHeight,
    palletBaseHeightIn: base
  };
}

const escHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

/** Printable warehouse pallet sheet — one page per pallet. Returns a full HTML document. */
export function buildPalletSheetHtml(order: OrderRequest, plan: PalletPlan): string {
  const destination = order.destinationHub ?? order.hubRouting?.match(/Receive at:\s*(Miami hub|Orlando hub)/i)?.[1] ?? "—";
  const today = new Date().toISOString().slice(0, 10);

  const palletPage = (p: PlannedPallet) => `
    <section class="pallet">
      <header>
        <div><strong>Atlas Discount</strong> — Pallet sheet</div>
        <div class="muted">Order ${escHtml(order.id)} · ${escHtml(order.buyer)} · Receive at: ${escHtml(String(destination))} · ${today}</div>
      </header>
      <div class="palletline">
        <h1>Pallet ${p.index} <span class="of">of ${plan.totalPallets}</span></h1>
        <span class="tag">${p.kind === "full" ? "FULL — single SKU" : "MIXED"}</span>
      </div>
      <table>
        <thead><tr><th>Cases</th><th>Product</th><th>SKU</th><th class="r">Weight</th></tr></thead>
        <tbody>
          ${p.items
            .map(
              (it) =>
                `<tr><td class="cases">${it.cases}</td><td>${escHtml(it.productName)}</td><td class="muted">${escHtml(it.sku)}</td><td class="r">${it.weightLb.toLocaleString()} lb</td></tr>`
            )
            .join("")}
        </tbody>
      </table>
      <footer>
        <span>${p.cases} cases · ${p.fillPct}% full${p.heightIn > 0 ? ` · <span class="${p.overheight ? "warn" : ""}">~${p.heightIn}″ H${p.overheight ? " · OVER MAX" : ""}</span>` : ""}</span>
        <span class="${p.overweight ? "warn" : ""}">${p.weightLb.toLocaleString()} lb${p.overweight ? " · OVER MAX" : ""} (max ${plan.maxPalletWeightLb.toLocaleString()} lb · ${plan.maxPalletHeightIn}″ H)</span>
      </footer>
      ${
        p.index === plan.totalPallets && (plan.supplierDirect.length > 0 || plan.needsConfig.length > 0)
          ? `<div class="notes">
            ${plan.supplierDirect.length > 0 ? `<p><strong>Ships supplier-direct (not on a hub pallet):</strong> ${plan.supplierDirect.map((i) => `${escHtml(i.productName)} (${i.cases})`).join(", ")}</p>` : ""}
            ${plan.needsConfig.length > 0 ? `<p class="warn"><strong>Missing pallet config:</strong> ${plan.needsConfig.map((i) => `${escHtml(i.productName)} (${i.cases})`).join(", ")}</p>` : ""}
          </div>`
          : ""
      }
    </section>`;

  return `<!doctype html><html><head><meta charset="utf-8" /><title>Pallet sheet — ${escHtml(order.id)}</title>
    <style>
      @page { size: letter; margin: 0.6in; }
      * { box-sizing: border-box; }
      body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; }
      .pallet { page-break-after: always; padding-bottom: 8px; }
      .pallet:last-child { page-break-after: auto; }
      header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #0f172a; padding-bottom: 6px; font-size: 12px; }
      .muted { color: #64748b; }
      .palletline { display: flex; align-items: center; justify-content: space-between; margin-top: 18px; }
      h1 { font-size: 30px; margin: 0; }
      .of { color: #64748b; font-weight: 400; font-size: 18px; }
      .tag { border: 2px solid #0f172a; border-radius: 999px; padding: 4px 12px; font-size: 12px; font-weight: 800; letter-spacing: .04em; }
      table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 14px; }
      th, td { text-align: left; padding: 8px 6px; border-bottom: 1px solid #e2e8f0; }
      th { font-size: 11px; text-transform: uppercase; color: #64748b; }
      .r { text-align: right; } .cases { font-weight: 800; }
      footer { display: flex; justify-content: space-between; margin-top: 12px; font-weight: 700; font-size: 14px; }
      .warn { color: #b91c1c; }
      .notes { margin-top: 18px; font-size: 12px; border-top: 1px dashed #cbd5e1; padding-top: 10px; }
    </style></head><body onload="window.focus();window.print();">
    ${plan.pallets.map(palletPage).join("")}
  </body></html>`;
}
