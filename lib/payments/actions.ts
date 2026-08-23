"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { requireAdmin } from "../auth/roles";
import { paymentProofSchema, ALLOWED_PROOF_MIME_TYPES, MAX_PROOF_FILE_SIZE_BYTES, rejectPaymentSchema } from "../validation/schemas";
import { recordStatusHistory } from "../orders/history";
import { generateInvoiceForOrder } from "../invoices/actions";
import { grantDownloadPermissions, lockDownloadPermissions } from "../downloads/actions";
import {
  sendPaymentProofReceivedEmail,
  sendPaymentApprovedEmail,
  sendPaymentRejectedEmail
} from "../email/send";

// ------------------------------------------------------------
// CUSTOMER: submit payment proof
// ------------------------------------------------------------
export async function submitPaymentProofAction(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const orderNumber = formData.get("orderNumber") as string;
  const parsed = paymentProofSchema.safeParse({
    orderNumber,
    transactionId: formData.get("transactionId"),
    paymentReference: formData.get("paymentReference") ?? undefined,
    paymentMethod: formData.get("paymentMethod"),
    paymentDate: formData.get("paymentDate"),
    amount: formData.get("amount")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const file = formData.get("screenshot") as File | null;
  if (!file || file.size === 0) return { error: "Please attach a payment screenshot." };
  if (!ALLOWED_PROOF_MIME_TYPES.includes(file.type)) {
    return { error: "Only JPG, PNG, or WEBP images are allowed." };
  }
  if (file.size > MAX_PROOF_FILE_SIZE_BYTES) {
    return { error: "Screenshot must be under 5MB." };
  }

  // Ownership check via RLS-scoped client — this query returns null for
  // any order that doesn't belong to the current user.
  const { data: order } = await supabase.from("orders").select("*").eq("order_number", orderNumber).single();
  if (!order) return { error: "Order not found." };

  const admin = createAdminClient();
  const { data: payment } = await admin.from("payments").select("*").eq("order_id", order.id).single();
  if (!payment) return { error: "No payment record found for this order." };

  const { data: settings } = await admin.from("payment_settings").select("allow_resubmission").eq("id", 1).single();
  if (payment.status === "rejected" && settings?.allow_resubmission === false) {
    return { error: "This payment was rejected and resubmission is disabled. Please contact support." };
  }
  if (payment.status === "verified") {
    return { error: "This order has already been verified." };
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${order.id}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage.from("payment-proofs").upload(path, buffer, {
    contentType: file.type,
    upsert: false
  });
  if (uploadError) return { error: "Could not upload screenshot. Please try again." };

  await admin.from("payment_proofs").insert({
    payment_id: payment.id,
    order_id: order.id,
    transaction_id: parsed.data.transactionId,
    payment_reference: parsed.data.paymentReference ?? null,
    payment_method: parsed.data.paymentMethod,
    payment_date: parsed.data.paymentDate,
    amount: parsed.data.amount,
    screenshot_path: path
  });

  await admin.from("payments").update({ status: "verification_pending" }).eq("id", payment.id);
  await admin.from("orders").update({ status: "payment_verification" }).eq("id", order.id);

  await recordStatusHistory(order.id, "payment_verification", "Payment proof submitted — pending verification.");
  await sendPaymentProofReceivedEmail(order);

  redirect(`/order/${order.order_number}?submitted=1`);
}

// ------------------------------------------------------------
// ADMIN: approve payment
// ------------------------------------------------------------
export async function approvePaymentAction(orderNumber: string) {
  const { user } = await requireAdmin();
  const admin = createAdminClient();

  const { data: order } = await admin.from("orders").select("*").eq("order_number", orderNumber).single();
  if (!order) throw new Error("Order not found.");

  const { data: payment } = await admin.from("payments").select("*").eq("order_id", order.id).single();
  if (!payment) throw new Error("Payment not found.");

  // 1. Payment becomes verified.
  await admin
    .from("payments")
    .update({ status: "verified", verified_by: user.id, verified_at: new Date().toISOString(), rejection_reason: null })
    .eq("id", payment.id);

  // 2. Order becomes payment_verified.
  await admin.from("orders").update({ status: "payment_verified" }).eq("id", order.id);

  // 3. Create invoice.
  await generateInvoiceForOrder(order.id);

  // 4 + 5. Create download permission(s) and unlock.
  await grantDownloadPermissions(order.id);

  // 6. Add status history entry.
  await recordStatusHistory(order.id, "payment_verified", "Payment approved by admin.", user.id);
  await recordStatusHistory(order.id, "completed", "Order completed — download unlocked.", user.id);
  await admin.from("orders").update({ status: "completed" }).eq("id", order.id);

  // 7. Send confirmation email. 8. Download shows in customer account (data-driven, no extra step).
  await sendPaymentApprovedEmail(order);

  revalidatePath(`/admin/payment-verification`);
  revalidatePath(`/admin/orders/${orderNumber}`);
  revalidatePath(`/order/${orderNumber}`);
  revalidatePath(`/account/orders/${orderNumber}`);
}

// ------------------------------------------------------------
// ADMIN: reject payment
// ------------------------------------------------------------
export async function rejectPaymentAction(formData: FormData) {
  const { user } = await requireAdmin();

  const parsed = rejectPaymentSchema.safeParse({
    orderNumber: formData.get("orderNumber"),
    reason: formData.get("reason")
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a reason." };

  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("*").eq("order_number", parsed.data.orderNumber).single();
  if (!order) return { error: "Order not found." };

  const { data: payment } = await admin.from("payments").select("*").eq("order_id", order.id).single();
  if (!payment) return { error: "Payment not found." };

  await admin
    .from("payments")
    .update({ status: "rejected", rejection_reason: parsed.data.reason, verified_by: user.id, verified_at: new Date().toISOString() })
    .eq("id", payment.id);

  await admin.from("orders").update({ status: "rejected" }).eq("id", order.id);
  await lockDownloadPermissions(order.id);

  await recordStatusHistory(order.id, "rejected", `Payment rejected: ${parsed.data.reason}`, user.id);
  await sendPaymentRejectedEmail(order, parsed.data.reason);

  revalidatePath(`/admin/payment-verification`);
  revalidatePath(`/admin/orders/${parsed.data.orderNumber}`);
  revalidatePath(`/order/${parsed.data.orderNumber}`);

  return { success: true };
}
