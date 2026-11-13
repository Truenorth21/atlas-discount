-- Supplier case prices may include half-cent values (for example $16.625).
-- Preserve three decimals while customer-facing prices continue rounding to cents.
alter table public.products
  alter column supplier_cost type numeric(12, 3)
  using supplier_cost::numeric(12, 3);
