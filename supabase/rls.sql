-- ============================================================
-- XperaOne — Row Level Security
-- Run after schema.sql. Every customer-sensitive table gets RLS.
-- Server actions/route handlers use the SERVICE ROLE key for
-- privileged writes (e.g. approving payments) and therefore bypass
-- RLS by design — but they re-check role/ownership in code before
-- doing so (see lib/auth/roles.ts). RLS is the last line of defense
-- for any request that reaches Postgres with a user's own JWT.
-- ============================================================

-- Helper: is the current JWT holder an admin?
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin' and is_disabled = false
  );
$$ language sql security definer stable;

-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------
alter table profiles enable row level security;

create policy "profiles_select_own_or_admin"
  on profiles for select
  using (id = auth.uid() or is_admin());

create policy "profiles_update_own"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- role escalation must never happen through this policy; role changes
-- are only performed server-side with the service role key.
create policy "profiles_admin_update_any"
  on profiles for update
  using (is_admin());

-- ------------------------------------------------------------
-- CATEGORIES / PRODUCTS / PRODUCT_IMAGES  (public read of published, admin write)
-- ------------------------------------------------------------
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;

create policy "categories_public_read" on categories for select using (is_active = true or is_admin());
create policy "categories_admin_write" on categories for insert with check (is_admin());
create policy "categories_admin_update" on categories for update using (is_admin());
create policy "categories_admin_delete" on categories for delete using (is_admin());

create policy "products_public_read_published" on products
  for select using (status = 'published' or is_admin());
create policy "products_admin_write" on products for insert with check (is_admin());
create policy "products_admin_update" on products for update using (is_admin());
create policy "products_admin_delete" on products for delete using (is_admin());

create policy "product_images_public_read" on product_images
  for select using (
    exists (select 1 from products p where p.id = product_id and (p.status = 'published' or is_admin()))
  );
create policy "product_images_admin_write" on product_images for insert with check (is_admin());
create policy "product_images_admin_update" on product_images for update using (is_admin());
create policy "product_images_admin_delete" on product_images for delete using (is_admin());

-- ------------------------------------------------------------
-- CARTS / CART_ITEMS  (owner only — guest carts are handled server-side
-- via the service role since there is no auth.uid() for a guest)
-- ------------------------------------------------------------
alter table carts enable row level security;
alter table cart_items enable row level security;

create policy "carts_owner_all" on carts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "cart_items_owner_all" on cart_items
  for all using (
    exists (select 1 from carts c where c.id = cart_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from carts c where c.id = cart_id and c.user_id = auth.uid())
  );

-- ------------------------------------------------------------
-- ORDERS / ORDER_ITEMS
-- ------------------------------------------------------------
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "orders_select_own_or_admin" on orders
  for select using (user_id = auth.uid() or is_admin());

-- Orders are created and mutated exclusively via server actions using the
-- service role key (price/order-number integrity must never depend on the
-- client). No direct insert/update policy is granted to authenticated users.
create policy "orders_admin_all" on orders for all using (is_admin()) with check (is_admin());

create policy "order_items_select_own_or_admin" on order_items
  for select using (
    exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or is_admin()))
  );
create policy "order_items_admin_all" on order_items for all using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- PAYMENTS / PAYMENT_PROOFS
-- ------------------------------------------------------------
alter table payments enable row level security;
alter table payment_proofs enable row level security;

create policy "payments_select_own_or_admin" on payments
  for select using (
    exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or is_admin()))
  );
create policy "payments_admin_all" on payments for all using (is_admin()) with check (is_admin());

create policy "payment_proofs_select_own_or_admin" on payment_proofs
  for select using (
    exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or is_admin()))
  );
-- Customers submit proof through a server action (service role) so the
-- row is always linked correctly and the file is validated server-side.
create policy "payment_proofs_admin_all" on payment_proofs for all using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- ORDER STATUS HISTORY  (read-only to the owning customer; admin writes)
-- ------------------------------------------------------------
alter table order_status_history enable row level security;

create policy "status_history_select_own_or_admin" on order_status_history
  for select using (
    exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or is_admin()))
  );
create policy "status_history_admin_write" on order_status_history for insert with check (is_admin());

-- ------------------------------------------------------------
-- DOWNLOAD PERMISSIONS
-- ------------------------------------------------------------
alter table download_permissions enable row level security;

create policy "downloads_select_own_or_admin" on download_permissions
  for select using (user_id = auth.uid() or is_admin());
create policy "downloads_admin_write" on download_permissions for all using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- INVOICES
-- ------------------------------------------------------------
alter table invoices enable row level security;

create policy "invoices_select_own_or_admin" on invoices
  for select using (user_id = auth.uid() or is_admin());
create policy "invoices_admin_write" on invoices for all using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- WHAT'S NEW  (public read of published, admin write)
-- ------------------------------------------------------------
alter table whats_new enable row level security;

create policy "whats_new_public_read" on whats_new
  for select using (status = 'published' or is_admin());
create policy "whats_new_admin_write" on whats_new for all using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- PAGES / PAGE_SECTIONS  (public read of published only, admin manages drafts)
-- ------------------------------------------------------------
alter table pages enable row level security;
alter table page_sections enable row level security;

create policy "pages_public_read_published" on pages
  for select using (status = 'published' or is_admin());
create policy "pages_admin_write" on pages for all using (is_admin()) with check (is_admin());

create policy "page_sections_public_read_published" on page_sections
  for select using (
    is_draft_version = false
    and exists (select 1 from pages p where p.id = page_id and p.status = 'published')
    or is_admin()
  );
create policy "page_sections_admin_write" on page_sections for all using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- SETTINGS  (public read where needed for storefront rendering, admin write)
-- ------------------------------------------------------------
alter table website_settings enable row level security;
alter table payment_settings enable row level security;
alter table email_settings enable row level security;

create policy "website_settings_public_read" on website_settings for select using (true);
create policy "website_settings_admin_write" on website_settings for update using (is_admin());

-- payment instructions are only shown to the customer mid-checkout via a
-- server action, not queried directly by anonymous clients.
create policy "payment_settings_authenticated_read" on payment_settings
  for select using (auth.role() = 'authenticated');
create policy "payment_settings_admin_write" on payment_settings for update using (is_admin());

create policy "email_settings_admin_only" on email_settings for select using (is_admin());
create policy "email_settings_admin_write" on email_settings for update using (is_admin());
