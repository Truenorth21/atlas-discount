-- Run this in the Supabase SQL editor.
-- Creates a public storage bucket for product images and the access policies
-- so admins/suppliers (authenticated) can upload and everyone can view.
-- Safe to re-run.

-- 1. Public bucket.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

-- 2. Policies on storage.objects scoped to this bucket.
drop policy if exists "product-images public read" on storage.objects;
create policy "product-images public read"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "product-images authenticated insert" on storage.objects;
create policy "product-images authenticated insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images');

drop policy if exists "product-images authenticated update" on storage.objects;
create policy "product-images authenticated update"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images');
