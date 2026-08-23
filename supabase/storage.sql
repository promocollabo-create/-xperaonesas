-- ============================================================
-- XperaOne — Storage Buckets & Policies
-- Run after schema.sql and rls.sql.
-- ============================================================

-- Public bucket for marketing imagery (product photos, category images,
-- page-builder images, logos). Nothing sensitive lives here.
insert into storage.buckets (id, name, public)
values ('public-media', 'public-media', true)
on conflict (id) do nothing;

-- PRIVATE buckets — never public. All access goes through short-lived
-- signed URLs generated server-side after an authorization check.
insert into storage.buckets (id, name, public)
values
  ('product-files', 'product-files', false),
  ('payment-proofs', 'payment-proofs', false),
  ('invoices', 'invoices', false)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- public-media: anyone can read, only admins can write
-- ------------------------------------------------------------
create policy "public_media_read"
  on storage.objects for select
  using (bucket_id = 'public-media');

create policy "public_media_admin_write"
  on storage.objects for insert
  with check (bucket_id = 'public-media' and is_admin());

create policy "public_media_admin_update"
  on storage.objects for update
  using (bucket_id = 'public-media' and is_admin());

create policy "public_media_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'public-media' and is_admin());

-- ------------------------------------------------------------
-- product-files: PRIVATE. No direct client access at all — every
-- download is issued as a short-lived signed URL from a server action
-- that has already verified ownership + payment_verified status
-- (see lib/downloads/actions.ts). Only admins may write.
-- ------------------------------------------------------------
create policy "product_files_admin_write"
  on storage.objects for insert
  with check (bucket_id = 'product-files' and is_admin());

create policy "product_files_admin_manage"
  on storage.objects for all
  using (bucket_id = 'product-files' and is_admin());

-- (No select policy for non-admins — object is unreachable except via
-- the service-role-signed URL path, which bypasses RLS by design.)

-- ------------------------------------------------------------
-- payment-proofs: PRIVATE. Customers upload their own proof through a
-- server action (service role); admins read for verification.
-- ------------------------------------------------------------
create policy "payment_proofs_admin_read"
  on storage.objects for select
  using (bucket_id = 'payment-proofs' and is_admin());

create policy "payment_proofs_admin_manage"
  on storage.objects for all
  using (bucket_id = 'payment-proofs' and is_admin());

-- ------------------------------------------------------------
-- invoices: PRIVATE. Generated server-side on payment approval.
-- Customers get a signed URL via a server action that checks
-- invoices.user_id = auth.uid(); admins can read all.
-- ------------------------------------------------------------
create policy "invoices_admin_manage"
  on storage.objects for all
  using (bucket_id = 'invoices' and is_admin());
