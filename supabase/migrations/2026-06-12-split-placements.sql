-- Run in the Supabase SQL editor (project lhfgupxhxzcgvfxcwfte).
-- Splits a product's single promotion flag into independent paid placements:
-- {"homepageFeatured":true,"weeklyDeal":true}. Each can be sold separately.

-- 1. Placement flags per product.
alter table public.products
  add column if not exists placements jsonb not null default '{}'::jsonb;

-- 2. Back-compat: any product already flagged with a promotion label becomes a Weekly Deal.
update public.products
set placements = jsonb_set(coalesce(placements, '{}'::jsonb), '{weeklyDeal}', 'true'::jsonb)
where coalesce(promotion, '') <> '' and not (placements ? 'weeklyDeal');

-- 3. Expose placements on the public catalog view (drop+recreate to add the column).
drop view if exists public.catalog_products;
create view public.catalog_products as
select
  p.id, p.sku, p.brand, p.upc, p.product_name, p.description, p.category, p.subcategory,
  p.unit_size, p.image_url, p.product_dimensions, p.unit_weight, p.spec,
  p.case_pack, p.case_dimensions, p.case_weight, p.pallet_configuration,
  p.suggested_retail, p.moq, p.lead_time, p.inventory_available,
  p.pickup_shipping_location, p.pickup_location, p.shipping_location, p.delivery_radius,
  p.preferred_hub, p.route_recommendation, p.supplier_name, p.promotion, p.placements, p.status, p.created_at,
  p.tier_pricing
from public.products p
where p.status = 'approved';

grant select on public.catalog_products to anon, authenticated;
