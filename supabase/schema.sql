-- ============================================================
-- XperaOne — Core Schema
-- Run this in the Supabase SQL editor (or via `supabase db push`)
-- after connecting your project. Run rls.sql and storage.sql after.
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------
create type user_role as enum ('customer', 'admin');

create type order_status as enum (
  'pending',
  'payment_verification',
  'payment_verified',
  'completed',
  'rejected',
  'cancelled'
);

create type payment_status as enum (
  'pending',
  'verification_pending',
  'verified',
  'rejected'
);

create type download_status as enum ('locked', 'unlocked');

create type product_status as enum ('draft', 'published', 'archived');

create type page_status as enum ('draft', 'published');

create type whats_new_type as enum ('announcement', 'news', 'product_release', 'update', 'offer');
create type whats_new_status as enum ('draft', 'published');

-- ------------------------------------------------------------
-- PROFILES  (extends auth.users)
-- ------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  phone text,
  role user_role not null default 'customer',
  is_disabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_profiles_email on profiles(email);
create index idx_profiles_role on profiles(role);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'customer'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ------------------------------------------------------------
-- CATEGORIES
-- ------------------------------------------------------------
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  parent_id uuid references categories(id) on delete set null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_categories_slug on categories(slug);

-- ------------------------------------------------------------
-- PRODUCTS
-- ------------------------------------------------------------
create table products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  short_description text,
  description text,
  price numeric(12,2) not null check (price >= 0),
  sale_price numeric(12,2) check (sale_price is null or sale_price >= 0),
  category_id uuid references categories(id) on delete set null,
  features jsonb not null default '[]'::jsonb,   -- string[]
  license text,
  is_new boolean not null default false,
  is_featured boolean not null default false,
  status product_status not null default 'draft',
  digital_file_path text,           -- path inside the private `product-files` bucket
  digital_file_name text,
  digital_file_size bigint,
  seo_title text,
  seo_description text,
  og_image_url text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_products_slug on products(slug);
create index idx_products_status on products(status);
create index idx_products_category on products(category_id);

create table product_images (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  alt text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index idx_product_images_product on product_images(product_id);

-- ------------------------------------------------------------
-- CARTS  (one active cart per authenticated user; guest carts keyed by session_id)
-- ------------------------------------------------------------
create table carts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  session_id text,                 -- for guest carts, stored in an httpOnly cookie
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carts_owner_check check (user_id is not null or session_id is not null)
);
create unique index idx_carts_user on carts(user_id) where user_id is not null;
create unique index idx_carts_session on carts(session_id) where session_id is not null;

create table cart_items (
  id uuid primary key default uuid_generate_v4(),
  cart_id uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (cart_id, product_id)
);

-- ------------------------------------------------------------
-- ORDERS
-- ------------------------------------------------------------
create table orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text not null unique,     -- e.g. XP-2026-000001, never expose id
  user_id uuid not null references profiles(id) on delete restrict,
  status order_status not null default 'pending',
  full_name text not null,
  email text not null,
  phone text,
  country text,
  billing_address jsonb,
  subtotal numeric(12,2) not null,
  total numeric(12,2) not null,
  currency text not null default 'USD',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_orders_number on orders(order_number);
create index idx_orders_user on orders(user_id);
create index idx_orders_status on orders(status);
create index idx_orders_created on orders(created_at);

-- server-side sequence backing human-readable order numbers, e.g. XP-2026-000001
create sequence if not exists order_number_seq;

create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  product_name text not null,      -- snapshot at time of purchase
  unit_price numeric(12,2) not null,   -- snapshot, server-validated at checkout
  quantity integer not null check (quantity > 0),
  line_total numeric(12,2) not null,
  created_at timestamptz not null default now()
);
create index idx_order_items_order on order_items(order_id);
create index idx_order_items_product on order_items(product_id);

-- ------------------------------------------------------------
-- PAYMENTS + PROOFS
-- ------------------------------------------------------------
create table payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  status payment_status not null default 'pending',
  method text,
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  rejection_reason text,
  verified_by uuid references profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_payments_order on payments(order_id);
create index idx_payments_status on payments(status);

create table payment_proofs (
  id uuid primary key default uuid_generate_v4(),
  payment_id uuid not null references payments(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  transaction_id text,
  payment_reference text,
  payment_method text,
  payment_date date,
  amount numeric(12,2),
  screenshot_path text not null,   -- path inside private `payment-proofs` bucket
  submitted_at timestamptz not null default now()
);
create index idx_payment_proofs_order on payment_proofs(order_id);

-- ------------------------------------------------------------
-- ORDER STATUS HISTORY
-- ------------------------------------------------------------
create table order_status_history (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  status text not null,
  message text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index idx_status_history_order on order_status_history(order_id);

-- ------------------------------------------------------------
-- DOWNLOAD PERMISSIONS
-- ------------------------------------------------------------
create table download_permissions (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  order_item_id uuid not null references order_items(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  status download_status not null default 'locked',
  granted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (order_item_id)
);
create index idx_download_permissions_user on download_permissions(user_id);
create index idx_download_permissions_order on download_permissions(order_id);

-- ------------------------------------------------------------
-- INVOICES
-- ------------------------------------------------------------
create table invoices (
  id uuid primary key default uuid_generate_v4(),
  invoice_number text not null unique,   -- e.g. INV-2026-000001
  order_id uuid not null references orders(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  subtotal numeric(12,2) not null,
  total numeric(12,2) not null,
  currency text not null default 'USD',
  payment_status payment_status not null,
  pdf_path text,        -- path inside private `invoices` bucket, generated on approval
  issued_at timestamptz not null default now()
);
create index idx_invoices_order on invoices(order_id);
create index idx_invoices_user on invoices(user_id);
create sequence if not exists invoice_number_seq;

-- ------------------------------------------------------------
-- WHAT'S NEW
-- ------------------------------------------------------------
create table whats_new (
  id uuid primary key default uuid_generate_v4(),
  type whats_new_type not null default 'announcement',
  title text not null,
  slug text not null unique,
  content text not null,
  image_url text,
  status whats_new_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_whats_new_slug on whats_new(slug);
create index idx_whats_new_status on whats_new(status);

-- ------------------------------------------------------------
-- PAGE BUILDER  (pages + ordered sections, draft vs published content)
-- ------------------------------------------------------------
create table pages (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,          -- e.g. 'home'
  title text not null,
  status page_status not null default 'draft',
  seo_title text,
  seo_description text,
  og_image_url text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_pages_slug on pages(slug);

create table page_sections (
  id uuid primary key default uuid_generate_v4(),
  page_id uuid not null references pages(id) on delete cascade,
  type text not null,             -- hero | heading | text | image | button | product_grid |
                                   -- featured_products | categories | banner | cta |
                                   -- newsletter | faq | custom_html
  is_draft_version boolean not null default true,   -- true = draft copy, false = published copy
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  config jsonb not null default '{}'::jsonb,   -- section-specific fields
  custom_html text,
  custom_css text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_page_sections_page on page_sections(page_id, is_draft_version, sort_order);

-- ------------------------------------------------------------
-- SITE-WIDE SETTINGS (singleton rows, admin-editable)
-- ------------------------------------------------------------
create table website_settings (
  id integer primary key default 1,
  logo_url text,
  logo_url_dark text,
  announcement_text text,
  announcement_enabled boolean not null default false,
  header_nav jsonb not null default '[]'::jsonb,
  footer jsonb not null default '{}'::jsonb,   -- description, links, support, legal, social, copyright
  updated_at timestamptz not null default now(),
  constraint website_settings_singleton check (id = 1)
);

create table payment_settings (
  id integer primary key default 1,
  method_name text not null default 'Bank Transfer',
  account_name text,
  account_number text,
  bank_details text,
  instructions text,
  currency text not null default 'USD',
  allow_resubmission boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint payment_settings_singleton check (id = 1)
);

create table email_settings (
  id integer primary key default 1,
  provider text not null default 'resend',   -- resend | smtp
  from_name text not null default 'XperaOne',
  from_email text,
  smtp_host text,
  smtp_port integer,
  smtp_username text,
  -- secrets (SMTP password / API keys) are NEVER stored here — they live only
  -- in server environment variables and are referenced, not persisted, by name.
  updated_at timestamptz not null default now(),
  constraint email_settings_singleton check (id = 1)
);

insert into website_settings (id) values (1) on conflict (id) do nothing;
insert into payment_settings (id) values (1) on conflict (id) do nothing;
insert into email_settings (id) values (1) on conflict (id) do nothing;

-- ------------------------------------------------------------
-- updated_at trigger helper
-- ------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','categories','products','carts','orders','payments',
    'invoices','whats_new','pages','page_sections',
    'website_settings','payment_settings','email_settings'
  ] loop
    execute format(
      'create trigger set_updated_at before update on %I for each row execute procedure set_updated_at()', t
    );
  end loop;
end $$;

-- ------------------------------------------------------------
-- Order number / invoice number generators (called from server actions)
-- ------------------------------------------------------------
create or replace function generate_order_number()
returns text as $$
declare
  next_val bigint;
  yr text := to_char(now(), 'YYYY');
begin
  next_val := nextval('order_number_seq');
  return 'XP-' || yr || '-' || lpad(next_val::text, 6, '0');
end;
$$ language plpgsql;

create or replace function generate_invoice_number()
returns text as $$
declare
  next_val bigint;
  yr text := to_char(now(), 'YYYY');
begin
  next_val := nextval('invoice_number_seq');
  return 'INV-' || yr || '-' || lpad(next_val::text, 6, '0');
end;
$$ language plpgsql;
