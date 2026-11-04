-- Suppliers may quote Atlas a separate total cost for a complete pallet.
-- This stays on the protected products table and is intentionally excluded
-- from catalog_products, just like supplier_cost.
alter table public.products
  add column if not exists supplier_pallet_cost numeric(12, 2);

comment on column public.products.supplier_pallet_cost is
  'Optional total amount Atlas pays for one full pallet; never exposed in catalog_products.';
