-- Run this in the Supabase SQL editor.
-- Backfills CASE dimensions (L x W x H, inches) + case weight (lb) onto the demo
-- products so the auto cases-per-pallet calc and the buyer cart's pallet/weight
-- read have data to work with. These are reasonable DEMO placeholders — replace
-- with each product's real case specs when you have them.
--
-- Safe to re-run (sets fixed values). Merges into the existing `spec` jsonb and
-- only replaces the `caseDims` key, leaving other spec fields untouched.

-- Imported Cookies (12 units/case)
update products
set spec = coalesce(spec, '{}'::jsonb) || jsonb_build_object(
      'caseDims', jsonb_build_object('length', 16, 'width', 12, 'height', 10, 'weight', 15, 'weightUnit', 'lb')
    ),
    case_weight = '15 lb',
    updated_at = now()
where sku = 'DEMO-COOKIE-12';

-- Hot Sauce Assortment (12 bottles/case)
update products
set spec = coalesce(spec, '{}'::jsonb) || jsonb_build_object(
      'caseDims', jsonb_build_object('length', 12, 'width', 9, 'height', 10, 'weight', 22, 'weightUnit', 'lb')
    ),
    case_weight = '22 lb',
    updated_at = now()
where sku = 'DEMO-HOTSAUCE-12';

-- Energy Drinks (24 cans/case)
update products
set spec = coalesce(spec, '{}'::jsonb) || jsonb_build_object(
      'caseDims', jsonb_build_object('length', 16, 'width', 11, 'height', 9, 'weight', 25, 'weightUnit', 'lb')
    ),
    case_weight = '25 lb',
    updated_at = now()
where sku = 'DEMO-ENERGY-24';

-- Coconut Water (12 cartons/case)
update products
set spec = coalesce(spec, '{}'::jsonb) || jsonb_build_object(
      'caseDims', jsonb_build_object('length', 13, 'width', 10, 'height', 9, 'weight', 28, 'weightUnit', 'lb')
    ),
    case_weight = '28 lb',
    updated_at = now()
where sku = 'DEMO-COCONUT-12';

-- Esponjabon — Mother of Pearl 2-in-1 Soap and Sponge
update products
set spec = coalesce(spec, '{}'::jsonb) || jsonb_build_object(
      'caseDims', jsonb_build_object('length', 14, 'width', 10, 'height', 8, 'weight', 18, 'weightUnit', 'lb')
    ),
    case_weight = '18 lb',
    updated_at = now()
where sku = 'ESMOP';
