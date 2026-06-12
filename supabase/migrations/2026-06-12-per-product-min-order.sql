-- Run in the Supabase SQL editor (project lhfgupxhxzcgvfxcwfte).
-- Adds a per-product minimum order value, and exposes it on the catalog view.
-- (Per-product min cases = existing `moq`; cases-per-pallet lives in spec.casesPerPallet.)

-- 1. Per-product minimum order value ($). Buyer meets min cases OR min value.
alter table public.products
  add column if not exists min_order_value numeric(12, 2) not null default 0;

-- 2. Rebuild the catalog view to include min_order_value (drop+recreate to add a column).
drop view if exists public.catalog_products;
create view public.catalog_products as
select
  p.id, p.sku, p.brand, p.upc, p.product_name, p.description, p.category, p.subcategory,
  p.unit_size, p.image_url, p.product_dimensions, p.unit_weight, p.spec,
  p.case_pack, p.case_dimensions, p.case_weight, p.pallet_configuration,
  p.suggested_retail, p.moq, p.min_order_value, p.lead_time, p.inventory_available,
  p.pickup_shipping_location, p.pickup_location, p.shipping_location, p.delivery_radius,
  p.preferred_hub, p.route_recommendation, p.supplier_name, p.promotion, p.placements, p.status, p.created_at,
  p.tier_pricing
from public.products p
where p.status = 'approved';

grant select on public.catalog_products to anon, authenticated;
