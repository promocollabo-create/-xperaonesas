import { formatMoney } from "../utils";
import type { Order, OrderItem, PaymentSettings } from "../../types/database";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function shell(title: string, bodyHtml: string) {
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1e1b2e;">
    <div style="font-weight:800;font-size:20px;background:linear-gradient(135deg,#7c3aed,#2563eb);-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:24px;">XperaOne</div>
    <h1 style="font-size:20px;margin:0 0 16px;">${title}</h1>
    ${bodyHtml}
    <p style="margin-top:32px;font-size:12px;color:#94a3b8;">XperaOne · Digital Marketplace</p>
  </div>`;
}

export function welcome(fullName: string) {
  return shell("Welcome to XperaOne", `<p>Hi ${fullName || "there"}, thanks for creating an account. Browse the shop to get started.</p>`);
}

export function orderCreated(order: Order, items: Pick<OrderItem, "product_name" | "quantity" | "line_total">[]) {
  const rows = items
    .map((i) => `<tr><td style="padding:6px 0;">${i.product_name} × ${i.quantity}</td><td style="text-align:right;">${formatMoney(i.line_total, order.currency)}</td></tr>`)
    .join("");
  return shell(
    `Order ${order.order_number} received`,
    `<p>Thanks, ${order.full_name}. We've received your order.</p>
     <table style="width:100%;border-collapse:collapse;margin:16px 0;">${rows}
       <tr><td style="padding-top:10px;font-weight:700;">Total</td><td style="text-align:right;padding-top:10px;font-weight:700;">${formatMoney(order.total, order.currency)}</td></tr>
     </table>
     <p>Next: complete payment and upload your proof.</p>`
  );
}

export function paymentInstructions(order: Order, settings: PaymentSettings | null) {
  return shell(
    "Payment Instructions",
    `<p>Order <strong>${order.order_number}</strong> — amount due <strong>${formatMoney(order.total, order.currency)}</strong></p>
     <p>Method: ${settings?.method_name ?? "Bank Transfer"}</p>
     ${settings?.account_name ? `<p>Account Name: ${settings.account_name}</p>` : ""}
     ${settings?.account_number ? `<p>Account Number: ${settings.account_number}</p>` : ""}
     ${settings?.instructions ? `<p>${settings.instructions}</p>` : ""}
     <p><a href="${SITE_URL}/payment-proof/${order.order_number}" style="color:#7c3aed;">Upload your payment proof →</a></p>`
  );
}

export function paymentProofReceived(order: Order) {
  return shell(
    "Payment proof received",
    `<p>We've received your payment proof for order <strong>${order.order_number}</strong>. Our team will verify it shortly — you'll get another email once it's approved.</p>
     <p><a href="${SITE_URL}/track-order" style="color:#7c3aed;">Track your order →</a></p>`
  );
}

export function paymentApproved(order: Order) {
  return shell(
    "Payment approved 🎉",
    `<p>Your payment for order <strong>${order.order_number}</strong> has been verified. Your download is now unlocked.</p>
     <p><a href="${SITE_URL}/account/downloads" style="color:#7c3aed;">Go to your downloads →</a></p>`
  );
}

export function paymentRejected(order: Order, reason: string) {
  return shell(
    "Payment verification issue",
    `<p>We couldn't verify the payment for order <strong>${order.order_number}</strong>.</p>
     <p><strong>Reason:</strong> ${reason}</p>
     <p><a href="${SITE_URL}/payment-proof/${order.order_number}" style="color:#7c3aed;">Resubmit your payment proof →</a></p>`
  );
}

export function invoiceAvailable(order: Order, invoiceNumber: string) {
  return shell(
    "Invoice available",
    `<p>Invoice <strong>${invoiceNumber}</strong> for order ${order.order_number} is ready.</p>
     <p><a href="${SITE_URL}/account/invoices" style="color:#7c3aed;">View your invoices →</a></p>`
  );
}

export function downloadAvailable(order: Order) {
  return shell(
    "Your download is ready",
    `<p>Order <strong>${order.order_number}</strong> is complete — your download is available in your account.</p>
     <p><a href="${SITE_URL}/account/downloads" style="color:#7c3aed;">Download now →</a></p>`
  );
}
