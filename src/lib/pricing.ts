import type { CartLine, FulfillmentType, OrderRequest, PricingSettings, QuoteAdjustment, QuoteFinancials, QuoteLineOverride } from "./types";

export function casesPerPallet(palletConfiguration: string) {
  const match = palletConfiguration.match(/(\d+)\s*cases?/i);
  return match ? Number(match[1]) : 0;
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
    const supplierCost = line.product.supplierCost * line.quantity;
    const fee = Math.max(supplierCost * (settings.supplierDirectFeePercent / 100), settings.supplierDirectMinimumFee);
    const price = (supplierCost + fee) / line.quantity;

    return {
      palletSize: casesPerPallet(line.product.palletConfiguration),
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

  const palletSize = casesPerPallet(line.product.palletConfiguration);
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
