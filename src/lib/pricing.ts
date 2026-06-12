import type { CartLine, CustomerTier, FulfillmentType, OrderRequest, PricingSettings, Product, QuoteAdjustment, QuoteFinancials, QuoteLineOverride } from "./types";

export const REFERENCE_TIER_ID = "retailer";

export function customerTiers(settings: PricingSettings): CustomerTier[] {
  return settings.customerTiers ?? [];
}

export function findTier(settings: PricingSettings, tierId: string): CustomerTier | undefined {
  return customerTiers(settings).find((tier) => tier.id === tierId);
}

export function tierLabel(settings: PricingSettings, tierId: string): string {
  return findTier(settings, tierId)?.label ?? "Retailer";
}

export function tierDefaultMarkupPct(settings: PricingSettings, tierId: string): number {
  return findTier(settings, tierId)?.defaultMarkupPct ?? 0;
}

/** Auto-fill helper: master-case price at a markup over cost (admin can override). */
export function tierPriceFromCost(cost: number, markupPct: number) {
  return Math.round(cost * (1 + markupPct / 100) * 100) / 100;
}

/** Per-account % off the tier price (special deals). 0 when none. */
function accountAdjustmentPct(settings: PricingSettings, accountId?: string): number {
  if (!accountId) return 0;
  const entry = (settings.accountPricing ?? []).find((item) => item.accountId === accountId);
  return typeof entry?.adjustmentPct === "number" ? entry.adjustmentPct : 0;
}

/**
 * Master-case price a tier pays: the admin's explicit price first; if none is set
 * yet, fall back to cost × the tier's default markup (admin rows only).
 */
export function tierCasePrice(product: Product, settings: PricingSettings, tierId: string): number | undefined {
  const explicit = product.tierPricing?.case?.[tierId];
  if (typeof explicit === "number" && explicit > 0) return explicit;
  if (product.supplierCost > 0) return tierPriceFromCost(product.supplierCost, tierDefaultMarkupPct(settings, tierId));
  return undefined;
}

/** Full-pallet per-case price: explicit pallet price first, else the case price. */
export function tierPalletPrice(product: Product, settings: PricingSettings, tierId: string): number | undefined {
  const explicit = product.tierPricing?.pallet?.[tierId];
  if (typeof explicit === "number" && explicit > 0) return explicit;
  return tierCasePrice(product, settings, tierId);
}

/** Buyer's per-case price for their tier, including any per-account adjustment. */
export function buyerCasePrice(args: { settings: PricingSettings; product: Product; tierId: string; accountId?: string }) {
  const base = tierCasePrice(args.product, args.settings, args.tierId) ?? 0;
  return base * (1 - accountAdjustmentPct(args.settings, args.accountId) / 100);
}

/** Buyer's full-pallet per-case price for their tier, including any per-account adjustment. */
export function buyerPalletPrice(args: { settings: PricingSettings; product: Product; tierId: string; accountId?: string }) {
  const base = tierPalletPrice(args.product, args.settings, args.tierId) ?? 0;
  return base * (1 - accountAdjustmentPct(args.settings, args.accountId) / 100);
}

/** Reference (Retailer) case price — used as the struck-through "list" comparison. */
export function standardCasePrice(product: Product, settings: PricingSettings) {
  return tierCasePrice(product, settings, REFERENCE_TIER_ID) ?? 0;
}

export function casesPerPallet(palletConfiguration: string) {
  const match = palletConfiguration.match(/(\d+)\s*cases?/i);
  return match ? Number(match[1]) : 0;
}

/** Pallet size for a product: structured Ti×Hi spec wins over the legacy free-text field. */
export function productPalletSize(product: Product) {
  const fromSpec = (product.spec?.palletCasesPerFloor ?? 0) * (product.spec?.palletLayers ?? 0);
  return fromSpec > 0 ? fromSpec : casesPerPallet(product.palletConfiguration);
}

/** Human-readable pallet configuration ("16/floor × 10 high = 160 cases") from spec, else the raw field. */
export function palletConfigLabel(product: Product) {
  const floor = product.spec?.palletCasesPerFloor;
  const layers = product.spec?.palletLayers;
  if (floor && layers) return `${floor}/floor × ${layers} high = ${floor * layers} cases`;
  return product.palletConfiguration;
}

export function atlasCaseSellPrice(supplierCost: number, settings: PricingSettings) {
  const percentagePrice = supplierCost * (1 + settings.caseMarkupPercent / 100);
  const floorPrice = supplierCost + settings.minimumCaseMarginPerCase;
  return Math.max(percentagePrice, floorPrice);
}

export function atlasPalletSellPrice(supplierCost: number, settings: PricingSettings) {
  const percentagePrice = supplierCost * (1 + settings.palletMarkupPercent / 100);
  const floorPrice = supplierCost + settings.minimumPalletMarginPerCase;
  return Math.max(percentagePrice, floorPrice);
}

/** Optional buyer context: which tier/account is shopping (drives explicit tier prices). */
export type PricingContext = { tierId?: string; accountId?: string };

export function calculateLinePricing(
  line: CartLine,
  settings: PricingSettings,
  override?: QuoteLineOverride,
  ctx?: PricingContext
) {
  const manualSellPrice = override?.sellPricePerCase;
  if (typeof manualSellPrice === "number" && manualSellPrice >= 0) {
    const supplierCost = line.product.supplierCost * line.quantity;
    const revenue = manualSellPrice * line.quantity;

    return {
      palletSize: productPalletSize(line.product),
      palletCases: 0,
      looseCases: line.product.preferredHub === "Supplier direct" ? 0 : line.quantity,
      supplierDirectCases: line.product.preferredHub === "Supplier direct" ? line.quantity : 0,
      casePrice: manualSellPrice,
      palletPrice: manualSellPrice,
      supplierCost,
      revenue,
      margin: revenue - supplierCost,
      pricingModel: "Manual quote price" as const
    };
  }

  // Buyer-facing: price from the admin's explicit per-tier prices (cost hidden).
  if (ctx?.tierId) {
    const casePrice = buyerCasePrice({ settings, product: line.product, tierId: ctx.tierId, accountId: ctx.accountId });
    const palletUnit = buyerPalletPrice({ settings, product: line.product, tierId: ctx.tierId, accountId: ctx.accountId });
    const supplierCost = line.product.supplierCost * line.quantity;

    if (line.product.preferredHub === "Supplier direct") {
      return {
        palletSize: productPalletSize(line.product),
        palletCases: 0,
        looseCases: 0,
        supplierDirectCases: line.quantity,
        casePrice,
        palletPrice: casePrice,
        supplierCost,
        revenue: casePrice * line.quantity,
        margin: casePrice * line.quantity - supplierCost,
        pricingModel: "Atlas hub product margin" as const
      };
    }

    const palletSize = productPalletSize(line.product);
    const palletCases = palletSize > 0 ? Math.floor(line.quantity / palletSize) * palletSize : 0;
    const looseCases = line.quantity - palletCases;
    const revenue = palletCases * palletUnit + looseCases * casePrice;

    return {
      palletSize,
      palletCases,
      looseCases,
      supplierDirectCases: 0,
      casePrice,
      palletPrice: palletUnit,
      supplierCost,
      revenue,
      margin: revenue - supplierCost,
      pricingModel: "Atlas hub product margin" as const
    };
  }

  // Admin/internal (no tier context): cost-based pricing for margin tooling.
  if (line.product.preferredHub === "Supplier direct") {
    const supplierCost = line.product.supplierCost * line.quantity;
    const fee = Math.max(supplierCost * (settings.supplierDirectFeePercent / 100), settings.supplierDirectMinimumFee);
    const price = (supplierCost + fee) / line.quantity;

    return {
      palletSize: productPalletSize(line.product),
      palletCases: 0,
      looseCases: 0,
      supplierDirectCases: line.quantity,
      casePrice: price,
      palletPrice: price,
      supplierCost,
      revenue: supplierCost + fee,
      margin: fee,
      pricingModel: "Supplier direct fulfillment fee" as const
    };
  }

  const palletSize = productPalletSize(line.product);
  const palletCases = palletSize > 0 ? Math.floor(line.quantity / palletSize) * palletSize : 0;
  const looseCases = line.quantity - palletCases;
  const casePrice = atlasCaseSellPrice(line.product.supplierCost, settings);
  const palletPrice = atlasPalletSellPrice(line.product.supplierCost, settings);
  const supplierCost = line.product.supplierCost * line.quantity;
  const revenue = palletCases * palletPrice + looseCases * casePrice;

  return {
    palletSize,
    palletCases,
    looseCases,
    supplierDirectCases: 0,
    casePrice,
    palletPrice,
    supplierCost,
    revenue,
    margin: revenue - supplierCost,
    pricingModel: "Atlas hub product margin" as const
  };
}

/**
 * Destination hub for an order: the explicit field, or parsed from the hubRouting
 * text (orders reloaded from the database carry it only in that string).
 */
export function resolveDestinationHub(order: OrderRequest): "Miami hub" | "Orlando hub" | undefined {
  if (order.destinationHub) return order.destinationHub;
  const match = order.hubRouting?.match(/Receive at:\s*(Miami hub|Orlando hub)/i);
  return match ? (match[1] as "Miami hub" | "Orlando hub") : undefined;
}

/**
 * Cases that must cross-dock between Miami and Orlando: hub-stocked lines whose
 * home hub differs from where the buyer receives the order. Supplier-direct
 * lines never transfer.
 */
export function crossDockCases(order: OrderRequest) {
  const destination = resolveDestinationHub(order);
  if (!destination) return 0;
  return (order.lineItems ?? []).reduce((sum, line) => {
    const hub = line.product.preferredHub;
    if ((hub === "Miami hub" || hub === "Orlando hub") && hub !== destination) return sum + line.quantity;
    return sum;
  }, 0);
}

function hubCounts(order: OrderRequest) {
  return (order.lineItems ?? []).reduce(
    (counts, line) => {
      if (line.product.preferredHub === "Miami hub") counts.miami += line.quantity;
      if (line.product.preferredHub === "Orlando hub") counts.orlando += line.quantity;
      if (line.product.preferredHub === "Supplier direct") counts.supplierDirect += line.quantity;
      return counts;
    },
    { miami: 0, orlando: 0, supplierDirect: 0 }
  );
}

export function recommendFulfillment(order: OrderRequest, settings: PricingSettings) {
  const counts = hubCounts(order);
  const routes = [];
  if (counts.miami > 0) routes.push("Miami hub");
  if (counts.orlando > 0) routes.push("Orlando hub");
  if (counts.supplierDirect > 0) routes.push("supplier direct");

  if (order.totalCases >= settings.freightCaseThreshold) {
    return {
      type: "Freight quote needed" as FulfillmentType,
      route: `${routes.join(" + ") || "Supplier review"}; ${order.totalCases} cases meets freight review threshold`
    };
  }

  if (counts.miami > 0 || counts.orlando > 0) {
    return {
      type: "Atlas consolidation hub" as FulfillmentType,
      route: `${routes.join(" + ")} consolidation`
    };
  }

  return {
    type: "Supplier direct" as FulfillmentType,
    route: "Supplier direct; no Atlas hub touch"
  };
}

export function calculateQuoteFinancials(
  order: OrderRequest,
  settings: PricingSettings,
  adjustment?: QuoteAdjustment,
  /** Buyer context: when set, lines price from the buyer's explicit tier prices. */
  ctx?: PricingContext
): QuoteFinancials {
  const effectiveSettings = {
    ...settings,
    caseMarkupPercent: adjustment?.caseMarkupPercent ?? settings.caseMarkupPercent,
    palletMarkupPercent: adjustment?.palletMarkupPercent ?? settings.palletMarkupPercent,
    supplierDirectFeePercent: adjustment?.supplierDirectFeePercent ?? settings.supplierDirectFeePercent,
    localDeliveryFee: adjustment?.localDeliveryFee ?? settings.localDeliveryFee,
    pickupFee: adjustment?.pickupFee ?? settings.pickupFee,
    freightCoordinationFee: adjustment?.freightCoordinationFee ?? settings.freightCoordinationFee
  };
  const effectiveOrder = {
    ...order,
    fulfillmentType: adjustment?.fulfillmentType ?? order.fulfillmentType,
    hubRouting: adjustment?.hubRouting ?? order.hubRouting
  };
  const counts = hubCounts(effectiveOrder);
  const recommended = recommendFulfillment(effectiveOrder, effectiveSettings);
  const supplierCost = (order.lineItems ?? []).reduce(
    (sum, line) => sum + line.product.supplierCost * line.quantity,
    0
  );
  const lineFinancials = (order.lineItems ?? []).map((line) =>
    calculateLinePricing(
      line,
      effectiveSettings,
      adjustment?.lineOverrides?.find((override) => override.productId === line.product.id),
      ctx
    )
  );
  const productRevenue = lineFinancials.reduce((sum, line) => sum + line.revenue, 0);
  const supplierDirectCases = lineFinancials.reduce((sum, line) => sum + line.supplierDirectCases, 0);
  const palletCases = lineFinancials.reduce((sum, line) => sum + line.palletCases, 0);
  const looseCases = lineFinancials.reduce((sum, line) => sum + line.looseCases, 0);
  const hubFee =
    counts.miami * effectiveSettings.miamiHubHandlingPerCase + counts.orlando * effectiveSettings.orlandoHubHandlingPerCase;
  const hubCost = counts.miami * effectiveSettings.miamiHubCostPerCase + counts.orlando * effectiveSettings.orlandoHubCostPerCase;

  let fulfillmentFee = hubFee;
  let fulfillmentCost = hubCost;

  if (effectiveOrder.fulfillmentType === "Local delivery") {
    fulfillmentFee += adjustment?.freeDelivery ? 0 : effectiveSettings.localDeliveryFee;
    fulfillmentCost += effectiveSettings.localDeliveryCost;
  }

  if (effectiveOrder.fulfillmentType === "Pickup") {
    fulfillmentFee += adjustment?.freeDelivery ? 0 : effectiveSettings.pickupFee;
  }

  if (effectiveOrder.fulfillmentType === "Freight quote needed" || recommended.type === "Freight quote needed") {
    fulfillmentFee += adjustment?.freeDelivery ? 0 : effectiveSettings.freightCoordinationFee;
    fulfillmentCost += effectiveSettings.freightCostEstimate;
  }

  // Miami ↔ Orlando cross-dock: lines stored at the other hub move to the buyer's
  // receiving hub before pickup/delivery.
  const transferCases =
    effectiveOrder.fulfillmentType === "Supplier direct" ? 0 : crossDockCases(effectiveOrder);
  const transferFee = transferCases * (effectiveSettings.hubTransferPerCase ?? 0);
  fulfillmentFee += transferFee;
  fulfillmentCost += transferCases * (effectiveSettings.hubTransferCostPerCase ?? 0);

  const additionalFee = adjustment?.additionalFee ?? 0;
  const orderDiscount = adjustment?.orderDiscount ?? 0;
  fulfillmentFee += additionalFee;
  const productMargin = productRevenue - supplierCost;
  const routeSellerCommission = productRevenue * (effectiveSettings.routeSellerCommissionPercent / 100);
  const buyerTotal = productRevenue + fulfillmentFee - orderDiscount;
  const estimatedProfit = productMargin + fulfillmentFee - fulfillmentCost - routeSellerCommission - orderDiscount;
  const marginPercent = buyerTotal > 0 ? (estimatedProfit / buyerTotal) * 100 : 0;

  return {
    supplierCost,
    productRevenue,
    productMargin,
    supplierDirectCases,
    palletCases,
    looseCases,
    fulfillmentFee,
    fulfillmentCost,
    transferCases,
    transferFee,
    additionalFee,
    orderDiscount,
    buyerTotal,
    routeSellerCommission,
    estimatedProfit,
    marginPercent,
    recommendedFulfillmentType: recommended.type,
    recommendedHubRouting: recommended.route
  };
}

export function allocateFulfillmentByCases(order: OrderRequest, fulfillmentFee: number) {
  const totalCases = Math.max(order.totalCases, 1);
  return (order.lineItems ?? []).map((line) => ({
    productId: line.product.id,
    allocation: fulfillmentFee * (line.quantity / totalCases)
  }));
}

export function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}
