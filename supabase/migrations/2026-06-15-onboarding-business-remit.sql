-- Run this in the Supabase SQL editor. Safe to re-run.
-- Adds:
--  - profiles.business_details  : buyer EIN + business/ship-to address (signup)
--  - supplier_profiles.remit_to : supplier payee/remittance preference
--    (collected post-approval; NO bank/ACH account numbers are stored here)

alter table public.profiles
  add column if not exists business_details jsonb;

alter table public.supplier_profiles
  add column if not exists remit_to jsonb;
