import "server-only";
import { createAdminClient } from "../supabase/admin";
import { nextInvoiceNumber } from "../orders/orderNumber";

/**
 * Creates the invoice row for a newly-approved order. PDF rendering is
 * left to your preferred renderer (e.g. @react-pdf/renderer or a
 * headless-Chromium service) — wire it in here and upload the result to
 * the private `invoices` bucket, storing the path in pdf_path. Until
 * then, the invoice is fully queryable/viewable from account/orders and
 * admin/invoices using the structured order + order_items data.
 */
export async function generateInvoiceForOrder(orderId: string) {
  const admin = createAdminClient();

  const { data: existing } = await admin.from("invoices").select("id").eq("order_id", orderId).maybeSingle();
  if (existing) return existing.id;

  const { data: order } = await admin.from("orders").select("*").eq("id", orderId).single();
  if (!order) throw new Error("Order not found for invoice generation.");

  const { data: payment } = await admin.from("payments").select("status").eq("order_id", orderId).single();

  const invoiceNumber = await nextInvoiceNumber();

  const { data: invoice, error } = await admin
    .from("invoices")
    .insert({
      invoice_number: invoiceNumber,
      order_id: order.id,
      user_id: order.user_id,
      subtotal: order.subtotal,
      total: order.total,
      currency: order.currency,
      payment_status: payment?.status ?? "verified"
    })
    .select("id")
    .single();

  if (error || !invoice) throw new Error("Could not create invoice.");
  return invoice.id;
}
