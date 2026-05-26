create extension if not exists pgcrypto;

create table if not exists public.seller_applications (
  id text primary key,
  type text not null check (type in ('venue', 'maker')),
  business_name text not null,
  contact_email text not null,
  licence text not null,
  region text not null,
  status text not null default 'received',
  created_at timestamptz not null default now()
);

create table if not exists public.venues (
  id text primary key,
  type text not null check (type in ('store', 'bar', 'maker')),
  name text not null,
  chain text,
  address text not null,
  suburb text not null,
  city text not null,
  region text not null,
  lat double precision not null,
  lng double precision not null,
  phone text,
  website text,
  source text not null default 'manual',
  checked_at date not null default current_date,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.listings (
  id text primary key,
  venue_id text references public.venues(id) on delete set null,
  type text not null check (type in ('store', 'bar', 'maker')),
  venue text not null,
  product text not null,
  style text not null check (style in ('lager', 'ipa', 'pale ale', 'stout', 'cider', 'wine', 'spirits', 'mixed')),
  price numeric(10, 2) not null check (price >= 0),
  unit text not null,
  lat double precision not null,
  lng double precision not null,
  suburb text not null,
  region text not null,
  open_tonight boolean not null default true,
  special text not null default '',
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.listings
  add column if not exists venue_id text references public.venues(id) on delete set null;

create index if not exists listings_region_type_idx on public.listings (region, type);
create index if not exists listings_created_at_idx on public.listings (created_at desc);
create index if not exists seller_applications_created_at_idx on public.seller_applications (created_at desc);
create index if not exists venues_region_type_idx on public.venues (region, type);
create index if not exists venues_lat_lng_idx on public.venues (lat, lng);

alter table public.seller_applications enable row level security;
alter table public.listings enable row level security;
alter table public.venues enable row level security;

drop policy if exists "public can read listings" on public.listings;
create policy "public can read listings"
  on public.listings for select
  using (true);

drop policy if exists "public can read venues" on public.venues;
create policy "public can read venues"
  on public.venues for select
  using (true);

-- Writes go through the Next.js API using SUPABASE_SERVICE_ROLE_KEY.
-- Do not expose the service role key in client-side code.
