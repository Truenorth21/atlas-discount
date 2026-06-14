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
  /** Atlas's cost per master case. Admin-only — never sent to buyers (excluded from the catalog view). */
  supplierCost: number;
  /** Explicit per-tier sell prices the admin enters per master case (and optional full-pallet price). */
  tierPricing?: TierPricing;
  /** Suggested retail (SRP) per UNIT — when set, it calculates each level's case price. */
  suggestedRetail: number;
  /** Minimum order quantity for this product, in master cases. */
  moq: number;
  /** Optional minimum order value ($) for this product. Buyer must meet cases OR value. */
  minOrderValue?: number;
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
  /** Display label/tag for a promoted product (e.g. "Weekly deal", "New arrival"). */
  promotion?: string;
  /** Which paid placements this product appears in. Sold/controlled per placement. */
  placements?: ProductPlacements;
  /** When the product was created (ISO) — drives "New" badge + newest sort. */
  createdAt?: string;
  spec?: ProductSpec;
};

/** Paid promotion placements a product can appear in (each a separate ad product). */
export type ProductPlacements = {
  /** Premium homepage ordering-portal slot (scarce). */
  homepageFeatured?: boolean;
  /** Weekly Deals row inside the catalog (broader, cheaper). */
  weeklyDeal?: boolean;
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
  /** Direct cases-per-pallet override (wins over Ti×Hi when set). */
  casesPerPallet?: number;
  /** Needs refrigerated / cold-pack handling. Shows a "Cold pack" badge to buyers. */
  refrigerated?: boolean;
  palletStandardWeight?: number;
  fulfillmentMode?: "pickup" | "delivered";
  shippingWarehouse?: "Miami hub" | "Orlando hub";
  pickupAddress?: string;
  pickupPhone?: string;
};

/** Explicit per-tier prices for one product. tierId -> price per master case (and optional full-pallet per-case price). */
export type TierPricing = {
  /** Per-master-case price each tier pays. */
  case: Record<string, number>;
  /** Optional lower per-case price when buying full pallets, per tier. */
  pallet?: Record<string, number>;
};

/** A customer price level (e.g. Retailer / Distributor / Sales Rep). */
export type CustomerTier = {
  id: string;
  label: string;
  /**
   * The buyer's margin off retail for this level (a % of the sale price/SRP).
   * Suggested case price = SRP/unit × units-per-case × (1 − marginPct/100).
   */
  marginPct: number;
  /** Marks the reference/standard price level. */
  isReference?: boolean;
};

/** Per-account pricing assignment: which tier, plus an optional account-wide override. */
export type AccountPricing = {
  accountId: string;
  tierId: string;
  /** Optional blanket adjustment % for this account, overriding the tier default across all products. */
  adjustmentPct?: number;
};

/** A supplier's assigned subscription plan + fulfillment service tier. */
export type SupplierAssignment = {
  supplierId: string;
  /** Plan id from supplierPlans (roots/rise/reach). */
  plan: string;
  /** Fulfillment tier id from fulfillmentTiers (direct/fulfilled/import). */
  fulfillmentTier: string;
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
  /** Hub where the buyer receives the order (pickup/delivery). Lines stored at the other hub cross-dock here. */
  destinationHub?: "Miami hub" | "Orlando hub";
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
  /** Cross-dock transfer between Miami and Orlando hubs, charged per transferred case. */
  hubTransferPerCase: number;
  /** Atlas internal cost per transferred case (admin-only economics). */
  hubTransferCostPerCase: number;
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
  /** Channel pricing defaults (percent values). SRP mode: buyer margins; cost mode: Atlas target margins. */
  retailerMarginAtSrpPct?: number;
  distributorMarginOnResalePct?: number;
  atlasMarginRetailerSalePct?: number;
  atlasMarginDistributorSalePct?: number;
  minimumAtlasMarginPct?: number;
  /** Product subtotal at/above which local delivery is free. 0 = no free-delivery offer. */
  freeDeliveryThreshold?: number;
  /** Per-supplier plan + fulfillment tier assignments. */
  supplierAssignments?: SupplierAssignment[];
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
  /** Cases moving between hubs (Miami ↔ Orlando) before pickup/delivery, and the fee charged for it. */
  transferCases: number;
  transferFee: number;
  additionalFee: number;
  orderDiscount: number;
  buyerTotal: number;
  routeSellerCommission: number;
  estimatedProfit: number;
  marginPercent: number;
  recommendedFulfillmentType: FulfillmentType;
  recommendedHubRouting: string;
};
