export type UserRole = "buyer" | "supplier" | "route_seller" | "admin";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type DocumentStatus = "needed" | "uploaded" | "approved" | "rejected";
export type AtlasHub = "Miami hub" | "Orlando hub" | "Supplier direct";
export type FulfillmentType =
  | "Supplier direct"
  | "Atlas consolidation hub"
  | "Pickup"
  | "Local delivery"
  | "Freight quote needed";

export type Product = {
  id: string;
  sku: string;
  brand: string;
  upc: string;
  productName: string;
  description: string;
  category: string;
  subcategory: string;
  unitSize: string;
  imageUrl: string;
  productDimensions: string;
  unitWeight?: string;
  casePack: number;
  caseDimensions: string;
  caseWeight: string;
  palletConfiguration: string;
  supplierCost: number;
  suggestedRetail: number;
  moq: number;
  leadTime: string;
  inventoryAvailable: number;
  location: string;
  pickupLocation: string;
  shippingLocation: string;
  deliveryRadius: string;
  preferredHub: AtlasHub;
  routeRecommendation: string;
  status: ApprovalStatus;
  supplierName: string;
  promotion?: string;
  spec?: ProductSpec;
};

/** Dimensions (inches) + weight (with unit) for a single packaging level. */
export type DimWeight = {
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  weightUnit?: "lb" | "oz";
};

/** Rich item-setup spec: unit / inner / master case + pallet + fulfillment. */
export type ProductSpec = {
  unit?: DimWeight;
  hasInner?: boolean;
  innerPack?: number;
  inner?: DimWeight;
  caseDims?: DimWeight;
  gtinCase?: string;
  gtinInner?: string;
  palletCasesPerFloor?: number;
  palletLayers?: number;
  palletStandardWeight?: number;
  fulfillmentMode?: "pickup" | "delivered";
  shippingWarehouse?: "Miami hub" | "Orlando hub";
  pickupAddress?: string;
  pickupPhone?: string;
  /** Per-tier discount % off this product's standard price (tierId -> percent). "By product" override. */
  tierDiscounts?: Record<string, number>;
};

/** A customer pricing tier (e.g. Retailer / Distributor / Atlas Rep). Discount is off the standard price. */
export type CustomerTier = {
  id: string;
  label: string;
  /** Percent off the standard (reference) price. Reference tier is 0. */
  discountPct: number;
  /** Marks the standard/reference tier shown as the baseline in admin. */
  isReference?: boolean;
};

/** Per-account pricing assignment: which tier, plus an optional account-wide override. */
export type AccountPricing = {
  accountId: string;
  tierId: string;
  /** Optional blanket adjustment % for this account, overriding the tier default across all products. */
  adjustmentPct?: number;
};

export type CartLine = {
  product: Product;
  quantity: number;
};

export type Application = {
  id: string;
  type: "buyer" | "supplier" | "route_seller";
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  status: ApprovalStatus;
  documents: BusinessDocument[];
  routePreference?: RouteSellerPreference;
  newsletterOptIn?: boolean;
  submittedAt: string;
};

export type PromotionSubmission = {
  id: string;
  supplierName: string;
  placement: string;
  productName?: string;
  note?: string;
  status: ApprovalStatus;
  submittedAt: string;
};

export type RouteSellerPreference = {
  program: "Route Seller" | "Independent Seller" | "Online Seller";
  hub: Exclude<AtlasHub, "Supplier direct">;
  territory: string;
  productLane: string;
};

export type RouteSeller = {
  id: string;
  name: string;
  program: "Route Seller" | "Independent Seller" | "Online Seller";
  territory: string;
  assignedHub: Exclude<AtlasHub, "Supplier direct">;
  productLane: string;
  status: ApprovalStatus;
  monthlySales: number;
  activeAccounts: number;
  routeStops: string[];
};

export type BusinessDocument = {
  id: string;
  label: string;
  fileName?: string;
  status: DocumentStatus;
  expiresAt?: string;
  rejectionReason?: string;
};

export type OrderRequest = {
  id: string;
  buyer: string;
  buyerRegion?: string;
  totalCases: number;
  estimatedValue: number;
  fulfillmentType: FulfillmentType;
  hubRouting: string;
  lineItems?: CartLine[];
  status: "Quote requested" | "Admin review" | "Sent to supplier" | "Ready to confirm";
  createdAt: string;
};

export type QuoteAdjustment = {
  orderId: string;
  fulfillmentType?: FulfillmentType;
  hubRouting?: string;
  lineOverrides?: QuoteLineOverride[];
  caseMarkupPercent?: number;
  palletMarkupPercent?: number;
  supplierDirectFeePercent?: number;
  localDeliveryFee?: number;
  pickupFee?: number;
  freightCoordinationFee?: number;
  additionalFee?: number;
  orderDiscount?: number;
  freeDelivery?: boolean;
  freeProductNote?: string;
  internalNote?: string;
};

export type QuoteLineOverride = {
  productId: string;
  sellPricePerCase?: number;
};

export type PricingSettings = {
  minimumMixedOrderCases: number;
  minimumOrderValue: number;
  supplierDirectFeePercent: number;
  supplierDirectMinimumFee: number;
  caseMarkupPercent: number;
  palletMarkupPercent: number;
  minimumCaseMarginPerCase: number;
  minimumPalletMarginPerCase: number;
  miamiHubHandlingPerCase: number;
  miamiHubCostPerCase: number;
  orlandoHubHandlingPerCase: number;
  orlandoHubCostPerCase: number;
  pickupFee: number;
  localDeliveryFee: number;
  localDeliveryCost: number;
  freightCoordinationFee: number;
  freightCostEstimate: number;
  routeSellerCommissionPercent: number;
  freightCaseThreshold: number;
  featuredProductRate: number;
  weeklyDealsRate: number;
  monthlyCircularRate: number;
  newsletterSponsorshipRate: number;
  whatsappPromotionRate: number;
  sponsoredCategoryRate: number;
  newProductLaunchRate: number;
  closeoutListingRate: number;
  supplierMembershipRate: number;
  /** Customer pricing tiers (tier defaults). First/reference tier pays the standard price. */
  customerTiers: CustomerTier[];
  /** Per-account tier assignments + optional account-wide overrides. */
  accountPricing: AccountPricing[];
};

export type QuoteFinancials = {
  supplierCost: number;
  productRevenue: number;
  productMargin: number;
  supplierDirectCases: number;
  palletCases: number;
  looseCases: number;
  fulfillmentFee: number;
  fulfillmentCost: number;
  additionalFee: number;
  orderDiscount: number;
  buyerTotal: number;
  routeSellerCommission: number;
  estimatedProfit: number;
  marginPercent: number;
  recommendedFulfillmentType: FulfillmentType;
  recommendedHubRouting: string;
};
