# XperaOne — Digital Marketplace

A production-ready Next.js 14 (App Router, TypeScript) digital marketplace with Supabase
(Postgres + Auth + Storage + RLS): storefront, cart, checkout, manual payment verification,
secure digital downloads, invoices, order tracking, a customer account panel, a full admin
dashboard, and a drag-free Page Builder with a sanitized Custom HTML/CSS section.

No mock data paths, no fake JSON — every page reads/writes real Supabase tables, and every
sensitive operation (pricing, order numbers, payment approval, download links) happens
server-side with the service-role client, gated by an explicit role/ownership check.

## 1. Prerequisites

- Node.js 18.18+ (20 LTS recommended)
- A Supabase project (free tier is fine to start): https://supabase.com/dashboard

## 2. Set up Supabase

1. Create a new Supabase project.
2. In the SQL editor, run these three files **in order**:
   - `supabase/schema.sql`
   - `supabase/rls.sql`
   - `supabase/storage.sql`
3. In Project Settings → API, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY` (server-only — never expose this)

## 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the Supabase values above, plus (optional but recommended) a
[Resend](https://resend.com) API key for transactional email — the app runs fine without
it, it just logs a warning and skips sending.

## 4. Install & run

```bash
npm install
npm run seed   # creates an admin user + sample categories/products/payment settings
npm run dev
```

The seed script prints the admin login it created (default `admin@xperaone.example` /
`ChangeMe123!` unless you set `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env.local`
first). **Log in and change that password immediately** — go to `/admin` after logging in.

Visit `http://localhost:3000`.

## 5. What's already wired up

- **Storefront**: DB-driven home page (falls back to a live default layout until you
  publish something in the Page Builder), shop with search/filter/sort, categories,
  product pages, cart with server-revalidated pricing.
- **Checkout → Payment → Proof → Verification**: order numbers are generated atomically in
  Postgres (`XP-2026-000001` style), prices are re-read from the database at order-creation
  time (never trusted from the browser), payment proof uploads go to a **private** Storage
  bucket, and admin approve/reject drives invoice generation + download unlocking +
  transactional email — see `lib/payments/actions.ts` for the full chain.
- **Secure downloads**: `lib/downloads/actions.ts` re-checks ownership + payment-verified
  status on every click and issues a 2-minute signed URL — nothing is ever public.
- **Admin dashboard**: products, categories, customers, orders, payment verification queue,
  invoices, downloads, What's New, header/footer, payment/email/website settings.
- **Page Builder**: `/admin/pages/home/builder` — add/edit/duplicate/delete/reorder/enable
  sections, edit Custom HTML/CSS with a responsive desktop/tablet/mobile preview, Save
  Draft vs. Publish (draft edits never touch the live site until you click Publish).
- **RLS**: every customer-sensitive table is locked down in `supabase/rls.sql` — a customer
  can only ever see their own orders/payments/invoices/downloads; admins are gated by a
  `profiles.role = 'admin'` check, verified both in Postgres policies and again in every
  admin server action (`lib/auth/roles.ts` → `requireAdmin()`).

## 6. Wiring in real invoice PDFs (optional)

`lib/invoices/actions.ts` creates the structured `invoices` row on payment approval but
leaves PDF rendering as a plug-in point — the invoice is already fully viewable from
structured data in `/account/invoices` and `/admin/invoices`. To generate an actual PDF,
render one (e.g. with `@react-pdf/renderer` or a headless-Chromium service) inside
`generateInvoiceForOrder` and upload it to the private `invoices` bucket, then store the
path in `pdf_path`.

## 7. Deploying

Any Next.js host works (Vercel is the path of least resistance). Set the same environment
variables from `.env.local` in your host's dashboard — **never** commit `.env.local`, and
never expose `SUPABASE_SERVICE_ROLE_KEY` to the client bundle (the `server-only` import in
`lib/supabase/admin.ts` will fail the build if you ever try to import it from a `"use
client"` file).

## 8. Project structure

See `app/`, `components/`, `lib/`, `supabase/` — organized by the same modular boundaries
called out in the spec: UI in `components/` and `app/`, business logic in `lib/<domain>/`,
sanitization in `lib/sanitize/`, email in `lib/email/`.
