"use server";

import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { getCart, clearCart } from "./cart";
import { nextOrderNumber } from "./orderNumber";
import { checkoutSchema } from "../validation/schemas";
import { effectivePrice } from "../utils";
import { recordStatusHistory } from "./history";
import { sendOrderCreatedEmail, sendPaymentInstructionsEmail } from "../email/send";

export async function createOrderAction(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/checkout");
  }

  const parsed = checkoutSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    country: formData.get("country"),
    billingAddress: formData.get("billingAddress") ?? undefined,
    notes: formData.get("notes") ?? undefined
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  // Always re-read the cart + live product prices server-side — the
  // amount the browser displayed is never trusted for the charge.
  const { cartId, items } = await getCart();
  if (items.length === 0) {
    return { error: "Your cart is empty." };
  }

  const admin = createAdminClient();

  // Re-verify every product is still published and re-price it from the
  // database at the moment of order creation.
  const productIds = items.map((i) => i.product_id);
  const { data: freshProducts } = await admin.from("products").select("*").in("id", productIds).eq("status", "published");

  const freshById = new Map((freshProducts ?? []).map((p) => [p.id, p]));
  const orderLines = items.map((item) => {
    const product = freshById.get(item.product_id);
    if (!product) throw new Error(`"${item.product.name}" is no longer available.`);
    const unitPrice = effectivePrice(product.price, product.sale_price);
    return {
      product_id: product.id,
      product_name: product.name,
      unit_price: unitPrice,
      quantity: item.quantity,
      line_total: unitPrice * item.quantity
    };
  });

  const subtotal = orderLines.reduce((sum, l) => sum + l.line_total, 0);
  const orderNumber = await nextOrderNumber();

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: user.id,
      status: "pending",
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      country: parsed.data.country,
      billing_address: parsed.data.billingAddress ? { address: parsed.data.billingAddress } : null,
      notes: parsed.data.notes ?? null,
      subtotal,
      total: subtotal,
      currency: "USD"
    })
    .select("*")
    .single();

  if (orderError || !order) {
    return { error: "Could not create your order. Please try again." };
  }

  await admin.from("order_items").insert(orderLines.map((l) => ({ ...l, order_id: order.id })));

  await recordStatusHistory(order.id, "pending", "Order placed.");

  const { data: paymentSettings } = await admin.from("payment_settings").select("*").eq("id", 1).single();

  await admin.from("payments").insert({
    order_id: order.id,
    status: "pending",
    method: paymentSettings?.method_name ?? "Bank Transfer",
    amount: subtotal,
    currency: "USD"
  });

  await clearCart(cartId);

  await sendOrderCreatedEmail(order, orderLines);
  await sendPaymentInstructionsEmail(order);

  redirect(`/payment/${order.order_number}`);
}
