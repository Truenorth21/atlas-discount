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
