-- Run this in the Supabase SQL editor (project lhfgupxhxzcgvfxcwfte).
-- Self-contained: adds any columns the deployed DB is missing, then builds the view.

-- 0. Catch up product columns added in later schema versions (no-ops if present).
alter table public.products add column if not exists product_name text not null default '';
alter table public.products add column if not exists unit_size text not null default '';
alter table public.products add column if not exists unit_weight text default '';
alter table public.products add column if not exists spec jsonb not null default '{}'::jsonb;
alter table public.products add column if not exists pickup_location text not null default '';
alter table public.products add column if not exists shipping_location text not null default '';
alter table public.products add column if not exists delivery_radius text not null default '';
alter table public.products add column if not exists promotion text;
alter table public.products add column if not exists route_recommendation text not null default 'Atlas will route this item through the nearest available hub or supplier-direct lane.';
alter table public.products add column if not exists supplier_name text not null default 'Atlas Supplier';

-- 1. Persist tier/account pricing config (safe if already run).
alter table public.pricing_settings
  add column if not exists customer_pricing jsonb not null default '{}'::jsonb;

-- 2. Public catalog view: approved products with sell prices computed in the
--    database. supplier_cost is excluded — buyers never see cost or margin.
create or replace view public.catalog_products as
select
  p.id, p.sku, p.brand, p.upc, p.product_name, p.description, p.category, p.subcategory,
  p.unit_size, p.image_url, p.product_dimensions, p.unit_weight, p.spec,
  p.case_pack, p.case_dimensions, p.case_weight, p.pallet_configuration,
  p.suggested_retail, p.moq, p.lead_time, p.inventory_available,
  p.pickup_shipping_location, p.pickup_location, p.shipping_location, p.delivery_radius,
  p.preferred_hub, p.route_recommendation, p.supplier_name, p.promotion, p.status, p.created_at,
  round(greatest(p.supplier_cost * (1 + coalesce(ps.case_markup_percent, 24) / 100),
                 p.supplier_cost + coalesce(ps.minimum_case_margin_per_case, 3)), 2) as case_price,
  round(greatest(p.supplier_cost * (1 + coalesce(ps.pallet_markup_percent, 12) / 100),
                 p.supplier_cost + coalesce(ps.minimum_pallet_margin_per_case, 1.5)), 2) as pallet_price,
  round(p.supplier_cost * (1 + coalesce(ps.supplier_direct_fee_percent, 10) / 100), 2) as supplier_direct_price
from public.products p
left join public.pricing_settings ps on ps.id = true
where p.status = 'approved';

grant select on public.catalog_products to anon, authenticated;

-- 3. Close the hole: buyers/visitors can no longer read raw product rows
--    (which include supplier_cost). Suppliers still see their own products;
--    admins still see everything.
drop policy if exists "approved products visible" on public.products;
