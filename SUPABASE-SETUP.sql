-- iBAGENCY live catalogue setup
-- Run this entire file in Supabase SQL Editor for project jkwhnahxkmqzplgvpbre.
-- Then create an owner login in Authentication > Users and follow the bootstrap instructions below.

create extension if not exists pgcrypto;

create table if not exists public.ibagency_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.ibagency_products (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 160),
  category text not null check (category in ('Land','House / Property','Car / Vehicle','Commercial Property','Gold / Precious Metals','Other')),
  description text not null default '' check (char_length(description) <= 5000),
  price numeric(14,2),
  currency text not null default 'UGX' check (currency in ('UGX','NGN','KES','USD','GBP','EUR','Other')),
  location text not null default '' check (char_length(location) <= 200),
  image_urls text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published','sold','unavailable')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ibagency_products_status_created_idx
  on public.ibagency_products(status, created_at desc);

create or replace function public.ibagency_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.ibagency_admins a where a.user_id = auth.uid()
  );
$$;

revoke all on function public.ibagency_is_admin() from public;
grant execute on function public.ibagency_is_admin() to authenticated;

alter table public.ibagency_admins enable row level security;
alter table public.ibagency_products enable row level security;

drop policy if exists "Admin can view own admin row" on public.ibagency_admins;
create policy "Admin can view own admin row"
  on public.ibagency_admins for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Public can view published products" on public.ibagency_products;
create policy "Public can view published products"
  on public.ibagency_products for select to anon, authenticated
  using (status = 'published');

drop policy if exists "Admin can view all products" on public.ibagency_products;
create policy "Admin can view all products"
  on public.ibagency_products for select to authenticated
  using (public.ibagency_is_admin());

drop policy if exists "Admin can insert products" on public.ibagency_products;
create policy "Admin can insert products"
  on public.ibagency_products for insert to authenticated
  with check (public.ibagency_is_admin() and created_by = auth.uid());

drop policy if exists "Admin can update products" on public.ibagency_products;
create policy "Admin can update products"
  on public.ibagency_products for update to authenticated
  using (public.ibagency_is_admin())
  with check (public.ibagency_is_admin());

drop policy if exists "Admin can delete products" on public.ibagency_products;
create policy "Admin can delete products"
  on public.ibagency_products for delete to authenticated
  using (public.ibagency_is_admin());

-- Public product photos bucket. Visitors can view images; only an approved admin can upload/edit/delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ibagency-products', 'ibagency-products', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "Anyone can view iBAGENCY product photos" on storage.objects;
create policy "Anyone can view iBAGENCY product photos"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'ibagency-products');

drop policy if exists "Admins can upload iBAGENCY product photos" on storage.objects;
create policy "Admins can upload iBAGENCY product photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'ibagency-products' and public.ibagency_is_admin());

drop policy if exists "Admins can update iBAGENCY product photos" on storage.objects;
create policy "Admins can update iBAGENCY product photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'ibagency-products' and public.ibagency_is_admin())
  with check (bucket_id = 'ibagency-products' and public.ibagency_is_admin());

drop policy if exists "Admins can delete iBAGENCY product photos" on storage.objects;
create policy "Admins can delete iBAGENCY product photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'ibagency-products' and public.ibagency_is_admin());

-- Explicit API grants; row-level security policies above still control which rows/actions are allowed.
grant select on public.ibagency_admins to authenticated;
grant select on public.ibagency_products to anon, authenticated;
grant insert, update, delete on public.ibagency_products to authenticated;

-- OWNER BOOTSTRAP:
-- 1. In Supabase Dashboard > Authentication > Users, create the owner's user with email/password.
-- 2. Copy that user's UUID.
-- 3. Run this separately after replacing the placeholder:
-- insert into public.ibagency_admins (user_id) values ('PASTE_OWNER_AUTH_USER_UUID_HERE');
-- Never add this admin row from the public website.


-- Full property-platform upgrade (safe to run again on the existing project).
alter table public.ibagency_products
  add column if not exists listing_type text not null default 'For Sale'
  check (listing_type in ('For Sale','For Rent','For Lease','Sale or Rent'));

create table if not exists public.ibagency_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  phone text not null check (char_length(phone) between 3 and 50),
  category text not null check (char_length(category) between 1 and 120),
  location text not null default '' check (char_length(location) <= 160),
  budget text not null default '' check (char_length(budget) <= 100),
  details text not null default '' check (char_length(details) <= 1500),
  status text not null default 'new' check (status in ('new','contacted','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ibagency_inquiries_status_created_idx
  on public.ibagency_inquiries(status, created_at desc);
alter table public.ibagency_inquiries enable row level security;

drop policy if exists "Public can submit iBAGENCY inquiries" on public.ibagency_inquiries;
create policy "Public can submit iBAGENCY inquiries"
  on public.ibagency_inquiries for insert to anon, authenticated
  with check (
    char_length(name) between 1 and 100 and
    char_length(phone) between 3 and 50 and
    char_length(category) between 1 and 120
  );
drop policy if exists "Admins can view iBAGENCY inquiries" on public.ibagency_inquiries;
create policy "Admins can view iBAGENCY inquiries"
  on public.ibagency_inquiries for select to authenticated
  using (public.ibagency_is_admin());
drop policy if exists "Admins can update iBAGENCY inquiries" on public.ibagency_inquiries;
create policy "Admins can update iBAGENCY inquiries"
  on public.ibagency_inquiries for update to authenticated
  using (public.ibagency_is_admin())
  with check (public.ibagency_is_admin());
drop policy if exists "Admins can delete iBAGENCY inquiries" on public.ibagency_inquiries;
create policy "Admins can delete iBAGENCY inquiries"
  on public.ibagency_inquiries for delete to authenticated
  using (public.ibagency_is_admin());
grant insert on public.ibagency_inquiries to anon, authenticated;
grant select, update, delete on public.ibagency_inquiries to authenticated;

-- OPTIONAL ONE-STEP OWNER BOOTSTRAP
-- If the owner Auth account uses a different email, change the value below.
-- This runs safely if the owner is already listed.
do $$
declare
  owner_user_id uuid;
  owner_email text := 'ibagency@gmail.com';
begin
  select id into owner_user_id
  from auth.users
  where lower(email) = lower(owner_email)
  order by created_at asc
  limit 1;

  if owner_user_id is null then
    raise notice 'Owner Auth user % was not found. Change owner_email here or run OWNER-BOOTSTRAP.sql after creating the owner account.', owner_email;
  else
    insert into public.ibagency_admins (user_id)
    values (owner_user_id)
    on conflict (user_id) do nothing;
    raise notice 'iBAGENCY owner dashboard access is enabled for %.', owner_email;
  end if;
end
$$;
