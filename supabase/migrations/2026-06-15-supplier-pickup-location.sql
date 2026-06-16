-- Run this in the Supabase SQL editor.
-- Suppliers now provide their warehouse/pickup location as a structured address
-- (collected at registration) instead of an uploaded "location details" file —
-- Atlas needs the real address to route pickups and freight. Safe to re-run.

alter table public.supplier_profiles
  add column if not exists pickup_location jsonb;
