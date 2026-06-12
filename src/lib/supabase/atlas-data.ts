"use client";

import { defaultPricingSettings } from "@/lib/data";
import type { AccountPricing, Application, ApprovalStatus, AtlasHub, CustomerTier, DocumentStatus, FulfillmentType, OrderRequest, PricingSettings, Product, ProductPlacements, ProductSpec, PromotionSubmission, RouteSellerPreference, TierPricing } from "@/lib/types";
import { createClient } from "./browser";

type ProductRow = {
  id: string;
  supplier_profile_id?: string | null;
  sku: string;
  brand: string;
  upc: string;
  product_name?: string | null;
  description: string;
  category: string;
  subcategory: string;
  unit_size?: string | null;
  image_url?: string | null;
  product_dimensions?: string | null;
  unit_weight?: string | null;
  spec?: ProductSpec | null;
  case_pack: number;
  case_dimensions?: string | null;
  case_weight?: string | null;
  pallet_configuration?: string | null;
  supplier_cost?: number | null;
  tier_pricing?: TierPricing | null;
  suggested_retail: number;
  moq: number;
  min_order_value?: number | null;
  lead_time: string;
  inventory_available: number;
  pickup_shipping_location?: string | null;
  pickup_location?: string | null;
  shipping_location?: string | null;
  delivery_radius?: string | null;
  preferred_hub: AtlasHub;
  route_recommendation?: string | null;
  status: Product["status"];
  supplier_name?: string | null;
  promotion?: string | null;
  placements?: ProductPlacements | null;
};

type PricingRow = {
  minimum_mixed_order_cases: number;
  minimum_order_value: number;
  supplier_direct_fee_percent: number;
  supplier_direct_minimum_fee: number;
  case_markup_percent: number;
  pallet_markup_percent: number;
  minimum_case_margin_per_case: number;
  minimum_pallet_margin_per_case: number;
  miami_hub_handling_per_case: number;
  miami_hub_cost_per_case: number;
  orlando_hub_handling_per_case: number;
  orlando_hub_cost_per_case: number;
  pickup_fee: number;
  local_delivery_fee: number;
  local_delivery_cost: number;
  freight_coordination_fee: number;
  freight_cost_estimate: number;
  route_seller_commission_percent: number;
  freight_case_threshold: number;
  featured_product_rate: number;
  weekly_deals_rate: number;
  monthly_circular_rate: number;
  newsletter_sponsorship_rate: number;
  whatsapp_promotion_rate: number;
  sponsored_category_rate: number;
  new_product_launch_rate: number;
  closeout_listing_rate: number;
  supplier_membership_rate: number;
  customer_pricing?: {
    customerTiers?: CustomerTier[];
    accountPricing?: AccountPricing[];
    hubTransferPerCase?: number;
    hubTransferCostPerCase?: number;
  } | null;
};

function productFromRow(row: ProductRow): Product {
  const location = row.pickup_shipping_location ?? row.pickup_location ?? row.shipping_location ?? "";

  return {
    id: row.id,
    sku: row.sku,
    brand: row.brand,
    upc: row.upc,
    productName: row.product_name || row.description,
    description: row.description,
    category: row.category,
    subcategory: row.subcategory,
    unitSize: row.unit_size ?? "",
    imageUrl: row.image_url || "/product-images/disinfecting-wipes.svg",
    productDimensions: row.product_dimensions ?? "",
    unitWeight: row.unit_weight ?? "",
    spec: (row.spec as ProductSpec) ?? undefined,
    casePack: Number(row.case_pack) || 1,
    caseDimensions: row.case_dimensions ?? "",
    caseWeight: row.case_weight ?? "",
    palletConfiguration: row.pallet_configuration ?? "",
    supplierCost: Number(row.supplier_cost) || 0,
    tierPricing: row.tier_pricing ?? undefined,
    suggestedRetail: Number(row.suggested_retail) || 0,
    moq: Number(row.moq) || 1,
    minOrderValue: row.min_order_value != null ? Number(row.min_order_value) : undefined,
    leadTime: row.lead_time,
    inventoryAvailable: Number(row.inventory_available) || 0,
    location,
    pickupLocation: row.pickup_location || location,
    shippingLocation: row.shipping_location || location,
    deliveryRadius: row.delivery_radius ?? "",
    preferredHub: row.preferred_hub,
    routeRecommendation:
      row.route_recommendation ??
      "Atlas will route this item through the nearest available hub or supplier-direct lane.",
    status: row.status,
    supplierName: row.supplier_name || "Atlas Supplier",
    promotion: row.promotion ?? undefined,
    placements: row.placements ?? undefined
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function productToRow(product: Product, supplierProfileId?: string | null) {
  const row = {
    supplier_profile_id: supplierProfileId ?? null,
    sku: product.sku,
    brand: product.brand,
    upc: product.upc,
    product_name: product.productName,
    description: product.description,
    category: product.category,
    subcategory: product.subcategory,
    unit_size: product.unitSize,
    image_url: product.imageUrl,
    product_dimensions: product.productDimensions,
    unit_weight: product.unitWeight ?? null,
    spec: product.spec ?? {},
    case_pack: product.casePack,
    case_dimensions: product.caseDimensions,
    case_weight: product.caseWeight,
    pallet_configuration: product.palletConfiguration,
    supplier_cost: product.supplierCost,
    tier_pricing: product.tierPricing ?? { case: {} },
    suggested_retail: product.suggestedRetail,
    moq: product.moq,
    min_order_value: product.minOrderValue ?? 0,
    lead_time: product.leadTime,
    inventory_available: product.inventoryAvailable,
    pickup_shipping_location: product.location,
    pickup_location: product.pickupLocation,
    shipping_location: product.shippingLocation,
    delivery_radius: product.deliveryRadius,
    preferred_hub: product.preferredHub,
    route_recommendation: product.routeRecommendation,
    status: product.status,
    supplier_name: product.supplierName,
    promotion: product.promotion ?? null,
    placements: product.placements ?? {}
  };

  return isUuid(product.id) ? { ...row, id: product.id } : row;
}

function pricingFromRow(row: PricingRow): PricingSettings {
  return {
    minimumMixedOrderCases: row.minimum_mixed_order_cases,
    minimumOrderValue: Number(row.minimum_order_value),
    supplierDirectFeePercent: Number(row.supplier_direct_fee_percent),
    supplierDirectMinimumFee: Number(row.supplier_direct_minimum_fee),
    caseMarkupPercent: Number(row.case_markup_percent),
    palletMarkupPercent: Number(row.pallet_markup_percent),
    minimumCaseMarginPerCase: Number(row.minimum_case_margin_per_case),
    minimumPalletMarginPerCase: Number(row.minimum_pallet_margin_per_case),
    miamiHubHandlingPerCase: Number(row.miami_hub_handling_per_case),
    miamiHubCostPerCase: Number(row.miami_hub_cost_per_case),
    orlandoHubHandlingPerCase: Number(row.orlando_hub_handling_per_case),
    orlandoHubCostPerCase: Number(row.orlando_hub_cost_per_case),
    pickupFee: Number(row.pickup_fee),
    localDeliveryFee: Number(row.local_delivery_fee),
    localDeliveryCost: Number(row.local_delivery_cost),
    freightCoordinationFee: Number(row.freight_coordination_fee),
    freightCostEstimate: Number(row.freight_cost_estimate),
    routeSellerCommissionPercent: Number(row.route_seller_commission_percent),
    freightCaseThreshold: row.freight_case_threshold,
    featuredProductRate: Number(row.featured_product_rate),
    weeklyDealsRate: Number(row.weekly_deals_rate),
    monthlyCircularRate: Number(row.monthly_circular_rate),
    newsletterSponsorshipRate: Number(row.newsletter_sponsorship_rate),
    whatsappPromotionRate: Number(row.whatsapp_promotion_rate),
    sponsoredCategoryRate: Number(row.sponsored_category_rate),
    newProductLaunchRate: Number(row.new_product_launch_rate),
    closeoutListingRate: Number(row.closeout_listing_rate),
    supplierMembershipRate: Number(row.supplier_membership_rate),
    customerTiers: row.customer_pricing?.customerTiers ?? defaultPricingSettings.customerTiers,
    accountPricing: row.customer_pricing?.accountPricing ?? defaultPricingSettings.accountPricing,
    hubTransferPerCase: row.customer_pricing?.hubTransferPerCase ?? defaultPricingSettings.hubTransferPerCase,
    hubTransferCostPerCase: row.customer_pricing?.hubTransferCostPerCase ?? defaultPricingSettings.hubTransferCostPerCase
  };
}

function pricingToRow(settings: PricingSettings) {
  return {
    id: true,
    minimum_mixed_order_cases: settings.minimumMixedOrderCases,
    minimum_order_value: settings.minimumOrderValue,
    supplier_direct_fee_percent: settings.supplierDirectFeePercent,
    supplier_direct_minimum_fee: settings.supplierDirectMinimumFee,
    case_markup_percent: settings.caseMarkupPercent,
    pallet_markup_percent: settings.palletMarkupPercent,
    minimum_case_margin_per_case: settings.minimumCaseMarginPerCase,
    minimum_pallet_margin_per_case: settings.minimumPalletMarginPerCase,
    miami_hub_handling_per_case: settings.miamiHubHandlingPerCase,
    miami_hub_cost_per_case: settings.miamiHubCostPerCase,
    orlando_hub_handling_per_case: settings.orlandoHubHandlingPerCase,
    orlando_hub_cost_per_case: settings.orlandoHubCostPerCase,
    pickup_fee: settings.pickupFee,
    local_delivery_fee: settings.localDeliveryFee,
    local_delivery_cost: settings.localDeliveryCost,
    freight_coordination_fee: settings.freightCoordinationFee,
    freight_cost_estimate: settings.freightCostEstimate,
    route_seller_commission_percent: settings.routeSellerCommissionPercent,
    freight_case_threshold: settings.freightCaseThreshold,
    featured_product_rate: settings.featuredProductRate,
    weekly_deals_rate: settings.weeklyDealsRate,
    monthly_circular_rate: settings.monthlyCircularRate,
    newsletter_sponsorship_rate: settings.newsletterSponsorshipRate,
    whatsapp_promotion_rate: settings.whatsappPromotionRate,
    sponsored_category_rate: settings.sponsoredCategoryRate,
    new_product_launch_rate: settings.newProductLaunchRate,
    closeout_listing_rate: settings.closeoutListingRate,
    supplier_membership_rate: settings.supplierMembershipRate,
    customer_pricing: {
      customerTiers: settings.customerTiers ?? [],
      accountPricing: settings.accountPricing ?? [],
      hubTransferPerCase: settings.hubTransferPerCase,
      hubTransferCostPerCase: settings.hubTransferCostPerCase
    },
    updated_at: new Date().toISOString()
  };
}

export async function loadSharedAtlasData() {
  const supabase = createClient();
  if (!supabase) return {};

  // Buyers and visitors read the catalog view (sell prices computed in the database,
  // supplier cost never leaves the server). Admin/supplier sessions also get raw
  // table rows via RLS; those override the view rows so internal tools keep cost data.
  const [{ data: tableRows }, { data: viewRows }, { data: pricing }] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: false }),
    supabase.from("catalog_products").select("*").order("created_at", { ascending: false }),
    supabase.from("pricing_settings").select("*").eq("id", true).maybeSingle()
  ]);

  const merged = new Map<string, ProductRow>();
  for (const row of (viewRows as ProductRow[] | null) ?? []) merged.set(row.id, row);
  for (const row of (tableRows as ProductRow[] | null) ?? []) merged.set(row.id, row);
  const products = merged.size > 0 ? Array.from(merged.values()).map(productFromRow) : undefined;

  return {
    products,
    pricingSettings: pricing ? { ...defaultPricingSettings, ...pricingFromRow(pricing as PricingRow) } : undefined
  };
}

export async function saveSharedProducts(products: Product[]) {
  const supabase = createClient();
  if (!supabase || products.length === 0) return;

  const { data: userData } = await supabase.auth.getUser();
  let supplierProfileId: string | null = null;

  if (userData.user) {
    const { data: supplierProfile } = await supabase
      .from("supplier_profiles")
      .select("id")
      .eq("profile_id", userData.user.id)
      .maybeSingle();

    supplierProfileId = supplierProfile?.id ?? null;
  }

  await supabase.from("products").upsert(products.map((product) => productToRow(product, supplierProfileId)), {
    onConflict: "id"
  });
}

export async function saveSharedProductStatus(id: string, status: Product["status"]) {
  const supabase = createClient();
  if (!supabase || !isUuid(id)) return;

  await supabase.from("products").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
}

type ProfileRow = {
  id: string;
  role: "buyer" | "supplier" | "route_seller" | "admin";
  company_name: string;
  contact_name: string;
  email: string | null;
  phone: string | null;
  status: ApprovalStatus;
  created_at: string;
};

type BusinessDocumentRow = {
  id: string;
  profile_id: string;
  document_type: string;
  storage_path: string;
  status: ApprovalStatus;
  expires_at: string | null;
  rejection_reason: string | null;
};

type RouteProfileRow = {
  profile_id: string;
  program: string;
  territory: string;
  assigned_hub: AtlasHub;
  product_lane: string;
};

function documentStatusFromRow(status: ApprovalStatus): DocumentStatus {
  // A row only exists once a document is uploaded, so "pending" means "awaiting review".
  return status === "approved" ? "approved" : status === "rejected" ? "rejected" : "uploaded";
}

/**
 * Loads real buyer/supplier/route-seller applications (profiles + documents)
 * from Supabase. RLS returns all rows to an admin session, the user's own to a
 * signed-in non-admin, and none to an anonymous request. Returns undefined when
 * Supabase isn't configured or the query fails (caller keeps demo data).
 */
export async function loadAdminApplications(): Promise<Application[] | undefined> {
  const supabase = createClient();
  if (!supabase) return undefined;

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .neq("role", "admin")
    .order("created_at", { ascending: false });

  if (error || !profiles) return undefined;

  const [{ data: documents }, { data: routeProfiles }] = await Promise.all([
    supabase.from("business_documents").select("*"),
    supabase.from("route_seller_profiles").select("*")
  ]);

  const documentRows = (documents as BusinessDocumentRow[] | null) ?? [];
  const routeRows = (routeProfiles as RouteProfileRow[] | null) ?? [];

  return (profiles as ProfileRow[]).map((profile) => {
    const routeRow = routeRows.find((row) => row.profile_id === profile.id);
    return {
      id: profile.id,
      type: profile.role as Application["type"],
      companyName: profile.company_name,
      contactName: profile.contact_name,
      email: profile.email ?? "",
      phone: profile.phone ?? "",
      status: profile.status,
      documents: documentRows
        .filter((row) => row.profile_id === profile.id)
        .map((row) => ({
          id: row.id,
          label: row.document_type,
          fileName: row.storage_path ? row.storage_path.split("/").pop() : undefined,
          expiresAt: row.expires_at ?? undefined,
          status: documentStatusFromRow(row.status),
          rejectionReason: row.rejection_reason ?? undefined
        })),
      routePreference:
        profile.role === "route_seller" && routeRow
          ? {
              program: routeRow.program as RouteSellerPreference["program"],
              hub: routeRow.assigned_hub as Exclude<AtlasHub, "Supplier direct">,
              territory: routeRow.territory,
              productLane: routeRow.product_lane
            }
          : undefined,
      submittedAt: (profile.created_at ?? "").slice(0, 10)
    };
  });
}

export async function saveApplicationStatus(id: string, status: ApprovalStatus) {
  const supabase = createClient();
  if (!supabase || !isUuid(id)) return;

  await supabase.from("profiles").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  await supabase.from("supplier_profiles").update({ status }).eq("profile_id", id);
  await supabase.from("route_seller_profiles").update({ status }).eq("profile_id", id);
}

export async function saveDocumentReview(documentId: string, status: DocumentStatus, rejectionReason?: string) {
  const supabase = createClient();
  if (!supabase || !isUuid(documentId)) return;

  const dbStatus: ApprovalStatus = status === "approved" ? "approved" : status === "rejected" ? "rejected" : "pending";
  await supabase
    .from("business_documents")
    .update({
      status: dbStatus,
      rejection_reason: status === "rejected" ? rejectionReason ?? null : null,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", documentId);
}

type OrderRow = {
  id: string;
  buyer_profile_id: string;
  fulfillment_type: FulfillmentType;
  hub_routing: string;
  status: string;
  notes: string | null;
  created_at: string;
};

type OrderItemRow = { order_request_id: string; product_id: string; quantity: number };

/** Persists a buyer's quote/order request and its line items. */
export async function saveOrderRequest(order: OrderRequest): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;

  const { data: userData } = await supabase.auth.getUser();
  const buyerId = userData.user?.id;
  if (!buyerId) return;

  const { data, error } = await supabase
    .from("order_requests")
    .insert({
      buyer_profile_id: buyerId,
      fulfillment_type: order.fulfillmentType,
      hub_routing: order.hubRouting || "Atlas routing review",
      status: order.status,
      notes: order.buyerRegion ? `Region: ${order.buyerRegion}` : null
    })
    .select("id")
    .single();

  if (error || !data) return;

  // Only persist items that reference real Supabase products (UUID ids).
  const items = (order.lineItems ?? []).filter((line) => isUuid(line.product.id));
  if (items.length > 0) {
    await supabase
      .from("order_request_items")
      .insert(items.map((line) => ({ order_request_id: data.id, product_id: line.product.id, quantity: line.quantity })));
  }
}

/** Loads order/quote requests with their line items for the admin queue. */
export async function loadAdminOrders(): Promise<OrderRequest[] | undefined> {
  const supabase = createClient();
  if (!supabase) return undefined;

  const { data: orders, error } = await supabase.from("order_requests").select("*").order("created_at", { ascending: false });
  if (error || !orders) return undefined;
  if (orders.length === 0) return [];

  const [{ data: items }, { data: products }, { data: profiles }] = await Promise.all([
    supabase.from("order_request_items").select("*"),
    supabase.from("products").select("*"),
    supabase.from("profiles").select("id,company_name")
  ]);

  const productMap = new Map(((products as ProductRow[] | null) ?? []).map((row) => [row.id, productFromRow(row)]));
  const profileMap = new Map(((profiles as { id: string; company_name: string }[] | null) ?? []).map((row) => [row.id, row.company_name]));
  const itemRows = (items as OrderItemRow[] | null) ?? [];

  return (orders as OrderRow[]).map((order) => {
    const lineItems = itemRows
      .filter((row) => row.order_request_id === order.id)
      .map((row) => {
        const product = productMap.get(row.product_id);
        return product ? { product, quantity: row.quantity } : null;
      })
      .filter((line): line is { product: Product; quantity: number } => line !== null);

    return {
      id: order.id,
      buyer: profileMap.get(order.buyer_profile_id) ?? "Buyer",
      buyerRegion: order.notes?.startsWith("Region: ") ? order.notes.slice("Region: ".length) : undefined,
      totalCases: lineItems.reduce((sum, line) => sum + line.quantity, 0),
      estimatedValue: 0,
      fulfillmentType: order.fulfillment_type,
      hubRouting: order.hub_routing,
      lineItems,
      status: order.status as OrderRequest["status"],
      createdAt: (order.created_at ?? "").slice(0, 10)
    };
  });
}

type PromotionSubmissionRow = {
  id: string;
  title: string;
  details: string;
  status: ApprovalStatus;
  created_at: string;
  supplier_profiles?: { legal_name: string | null } | null;
};

/** A supplier books an ad placement. Looks up the supplier's profile for the FK. */
export async function savePromotionSubmission(submission: PromotionSubmission): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;

  const { data: supplierProfile } = await supabase
    .from("supplier_profiles")
    .select("id")
    .eq("profile_id", userData.user.id)
    .maybeSingle();
  if (!supplierProfile) return;

  await supabase.from("promotion_submissions").insert({
    supplier_profile_id: supplierProfile.id,
    title: submission.placement,
    details: submission.note ?? "",
    status: "pending"
  });
}

/** Admin reads all supplier ad requests (requires an admin select policy). */
export async function loadPromotionSubmissions(): Promise<PromotionSubmission[] | undefined> {
  const supabase = createClient();
  if (!supabase) return undefined;

  const { data, error } = await supabase
    .from("promotion_submissions")
    .select("*, supplier_profiles(legal_name)")
    .order("created_at", { ascending: false });

  if (error || !data) return undefined;

  return (data as PromotionSubmissionRow[]).map((row) => ({
    id: row.id,
    supplierName: row.supplier_profiles?.legal_name ?? "Supplier",
    placement: row.title,
    note: row.details || undefined,
    status: row.status,
    submittedAt: (row.created_at ?? "").slice(0, 10)
  }));
}

export async function savePromotionSubmissionStatus(id: string, status: ApprovalStatus) {
  const supabase = createClient();
  if (!supabase || !isUuid(id)) return;

  await supabase.from("promotion_submissions").update({ status }).eq("id", id);
}

export async function saveSharedProductPromotion(id: string, promotion?: string) {
  const supabase = createClient();
  if (!supabase || !isUuid(id)) return;

  await supabase
    .from("products")
    .update({ promotion: promotion || null, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function saveSharedProductSpec(id: string, spec: ProductSpec) {
  const supabase = createClient();
  if (!supabase || !isUuid(id)) return;

  await supabase
    .from("products")
    .update({ spec: spec ?? {}, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function saveSharedProduct(product: Product) {
  const supabase = createClient();
  if (!supabase || !isUuid(product.id)) return;

  // Drop id + supplier link so an edit never reassigns ownership.
  const { id: _id, supplier_profile_id: _sp, ...row } = productToRow(product) as {
    id?: string;
    supplier_profile_id?: string | null;
  } & Record<string, unknown>;
  await supabase
    .from("products")
    .update({ ...row, updated_at: new Date().toISOString() })
    .eq("id", product.id);
}

export async function deleteSharedProduct(id: string) {
  const supabase = createClient();
  if (!supabase || !isUuid(id)) return;

  await supabase.from("products").delete().eq("id", id);
}

export async function saveSharedProductPlacements(id: string, placements: ProductPlacements) {
  const supabase = createClient();
  if (!supabase || !isUuid(id)) return;

  await supabase
    .from("products")
    .update({ placements: placements ?? {}, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function saveSharedProductTierPricing(id: string, tierPricing: TierPricing) {
  const supabase = createClient();
  if (!supabase || !isUuid(id)) return;

  await supabase
    .from("products")
    .update({ tier_pricing: tierPricing, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function saveSharedPricingSettings(settings: PricingSettings) {
  const supabase = createClient();
  if (!supabase) return;

  await supabase.from("pricing_settings").upsert(pricingToRow(settings), { onConflict: "id" });
}
