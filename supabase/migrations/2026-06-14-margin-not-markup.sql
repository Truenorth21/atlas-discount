-- Run this in the Supabase SQL editor.
-- US distribution is managed by MARGINS, not markups. This renames the
-- markup columns to margin columns on pricing_settings and quote_adjustments,
-- and resets the global defaults to sensible target margins. The app now
-- prices any product without an explicit tier price to earn these margins
-- (sell = cost / (1 - margin)); explicit per-product prices still win.
--
-- Safe to run more than once.

-- 1. pricing_settings: rename case/pallet markup -> margin (or add if missing).
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'pricing_settings'
               and column_name = 'case_markup_percent') then
    alter table public.pricing_settings rename column case_markup_percent to case_margin_percent;
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'pricing_settings'
                   and column_name = 'case_margin_percent') then
    alter table public.pricing_settings add column case_margin_percent numeric(8, 2) not null default 25;
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'pricing_settings'
               and column_name = 'pallet_markup_percent') then
    alter table public.pricing_settings rename column pallet_markup_percent to pallet_margin_percent;
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'pricing_settings'
                   and column_name = 'pallet_margin_percent') then
    alter table public.pricing_settings add column pallet_margin_percent numeric(8, 2) not null default 18;
  end if;
end $$;

-- 2. Fresh defaults + reset the stale markup values (24/12) to real margins.
alter table public.pricing_settings alter column case_margin_percent set default 25;
alter table public.pricing_settings alter column pallet_margin_percent set default 18;
update public.pricing_settings set case_margin_percent = 25, pallet_margin_percent = 18 where id = true;

-- 3. quote_adjustments: same rename (nullable per-order overrides, no default).
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'quote_adjustments'
               and column_name = 'case_markup_percent') then
    alter table public.quote_adjustments rename column case_markup_percent to case_margin_percent;
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'quote_adjustments'
                   and column_name = 'case_margin_percent') then
    alter table public.quote_adjustments add column case_margin_percent numeric(8, 2);
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'quote_adjustments'
               and column_name = 'pallet_markup_percent') then
    alter table public.quote_adjustments rename column pallet_markup_percent to pallet_margin_percent;
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'quote_adjustments'
                   and column_name = 'pallet_margin_percent') then
    alter table public.quote_adjustments add column pallet_margin_percent numeric(8, 2);
  end if;
end $$;
