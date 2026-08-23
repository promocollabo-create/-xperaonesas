// Hand-written types mirroring supabase/schema.sql.
// Once the project is connected, regenerate/refine with:
//   npx supabase gen types typescript --project-id <id> > types/database.ts
// and re-apply the domain helper types below.

export type UserRole = "customer" | "admin";
export type OrderStatus =
  | "pending"
  | "payment_verification"
  | "payment_verified"
  | "completed"
  | "rejected"
  | "cancelled";
export type PaymentStatus = "pending" | "verification_pending" | "verified" | "rejected";
export type DownloadStatus = "locked" | "unlocked";
export type ProductStatus = "draft" | "published" | "archived";
export type PageStatus = "draft" | "published";
export type WhatsNewType = "announcement" | "news" | "product_release" | "update" | "offer";
export type WhatsNewStatus = "draft" | "published";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  role: UserRole;
  is_disabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  price: number;
  sale_price: number | null;
  category_id: string | null;
  features: string[];
  license: string | null;
  is_new: boolean;
  is_featured: boolean;
  status: ProductStatus;
  digital_file_path: string | null;
  digital_file_name: string | null;
  digital_file_size: number | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt: string | null;
  sort_order: number;
  created_at: string;
}

export interface ProductWithImages extends Product {
  product_images: ProductImage[];
  category?: Category | null;
}

export interface Cart {
  id: string;
  user_id: string | null;
  session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
}

export interface CartItemWithProduct extends CartItem {
  product: Product;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  full_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  billing_address: Record<string, unknown> | null;
  subtotal: number;
  total: number;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  status: PaymentStatus;
  method: string | null;
  amount: number;
  currency: string;
  rejection_reason: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentProof {
  id: string;
  payment_id: string;
  order_id: string;
  transaction_id: string | null;
  payment_reference: string | null;
  payment_method: string | null;
  payment_date: string | null;
  amount: number | null;
  screenshot_path: string;
  submitted_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: string;
  message: string | null;
  created_by: string | null;
  created_at: string;
}

export interface DownloadPermission {
  id: string;
  order_id: string;
  order_item_id: string;
  user_id: string;
  product_id: string;
  status: DownloadStatus;
  granted_at: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  user_id: string;
  subtotal: number;
  total: number;
  currency: string;
  payment_status: PaymentStatus;
  pdf_path: string | null;
  issued_at: string;
}

export interface WhatsNewItem {
  id: string;
  type: WhatsNewType;
  title: string;
  slug: string;
  content: string;
  image_url: string | null;
  status: WhatsNewStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  status: PageStatus;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export type PageSectionType =
  | "hero"
  | "heading"
  | "text"
  | "image"
  | "button"
  | "product_grid"
  | "featured_products"
  | "categories"
  | "banner"
  | "cta"
  | "newsletter"
  | "faq"
  | "custom_html";

export interface PageSection {
  id: string;
  page_id: string;
  type: PageSectionType;
  is_draft_version: boolean;
  is_enabled: boolean;
  sort_order: number;
  config: Record<string, unknown>;
  custom_html: string | null;
  custom_css: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebsiteSettings {
  id: 1;
  logo_url: string | null;
  logo_url_dark: string | null;
  announcement_text: string | null;
  announcement_enabled: boolean;
  header_nav: { label: string; href: string }[];
  footer: {
    description?: string;
    support?: { label: string; href: string }[];
    legal?: { label: string; href: string }[];
    social?: { label: string; href: string }[];
    copyright?: string;
  };
  updated_at: string;
}

export interface PaymentSettings {
  id: 1;
  method_name: string;
  account_name: string | null;
  account_number: string | null;
  bank_details: string | null;
  instructions: string | null;
  currency: string;
  allow_resubmission: boolean;
  updated_at: string;
}

export interface EmailSettings {
  id: 1;
  provider: "resend" | "smtp";
  from_name: string;
  from_email: string | null;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_username: string | null;
  updated_at: string;
}

// Minimal Database generic so @supabase/ssr's createServerClient<Database>
// / createBrowserClient<Database> type-check. Expand per-table Row/Insert/
// Update shapes as needed, or swap in the CLI-generated file.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
