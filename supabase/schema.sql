create extension if not exists "uuid-ossp";

create type public.user_role as enum ('buyer', 'supplier', 'route_seller', 'admin');
create type public.approval_status as enum ('pending', 'approved', 'rejected');
create type public.fulfillment_type as enum (
  'Supplier direct',
  'Atlas consolidation hub',
  'Pickup',
  'Local delivery',
  'Freight quote needed'
);
create type public.atlas_hub as enum ('Miami hub', 'Orlando hub', 'Supplier direct');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  company_name text not null,
  contact_name text not null,
  phone text,
  status public.approval_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_documents (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  document_type text not null,
  storage_path text not null,
  status public.approval_status not null default 'pending',
  expires_at date,
  rejection_reason text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.supplier_profiles (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  legal_name text not null,
  warehouse_locations text[] not null default '{}',
  primary_hub public.atlas_hub not null default 'Orlando hub',
  fulfillment_capabilities public.fulfillment_type[] not null default '{}',
  status public.approval_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.route_seller_profiles (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  program text not null default 'Independent Seller',
  territory text not null default 'Pending Atlas assignment',
  assigned_hub public.atlas_hub not null default 'Miami hub',
  product_lane text not null default 'Pending Atlas assignment',
  status public.approval_status not null default 'pending',
  created_at timestamptz not null default now()
);

create unique index route_seller_unique_approved_lane
  on public.route_seller_profiles (assigned_hub, territory, product_lane)
  where status = 'approved';

create table public.product_uploads (
  id uuid primary key default uuid_generate_v4(),
  supplier_profile_id uuid not null references public.supplier_profiles(id) on delete cascade,
  file_name text not null,
  storage_path text,
  status public.approval_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default uuid_generate_v4(),
  supplier_profile_id uuid references public.supplier_profiles(id) on delete cascade,
  product_upload_id uuid references public.product_uploads(id) on delete set null,
  sku text not null,
  brand text not null,
  upc text not null,
  product_name text not null default '',
  description text not null,
  category text not null,
  subcategory text not null,
  unit_size text not null default '',
  image_url text not null default '',
  product_dimensions text not null,
  unit_weight text default '',
  case_pack integer not null,
  case_dimensions text not null,
  case_weight text not null,
  pallet_configuration text not null,
  supplier_cost numeric(12, 2) not null,
  suggested_retail numeric(12, 2) not null,
  moq integer not null,
  lead_time text not null,
  inventory_available integer not null default 0,
  pickup_shipping_location text not null,
  pickup_location text not null default '',
  shipping_location text not null default '',
  delivery_radius text not null default '',
  preferred_hub public.atlas_hub not null default 'Orlando hub',
  route_recommendation text not null default 'Atlas will route this item through the nearest available hub or supplier-direct lane.',
  supplier_name text not null default 'Atlas Supplier',
  promotion text,
  status public.approval_status not null default 'pending',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (supplier_profile_id, sku)
);

create index products_search_idx on public.products using gin (
  to_tsvector('english', brand || ' ' || upc || ' ' || sku || ' ' || product_name || ' ' || description || ' ' || category || ' ' || subcategory)
);

create table public.saved_lists (
  id uuid primary key default uuid_generate_v4(),
  buyer_profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.saved_list_items (
  id uuid primary key default uuid_generate_v4(),
  saved_list_id uuid not null references public.saved_lists(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1,
  unique (saved_list_id, product_id)
);

create table public.order_requests (
  id uuid primary key default uuid_generate_v4(),
  buyer_profile_id uuid not null references public.profiles(id) on delete cascade,
  fulfillment_type public.fulfillment_type not null,
  hub_routing text not null default 'Atlas routing review',
  status text not null default 'Quote requested',
  notes text,
  created_at timestamptz not null default now()
);

create table public.order_request_items (
  id uuid primary key default uuid_generate_v4(),
  order_request_id uuid not null references public.order_requests(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null,
  quoted_cost numeric(12, 2),
  created_at timestamptz not null default now()
);

create table public.quote_adjustments (
  id uuid primary key default uuid_generate_v4(),
  order_request_id uuid not null unique references public.order_requests(id) on delete cascade,
  fulfillment_type public.fulfillment_type,
  hub_routing text,
  case_markup_percent numeric(8, 2),
  pallet_markup_percent numeric(8, 2),
  supplier_direct_fee_percent numeric(8, 2),
  local_delivery_fee numeric(12, 2),
  pickup_fee numeric(12, 2),
  freight_coordination_fee numeric(12, 2),
  additional_fee numeric(12, 2) not null default 0,
  order_discount numeric(12, 2) not null default 0,
  free_delivery boolean not null default false,
  free_product_note text,
  internal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pricing_settings (
  id boolean primary key default true,
  minimum_mixed_order_cases integer not null default 24,
  minimum_order_value numeric(12, 2) not null default 500,
  supplier_direct_fee_percent numeric(8, 2) not null default 10,
  supplier_direct_minimum_fee numeric(12, 2) not null default 35,
  case_markup_percent numeric(8, 2) not null default 24,
  pallet_markup_percent numeric(8, 2) not null default 12,
  minimum_case_margin_per_case numeric(12, 2) not null default 3.00,
  minimum_pallet_margin_per_case numeric(12, 2) not null default 1.50,
  miami_hub_handling_per_case numeric(12, 2) not null default 1.50,
  miami_hub_cost_per_case numeric(12, 2) not null default 0.75,
  orlando_hub_handling_per_case numeric(12, 2) not null default 1.35,
  orlando_hub_cost_per_case numeric(12, 2) not null default 0.70,
  pickup_fee numeric(12, 2) not null default 0,
  local_delivery_fee numeric(12, 2) not null default 75,
  local_delivery_cost numeric(12, 2) not null default 48,
  freight_coordination_fee numeric(12, 2) not null default 125,
  freight_cost_estimate numeric(12, 2) not null default 95,
  route_seller_commission_percent numeric(8, 2) not null default 3,
  freight_case_threshold integer not null default 96,
  featured_product_rate numeric(12, 2) not null default 250,
  weekly_deals_rate numeric(12, 2) not null default 175,
  monthly_circular_rate numeric(12, 2) not null default 500,
  newsletter_sponsorship_rate numeric(12, 2) not null default 125,
  whatsapp_promotion_rate numeric(12, 2) not null default 75,
  sponsored_category_rate numeric(12, 2) not null default 350,
  new_product_launch_rate numeric(12, 2) not null default 225,
  closeout_listing_rate numeric(12, 2) not null default 150,
  supplier_membership_rate numeric(12, 2) not null default 99,
  updated_at timestamptz not null default now(),
  constraint one_pricing_settings_row check (id = true)
);

create table public.promotion_submissions (
  id uuid primary key default uuid_generate_v4(),
  supplier_profile_id uuid not null references public.supplier_profiles(id) on delete cascade,
  title text not null,
  details text not null,
  status public.approval_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.marketing_campaigns (
  id uuid primary key default uuid_generate_v4(),
  campaign_code text not null unique,
  source text not null,
  channel text not null,
  city text,
  state text,
  product_lane text,
  status text not null default 'Draft',
  spend numeric(12, 2) not null default 0,
  visits integer not null default 0,
  quote_requests integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.business_documents enable row level security;
alter table public.supplier_profiles enable row level security;
alter table public.route_seller_profiles enable row level security;
alter table public.product_uploads enable row level security;
alter table public.products enable row level security;
alter table public.saved_lists enable row level security;
alter table public.saved_list_items enable row level security;
alter table public.order_requests enable row level security;
alter table public.order_request_items enable row level security;
alter table public.quote_adjustments enable row level security;
alter table public.pricing_settings enable row level security;
alter table public.promotion_submissions enable row level security;
alter table public.marketing_campaigns enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
    and profiles.status = 'approved'
  );
$$;

create or replace function public.owns_supplier_profile(supplier_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.supplier_profiles
    where supplier_profiles.id = supplier_id
    and supplier_profiles.profile_id = auth.uid()
  );
$$;

create policy "profiles own record" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles insert own record" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles admin all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

create policy "documents owner select" on public.business_documents
  for select using (auth.uid() = profile_id or public.is_admin());

create policy "documents owner insert" on public.business_documents
  for insert with check (auth.uid() = profile_id);

create policy "documents admin update" on public.business_documents
  for update using (public.is_admin()) with check (public.is_admin());

create policy "supplier profile owner select" on public.supplier_profiles
  for select using (auth.uid() = profile_id or public.is_admin());

create policy "supplier profile owner insert" on public.supplier_profiles
  for insert with check (auth.uid() = profile_id);

create policy "supplier profile admin all" on public.supplier_profiles
  for all using (public.is_admin()) with check (public.is_admin());

create policy "route seller profile owner select" on public.route_seller_profiles
  for select using (auth.uid() = profile_id or public.is_admin());

create policy "route seller profile owner insert" on public.route_seller_profiles
  for insert with check (auth.uid() = profile_id);

create policy "route seller profile admin all" on public.route_seller_profiles
  for all using (public.is_admin()) with check (public.is_admin());

create policy "product uploads supplier insert" on public.product_uploads
  for insert with check (public.owns_supplier_profile(supplier_profile_id));

create policy "product uploads supplier select" on public.product_uploads
  for select using (public.owns_supplier_profile(supplier_profile_id) or public.is_admin());

create policy "product uploads admin update" on public.product_uploads
  for update using (public.is_admin()) with check (public.is_admin());

create policy "approved products visible" on public.products
  for select using (status = 'approved');

create policy "supplier products visible to owner" on public.products
  for select using (public.owns_supplier_profile(supplier_profile_id));

create policy "supplier inserts pending products" on public.products
  for insert with check (public.owns_supplier_profile(supplier_profile_id) and status = 'pending');

create policy "supplier updates inventory only gate" on public.products
  for update using (public.owns_supplier_profile(supplier_profile_id)) with check (public.owns_supplier_profile(supplier_profile_id));

create policy "admin manages products" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

create policy "buyers manage own saved lists" on public.saved_lists
  for all using (auth.uid() = buyer_profile_id);

create policy "buyers manage own order requests" on public.order_requests
  for all using (auth.uid() = buyer_profile_id);

create policy "buyers view own order items" on public.order_request_items
  for select using (
    exists (
      select 1 from public.order_requests
      where order_requests.id = order_request_items.order_request_id
      and order_requests.buyer_profile_id = auth.uid()
    )
  );

create policy "buyers add own order items" on public.order_request_items
  for insert with check (
    exists (
      select 1 from public.order_requests
      where order_requests.id = order_request_items.order_request_id
      and order_requests.buyer_profile_id = auth.uid()
    )
  );

create policy "admin views order items" on public.order_request_items
  for select using (public.is_admin());

create policy "admin manages orders" on public.order_requests
  for all using (public.is_admin()) with check (public.is_admin());

create policy "admin manages quote adjustments" on public.quote_adjustments
  for all using (public.is_admin()) with check (public.is_admin());

create policy "admin manages pricing settings" on public.pricing_settings
  for all using (public.is_admin()) with check (public.is_admin());

create policy "authenticated users read pricing settings" on public.pricing_settings
  for select using (auth.role() = 'authenticated');

create policy "supplier submits promotions" on public.promotion_submissions
  for insert with check (public.owns_supplier_profile(supplier_profile_id));

create policy "supplier views promotions" on public.promotion_submissions
  for select using (public.owns_supplier_profile(supplier_profile_id) or public.is_admin());

create policy "admin manages marketing campaigns" on public.marketing_campaigns
  for all using (public.is_admin()) with check (public.is_admin());

create policy "admin updates promotions" on public.promotion_submissions
  for update using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public)
values
  ('business-documents', 'business-documents', false),
  ('product-uploads', 'product-uploads', false)
on conflict (id) do nothing;

create policy "users upload own business documents" on storage.objects
  for insert with check (
    bucket_id = 'business-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "users read own business documents" on storage.objects
  for select using (
    bucket_id = 'business-documents'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

create policy "suppliers upload product sheets" on storage.objects
  for insert with check (
    bucket_id = 'product-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "suppliers read product sheets" on storage.objects
  for select using (
    bucket_id = 'product-uploads'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );
