-- Run this in the Supabase SQL editor.
-- Gives the four demo products distinct product names (shown under the brand
-- on catalog cards) so they read as real items, not a repeat of the brand.
-- Safe to run more than once.

update public.products set product_name = 'Belgian Butter Cookies, Assorted Tin' where sku = 'DEMO-COOKIE-12';
update public.products set product_name = 'Sugar-Free Energy Drink, 16 oz'        where sku = 'DEMO-ENERGY-24';
update public.products set product_name = 'Hot Sauce Variety Pack (3 Flavors)'    where sku = 'DEMO-HOTSAUCE-12';
update public.products set product_name = '100% Pure Coconut Water, 1 L'          where sku = 'DEMO-COCONUT-12';
