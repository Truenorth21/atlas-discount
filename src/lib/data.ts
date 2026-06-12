import type { Application, AtlasHub, FulfillmentType, OrderRequest, PricingSettings, Product, RouteSeller } from "./types";

export const atlasHubs: AtlasHub[] = ["Miami hub", "Orlando hub", "Supplier direct"];

export const fulfillmentTypes: FulfillmentType[] = [
  "Supplier direct",
  "Atlas consolidation hub",
  "Pickup",
  "Local delivery",
  "Freight quote needed"
];

export const routeSellerPrograms: RouteSeller["program"][] = ["Route Seller", "Independent Seller", "Online Seller"];

export const routeSellerTerritories = {
  "Miami hub": [
    "Miami - Doral / Medley",
    "Miami - Hialeah / Miami Lakes",
    "Miami - Little Havana / Flagler",
    "Miami - Kendall / South Miami",
    "Miami - Homestead / Cutler Bay",
    "Broward - Hollywood / Pembroke Pines",
    "Broward - Fort Lauderdale / Oakland Park",
    "Palm Beach - Boca / Delray"
  ],
  "Orlando hub": [
    "Orlando - Downtown / Colonial",
    "Orlando - Kissimmee / Poinciana",
    "Orlando - Winter Park / Maitland",
    "Orlando - Apopka / Altamonte",
    "Tampa - Brandon / Riverview",
    "Tampa - Pinellas / Clearwater",
    "Jacksonville - Southside / Mandarin",
    "Daytona - Sanford / Volusia"
  ]
} satisfies Record<Exclude<AtlasHub, "Supplier direct">, string[]>;

export const routeSellerProductLanes = [
  "Convenience & dollar-store staples",
  "Grocery and pantry",
  "Janitorial and facility supplies",
  "Health, beauty, and pharmacy",
  "Office and business supplies",
  "Closeouts and seasonal deals"
];

export const defaultPricingSettings: PricingSettings = {
  minimumMixedOrderCases: 24,
  minimumOrderValue: 500,
  supplierDirectFeePercent: 10,
  supplierDirectMinimumFee: 35,
  caseMarkupPercent: 24,
  palletMarkupPercent: 12,
  minimumCaseMarginPerCase: 3,
  minimumPalletMarginPerCase: 1.5,
  miamiHubHandlingPerCase: 1.5,
  miamiHubCostPerCase: 0.75,
  orlandoHubHandlingPerCase: 1.35,
  orlandoHubCostPerCase: 0.7,
  pickupFee: 0,
  hubTransferPerCase: 0.75,
  hubTransferCostPerCase: 0.4,
  localDeliveryFee: 75,
  localDeliveryCost: 48,
  freightCoordinationFee: 125,
  freightCostEstimate: 95,
  routeSellerCommissionPercent: 3,
  freightCaseThreshold: 96,
  featuredProductRate: 250,
  weeklyDealsRate: 175,
  monthlyCircularRate: 450,
  newsletterSponsorshipRate: 300,
  whatsappPromotionRate: 150,
  sponsoredCategoryRate: 650,
  newProductLaunchRate: 900,
  closeoutListingRate: 75,
  supplierMembershipRate: 99,
  customerTiers: [
    { id: "retailer", label: "Retailer", defaultMarkupPct: 30, isReference: true },
    { id: "distributor", label: "Distributor", defaultMarkupPct: 22 },
    { id: "atlas_rep", label: "Sales Rep", defaultMarkupPct: 15 }
  ],
  accountPricing: []
};

export const productCategories: Record<string, string[]> = {
  "Janitorial / Cleaning Supplies": ["Disinfecting wipes", "Cleaners & sprays", "Paper towels & tissue", "Trash bags", "Gloves & PPE"],
  "Grocery / Pantry": ["Pasta & sauce", "Snacks & candy", "Beverages", "Condiments", "Canned & dry goods"],
  "Health & Beauty (HBA)": ["Hand soap & sanitizer", "Personal care", "Oral care", "First aid"],
  "Office / Paper": ["Copy & printer paper", "Notebooks & pads", "Writing instruments", "Mailing & shipping"],
  "Foodservice / Disposables": ["Cups & lids", "Plates & bowls", "Cutlery", "Containers & wraps"],
  "Closeout / Special buys": ["Assorted closeout"]
};

export const productFields = [
  "SKU",
  "brand",
  "UPC",
  "product name",
  "description",
  "category",
  "subcategory",
  "unit size",
  "image URL",
  "product dimensions",
  "unit weight",
  "case pack",
  "case dimensions",
  "case weight",
  "pallet configuration",
  "supplier cost",
  "suggested retail",
  "MOQ",
  "lead time",
  "inventory available",
  "pickup/shipping location",
  "pickup location",
  "shipping location",
  "delivery radius",
  "preferred Atlas hub"
];

export const documentRequirements = {
  buyer: [
    "Resale certificate",
    "Business license or state registration",
    "Storefront, marketplace, or buying entity proof"
  ],
  supplier: [
    "Completed W-9",
    "Certificate of insurance",
    "Business license or state registration",
    "Warehouse / pickup location details",
    "Product liability or compliance documents, if applicable"
  ],
  route_seller: [
    "Government ID",
    "Business license or independent contractor profile",
    "Proof of auto insurance",
    "Vehicle registration"
  ]
};

export const sampleProducts: Product[] = [
  {
    id: "p-1001",
    sku: "AD-CLN-001",
    brand: "BrightPro",
    upc: "850111000114",
    productName: "Commercial disinfecting wipes",
    description: "Commercial disinfecting wipes, lemon, 12 tubs per case",
    category: "Janitorial",
    subcategory: "Cleaning Supplies",
    unitSize: "12 tubs per case",
    imageUrl: "/product-images/disinfecting-wipes.svg",
    productDimensions: "6 x 6 x 8 in per tub",
    casePack: 12,
    caseDimensions: "18 x 14 x 12 in",
    caseWeight: "21 lb",
    palletConfiguration: "48 cases / pallet",
    supplierCost: 18.25,
    suggestedRetail: 39.99,
    moq: 10,
    leadTime: "3-5 business days",
    inventoryAvailable: 420,
    location: "Miami, FL",
    pickupLocation: "Miami hub",
    shippingLocation: "Miami, FL",
    deliveryRadius: "South Florida",
    preferredHub: "Miami hub",
    routeRecommendation: "Cross-dock through Miami for South Florida delivery routes.",
    status: "approved",
    supplierName: "Metro Supply Co.",
    promotion: "5% off 50+ cases"
  },
  {
    id: "p-1002",
    sku: "AD-FOD-204",
    brand: "North Table",
    upc: "734991220485",
    productName: "Shelf-stable pasta sauce variety pack",
    description: "Shelf-stable pasta sauce variety pack, 6 jars per case",
    category: "Grocery",
    subcategory: "Pantry",
    unitSize: "6 jars per case",
    imageUrl: "/product-images/pasta-sauce.svg",
    productDimensions: "3 x 3 x 6.5 in per jar",
    casePack: 6,
    caseDimensions: "16 x 11 x 9 in",
    caseWeight: "19 lb",
    palletConfiguration: "72 cases / pallet",
    supplierCost: 11.8,
    suggestedRetail: 27.54,
    moq: 24,
    leadTime: "1 week",
    inventoryAvailable: 610,
    location: "Orlando, FL",
    pickupLocation: "Orlando hub",
    shippingLocation: "Orlando, FL",
    deliveryRadius: "Central Florida",
    preferredHub: "Orlando hub",
    routeRecommendation: "Consolidate through Orlando for Central Florida and statewide replenishment.",
    status: "approved",
    supplierName: "Keystone Foods Wholesale"
  },
  {
    id: "p-1003",
    sku: "AD-OFC-812",
    brand: "Deskline",
    upc: "019552884110",
    productName: "Copy paper",
    description: "Copy paper, 10 reams per case, 92 brightness",
    category: "Office",
    subcategory: "Paper",
    unitSize: "10 reams per case",
    imageUrl: "/product-images/copy-paper.svg",
    productDimensions: "8.5 x 11 in per sheet",
    casePack: 10,
    caseDimensions: "19 x 13 x 11 in",
    caseWeight: "51 lb",
    palletConfiguration: "40 cases / pallet",
    supplierCost: 31.4,
    suggestedRetail: 58.99,
    moq: 8,
    leadTime: "2-4 business days",
    inventoryAvailable: 190,
    location: "Tampa, FL",
    pickupLocation: "Supplier warehouse",
    shippingLocation: "Tampa, FL",
    deliveryRadius: "National supplier-direct",
    preferredHub: "Supplier direct",
    routeRecommendation: "Supplier direct fulfillment through Atlas quote control; supplier ships after Atlas approval.",
    status: "approved",
    supplierName: "OfficeSource Direct"
  },
  {
    id: "p-1004",
    sku: "AD-HBA-332",
    brand: "Pure Harbor",
    upc: "602198334215",
    productName: "Hand soap refill pouches",
    description: "Hand soap refill pouches, aloe, 8 units per case",
    category: "Health & Beauty",
    subcategory: "Personal Care",
    unitSize: "8 pouches per case",
    imageUrl: "/product-images/hand-soap.svg",
    productDimensions: "5 x 2 x 8 in per pouch",
    casePack: 8,
    caseDimensions: "15 x 12 x 10 in",
    caseWeight: "24 lb",
    palletConfiguration: "60 cases / pallet",
    supplierCost: 16.75,
    suggestedRetail: 41.92,
    moq: 16,
    leadTime: "5-7 business days",
    inventoryAvailable: 275,
    location: "Doral, FL",
    pickupLocation: "Doral, FL",
    shippingLocation: "Miami, FL",
    deliveryRadius: "South Florida",
    preferredHub: "Miami hub",
    routeRecommendation: "Stage through Miami for import-closeout and South Florida routes.",
    status: "pending",
    supplierName: "Harborline Brands"
  }
];

export const sampleApplications: Application[] = [
  {
    id: "app-201",
    type: "buyer",
    companyName: "Value Corner Markets",
    contactName: "Maya Patel",
    email: "maya@valuecorner.example",
    phone: "(212) 555-0177",
    status: "pending",
    documents: [
      {
        id: "buyer-resale-certificate",
        label: "Resale certificate",
        fileName: "resale-certificate.pdf",
        status: "uploaded",
        expiresAt: "2026-06-20"
      },
      {
        id: "buyer-business-license",
        label: "Business license or state registration",
        fileName: "business-license.pdf",
        status: "approved",
        expiresAt: "2027-01-31"
      },
      {
        id: "buyer-storefront-proof",
        label: "Storefront, marketplace, or buying entity proof",
        status: "needed"
      }
    ],
    submittedAt: "2026-05-29"
  },
  {
    id: "app-202",
    type: "supplier",
    companyName: "Harborline Brands",
    contactName: "Jon Ellis",
    email: "jon@harborline.example",
    phone: "(469) 555-0112",
    status: "pending",
    documents: [
      {
        id: "supplier-w9",
        label: "Completed W-9",
        fileName: "w9.pdf",
        status: "uploaded"
      },
      {
        id: "supplier-insurance",
        label: "Certificate of insurance",
        fileName: "insurance.pdf",
        status: "rejected",
        expiresAt: "2026-05-15",
        rejectionReason: "Certificate is expired. Upload a current policy declaration page."
      },
      {
        id: "supplier-business-license",
        label: "Business license or state registration",
        status: "needed"
      },
      {
        id: "supplier-warehouse-details",
        label: "Warehouse / pickup location details",
        fileName: "warehouse-locations.xlsx",
        status: "approved"
      },
      {
        id: "supplier-compliance",
        label: "Product liability or compliance documents, if applicable",
        status: "needed",
        expiresAt: "2026-06-10"
      }
    ],
    submittedAt: "2026-05-30"
  },
  {
    id: "app-203",
    type: "route_seller",
    companyName: "Atlas Route Seller - South Miami",
    contactName: "Carlos Rivera",
    email: "carlos@routeseller.example",
    phone: "(305) 555-0194",
    status: "pending",
    documents: [
      {
        id: "route-seller-government-id",
        label: "Government ID",
        fileName: "driver-license.pdf",
        status: "uploaded"
      },
      {
        id: "route-seller-insurance",
        label: "Proof of auto insurance",
        fileName: "auto-insurance.pdf",
        status: "uploaded",
        expiresAt: "2026-07-01"
      },
      {
        id: "route-seller-vehicle-registration",
        label: "Vehicle registration",
        status: "needed",
        expiresAt: "2026-08-30"
      }
    ],
    routePreference: {
      program: "Independent Seller",
      hub: "Miami hub",
      territory: "Miami - Kendall / South Miami",
      productLane: "Convenience & dollar-store staples"
    },
    submittedAt: "2026-05-31"
  }
];

export const sampleRouteSellers: RouteSeller[] = [
  {
    id: "rs-101",
    name: "Carlos Rivera",
    program: "Independent Seller",
    territory: "South Miami / Doral",
    assignedHub: "Miami hub",
    productLane: "Convenience & dollar-store staples",
    status: "pending",
    monthlySales: 18420,
    activeAccounts: 14,
    routeStops: ["Doral Market", "Flagler Dollar", "South Miami Pharmacy", "Calle Ocho Mini Mart"]
  },
  {
    id: "rs-102",
    name: "Jasmine Lee",
    program: "Route Seller",
    territory: "Orlando / Kissimmee",
    assignedHub: "Orlando hub",
    productLane: "Grocery and pantry",
    status: "approved",
    monthlySales: 26750,
    activeAccounts: 21,
    routeStops: ["Kissimmee Value", "Orange Ave Grocery", "Central Mart", "Lake Buena Convenience"]
  }
];

export const sampleOrders: OrderRequest[] = [
  {
    id: "Q-1052",
    buyer: "Sunrise Supermarket",
    buyerRegion: "South Florida",
    totalCases: 24,
    estimatedValue: 543,
    fulfillmentType: "Pickup",
    hubRouting: "Miami hub: 24 cases",
    lineItems: [{ product: sampleProducts[0], quantity: 24 }],
    status: "Ready to confirm",
    createdAt: "2026-06-01"
  },
  {
    id: "Q-1048",
    buyer: "Value Corner Markets",
    buyerRegion: "South Florida",
    totalCases: 84,
    estimatedValue: 1588.4,
    fulfillmentType: "Atlas consolidation hub",
    hubRouting: "Miami hub + Orlando hub consolidation",
    lineItems: [
      { product: sampleProducts[0], quantity: 60 },
      { product: sampleProducts[1], quantity: 24 }
    ],
    status: "Admin review",
    createdAt: "2026-05-30"
  },
  {
    id: "Q-1042",
    buyer: "Main Street Pharmacy",
    buyerRegion: "South Florida",
    totalCases: 22,
    estimatedValue: 698.5,
    fulfillmentType: "Supplier direct",
    hubRouting: "Supplier direct from Miami, no hub handling",
    lineItems: [{ product: sampleProducts[0], quantity: 22 }],
    status: "Ready to confirm",
    createdAt: "2026-05-27"
  }
];
