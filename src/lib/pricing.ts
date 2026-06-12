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

/**
 * Resolve the discount % a buyer gets on a product, most-specific rule first:
 * 1. by product (per-tier override on the product) → 2. per account override →
 * 3. tier default → 4. standard (0). The standard price is always the reference.
 */
export function resolveTierDiscount(args: {
  settings: PricingSettings;
  product: Product;
  tierId: string;
  accountId?: string;
}): { pct: number; source: "product" | "account" | "tier" | "standard" } {
  const { settings, product, tierId, accountId } = args;

  const productPct = product.spec?.tierDiscounts?.[tierId];
  if (typeof productPct === "number") return { pct: productPct, source: "product" };

  if (accountId) {
    const account = (settings.accountPricing ?? []).find((entry) => entry.accountId === accountId);
    if (account && typeof account.adjustmentPct === "number") {
      return { pct: account.adjustmentPct, source: "account" };
    }
  }

  const tier = findTier(settings, tierId);
  if (tier) return { pct: tier.discountPct, source: "tier" };

  return { pct: 0, source: "standard" };
}

export function applyTierDiscount(standardPrice: number, pct: number) {
  return standardPrice * (1 - pct / 100);
}

/** Standard (reference) loose-case sell price for a product, before any tier discount. */
export function standardCasePrice(product: Product, settings: PricingSettings) {
  if (hasViewPricing(product)) {
    return product.preferredHub === "Supplier direct" && product.supplierDirectPrice
      ? product.supplierDirectPrice
      : (product.casePrice as number);
  }
  return calculateLinePricing({ product, quantity: 1 }, settings).casePrice;
}

/** The loose-case price a specific buyer tier/account pays for a product. */
export function buyerCasePrice(args: {
  settings: PricingSettings;
  product: Product;
  tierId: string;
  accountId?: string;
}) {
  const standard = standardCasePrice(args.product, args.settings);
  const { pct } = resolveTierDiscount(args);
  return applyTierDiscount(standard, pct);
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

/** True when the row came from the public catalog view (cost hidden, sell prices precomputed). */
function hasViewPricing(product: Product) {
  return (!product.supplierCost || product.supplierCost <= 0) && typeof product.casePrice === "number" && product.casePrice > 0;
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

export function calculateLinePricing(line: CartLine, settings: PricingSettings, override?: QuoteLineOverride) {
  const manualSellPrice = override?.sellPricePerCase;
  if (typeof manualSellPrice === "number" && manualSellPrice >= 0) {
    const supplierCost = line.product.supplierCost * line.quantity;
    const revenue = manualSellPrice * line.quantity;

    return {
      palletSize: casesPerPallet(line.product.palletConfiguration),
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

  if (line.product.preferredHub === "Supplier direct") {
    // Buyer-side rows from the catalog view carry a precomputed per-case price; cost stays hidden.
    if (hasViewPricing(line.product)) {
      const price = line.product.supplierDirectPrice ?? (line.product.casePrice as number);
      return {
        palletSize: productPalletSize(line.product),
        palletCases: 0,
        looseCases: 0,
        supplierDirectCases: line.quantity,
        casePrice: price,
        palletPrice: price,
        supplierCost: 0,
        revenue: price * line.quantity,
        margin: 0,
        pricingModel: "Supplier direct fulfillment fee" as const
      };
    }

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
  const viewPriced = hasViewPricing(line.product);
  const casePrice = viewPriced ? (line.product.casePrice as number) : atlasCaseSellPrice(line.product.supplierCost, settings);
  const palletPrice = viewPriced
    ? (line.product.palletPrice ?? (line.product.casePrice as number))
    : atlasPalletSellPrice(line.product.supplierCost, settings);
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

export function calculateQuoteFinancials(order: OrderRequest, settings: PricingSettings, adjustment?: QuoteAdjustment): QuoteFinancials {
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
      adjustment?.lineOverrides?.find((override) => override.productId === line.product.id)
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
