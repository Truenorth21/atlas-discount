import type { Product } from "@/lib/types";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function productToRow(product: Product, supplierProfileId?: string | null) {
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
    supplier_pallet_cost: product.supplierPalletCost ?? null,
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
