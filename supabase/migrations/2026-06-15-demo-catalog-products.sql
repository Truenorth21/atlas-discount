-- Run this in the Supabase SQL editor.
-- Turns the four homepage demo tiles (Imported Cookies, Energy Drinks,
-- Hot Sauce Assortment, Coconut Water) into real, fully-detailed catalog
-- products so they appear in Products and the buyer catalog. They are
-- approved and ready to sell; delete them anytime from Admin → Products.
--
-- Idempotent: re-running replaces the same four DEMO- rows.

delete from public.products
where sku in ('DEMO-COOKIE-12', 'DEMO-ENERGY-24', 'DEMO-HOTSAUCE-12', 'DEMO-COCONUT-12');

insert into public.products (
  sku, brand, upc, product_name, description, category, subcategory, unit_size, image_url,
  product_dimensions, unit_weight, spec, case_pack, case_dimensions, case_weight, pallet_configuration,
  supplier_cost, tier_pricing, suggested_retail, moq, min_order_value, lead_time, inventory_available,
  pickup_shipping_location, pickup_location, shipping_location, delivery_radius,
  preferred_hub, supplier_name, promotion, placements, status
) values
(
  'DEMO-COOKIE-12', 'Imported Cookies', '850000000011', 'Belgian Butter Cookies, Assorted Tin',
  'Assorted imported butter cookies, retail-ready 12-unit case.', 'Grocery / Pantry', 'Snacks & candy', '5 oz',
  '/product-images/cookies.svg', '3 x 3 x 6 in', '5 oz',
  '{"casesPerPallet":80,"caseDims":{"weight":11,"weightUnit":"lb"},"fulfillmentMode":"delivered","shippingWarehouse":"Miami hub"}'::jsonb,
  12, '12 x 9 x 8 in', '11 lb', '20/floor x 4 high = 80 cases',
  18.00, '{"case":{"retailer":29.00,"distributor":25.50}}'::jsonb, 3.49, 2, 0, 'Ready today', 240,
  'Hialeah Gardens, FL', 'Hialeah Gardens, FL', 'Miami hub', 'South Florida',
  'Miami hub', 'Demo Imports Co.', 'Weekly deal', '{"weeklyDeal":true}'::jsonb, 'approved'
),
(
  'DEMO-ENERGY-24', 'Energy Drinks', '850000000028', 'Sugar-Free Energy Drink, 16 oz',
  'Sugar-free energy drinks, 24-can case.', 'Grocery / Pantry', 'Beverages', '16 oz',
  '/product-images/energy-drinks.svg', '2.6 x 2.6 x 6.5 in', '16 oz',
  '{"casesPerPallet":60,"caseDims":{"weight":28,"weightUnit":"lb"},"fulfillmentMode":"delivered","shippingWarehouse":"Orlando hub"}'::jsonb,
  24, '11 x 8 x 7 in', '28 lb', '15/floor x 4 high = 60 cases',
  22.00, '{"case":{"retailer":38.00,"distributor":33.50}}'::jsonb, 2.29, 2, 0, 'Pickup tomorrow', 360,
  'Orlando, FL', 'Orlando, FL', 'Orlando hub', 'Central Florida',
  'Orlando hub', 'Demo Beverage LLC', 'Fast mover', '{"homepageFeatured":true}'::jsonb, 'approved'
),
(
  'DEMO-HOTSAUCE-12', 'Hot Sauce Assortment', '850000000035', 'Hot Sauce Variety Pack (3 Flavors)',
  'Assorted hot sauces, 12-bottle variety case.', 'Grocery / Pantry', 'Condiments', '5 oz',
  '/product-images/hot-sauce.svg', '2 x 2 x 7 in', '8 oz',
  '{"casesPerPallet":96,"caseDims":{"weight":9,"weightUnit":"lb"},"fulfillmentMode":"delivered","shippingWarehouse":"Orlando hub"}'::jsonb,
  12, '10 x 8 x 8 in', '9 lb', '24/floor x 4 high = 96 cases',
  14.00, '{"case":{"retailer":24.00,"distributor":21.00}}'::jsonb, 2.99, 2, 0, 'Ready today', 180,
  'Both hubs', 'Orlando, FL', 'Both hubs', 'Florida',
  'Orlando hub', 'Demo Pantry Goods', 'New arrival', '{"homepageFeatured":true}'::jsonb, 'approved'
),
(
  'DEMO-COCONUT-12', 'Coconut Water', '850000000042', '100% Pure Coconut Water, 1 L',
  'Pure coconut water, 12 x 1L cartons.', 'Grocery / Pantry', 'Beverages', '1 L',
  '/product-images/coconut-water.svg', '3.5 x 3.5 x 9 in', '2.2 lb',
  '{"casesPerPallet":64,"caseDims":{"weight":29,"weightUnit":"lb"},"fulfillmentMode":"delivered"}'::jsonb,
  12, '13 x 10 x 10 in', '29 lb', '16/floor x 4 high = 64 cases',
  16.50, '{"case":{"retailer":27.00,"distributor":24.00}}'::jsonb, 2.79, 2, 0, '5-7 days', 500,
  'National shipping', '', 'Supplier direct', 'Nationwide',
  'Supplier direct', 'Demo Tropical Brands', 'Popular', '{}'::jsonb, 'approved'
);
