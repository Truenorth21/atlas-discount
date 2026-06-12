-- Run in the Supabase SQL editor (project lhfgupxhxzcgvfxcwfte).
-- Moves to explicit admin-entered per-tier prices (master case + optional full pallet).
-- Cost stays admin-only; the catalog view exposes tier_pricing, never supplier_cost.

-- 1. Per-product tier prices, stored as JSON: {"case":{"retailer":36,"distributor":32,"atlas_rep":29},
--    "pallet":{"retailer":34,...}}  (pallet optional).
alter table public.products
  add column if not exists tier_pricing jsonb not null default '{"case":{}}'::jsonb;

-- 2. Rebuild the public catalog view: expose tier prices, drop the old cost-derived columns.
create or replace view public.catalog_products as
select
  p.id, p.sku, p.brand, p.upc, p.product_name, p.description, p.category, p.subcategory,
  p.unit_size, p.image_url, p.product_dimensions, p.unit_weight, p.spec,
  p.case_pack, p.case_dimensions, p.case_weight, p.pallet_configuration,
  p.suggested_retail, p.moq, p.lead_time, p.inventory_available,
  p.pickup_shipping_location, p.pickup_location, p.shipping_location, p.delivery_radius,
  p.preferred_hub, p.route_recommendation, p.supplier_name, p.promotion, p.status, p.created_at,
  p.tier_pricing
from public.products p
where p.status = 'approved';

grant select on public.catalog_products to anon, authenticated;
