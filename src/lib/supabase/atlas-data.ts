"use client";

import { defaultPricingSettings } from "@/lib/data";
import type { AtlasHub, PricingSettings, Product } from "@/lib/types";
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
  case_pack: number;
  case_dimensions?: string | null;
  case_weight?: string | null;
  pallet_configuration?: string | null;
  supplier_cost: number;
  suggested_retail: number;
  moq: number;
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
    casePack: Number(row.case_pack) || 1,
    caseDimensions: row.case_dimensions ?? "",
    caseWeight: row.case_weight ?? "",
    palletConfiguration: row.pallet_configuration ?? "",
    supplierCost: Number(row.supplier_cost) || 0,
    suggestedRetail: Number(row.suggested_retail) || 0,
    moq: Number(row.moq) || 1,
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
    promotion: row.promotion ?? undefined
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
    case_pack: product.casePack,
    case_dimensions: product.caseDimensions,
    case_weight: product.caseWeight,
    pallet_configuration: product.palletConfiguration,
    supplier_cost: product.supplierCost,
    suggested_retail: product.suggestedRetail,
    moq: product.moq,
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
    promotion: product.promotion ?? null
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
    supplierMembershipRate: Number(row.supplier_membership_rate)
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
    updated_at: new Date().toISOString()
  };
}

export async function loadSharedAtlasData() {
  const supabase = createClient();
  if (!supabase) return {};

  const [{ data: products }, { data: pricing }] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: false }),
    supabase.from("pricing_settings").select("*").eq("id", true).maybeSingle()
  ]);

  return {
    products: products?.map((row) => productFromRow(row as ProductRow)),
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

export async function saveSharedProductPromotion(id: string, promotion?: string) {
  const supabase = createClient();
  if (!supabase || !isUuid(id)) return;

  await supabase
    .from("products")
    .update({ promotion: promotion || null, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function saveSharedPricingSettings(settings: PricingSettings) {
  const supabase = createClient();
  if (!supabase) return;

  await supabase.from("pricing_settings").upsert(pricingToRow(settings), { onConflict: "id" });
}
