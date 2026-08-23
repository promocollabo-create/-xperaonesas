import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "../supabase/admin";
import { formatMoney } from "../utils";
import type { Order, OrderItem } from "../../types/database";
import * as templates from "./templates";

/**
 * Thin provider wrapper. Swap the body of `dispatch` for your SMTP
 * transport if you're not using Resend — everything above this line
 * (the template functions, the call sites in lib/orders and lib/payments)
 * stays the same. Never log or persist the API key / SMTP password;
 * both come from process.env only (see .env.example) and email_settings
 * in the database intentionally never stores secrets (see schema.sql).
 */
async function dispatch(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[email] RESEND_API_KEY not set — skipping send to ${to}: ${subject}`);
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "XperaOne <orders@xperaone.example>",
      to,
      subject,
      html
    });
  } catch (err) {
    // Email delivery failures must never break the checkout/verification
    // flow itself — log and continue.
    console.error("[email] send failed", err);
  }
}

export async function sendWelcomeEmail(email: string, fullName: string) {
  await dispatch(email, "Welcome to XperaOne", templates.welcome(fullName));
}

export async function sendOrderCreatedEmail(order: Order, items: Pick<OrderItem, "product_name" | "quantity" | "line_total">[]) {
  await dispatch(order.email, `Order ${order.order_number} received`, templates.orderCreated(order, items));
}

export async function sendPaymentInstructionsEmail(order: Order) {
  const admin = createAdminClient();
  const { data: settings } = await admin.from("payment_settings").select("*").eq("id", 1).single();
  await dispatch(order.email, `Payment instructions for ${order.order_number}`, templates.paymentInstructions(order, settings));
}

export async function sendPaymentProofReceivedEmail(order: Order) {
  await dispatch(order.email, `We received your payment proof — ${order.order_number}`, templates.paymentProofReceived(order));
}

export async function sendPaymentApprovedEmail(order: Order) {
  await dispatch(
    order.email,
    `Payment approved — your download is ready (${order.order_number})`,
    templates.paymentApproved(order)
  );
}

export async function sendPaymentRejectedEmail(order: Order, reason: string) {
  await dispatch(order.email, `Payment verification issue — ${order.order_number}`, templates.paymentRejected(order, reason));
}

export async function sendInvoiceAvailableEmail(order: Order, invoiceNumber: string) {
  await dispatch(order.email, `Invoice ${invoiceNumber} available`, templates.invoiceAvailable(order, invoiceNumber));
}

export async function sendDownloadAvailableEmail(order: Order) {
  await dispatch(order.email, `Your download is available — ${order.order_number}`, templates.downloadAvailable(order));
}

export { formatMoney };
