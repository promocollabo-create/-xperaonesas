"use server";

import { createAdminClient } from "../supabase/admin";
import { createClient } from "../supabase/server";
import { requireUser } from "../auth/roles";

const SIGNED_URL_TTL_SECONDS = 120; // short-lived — regenerate on every download click

/**
 * Called on payment approval. Creates (or unlocks) a download_permission
 * row for every item on the order.
 */
export async function grantDownloadPermissions(orderId: string) {
  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("user_id").eq("id", orderId).single();
  if (!order) return;

  const { data: items } = await admin.from("order_items").select("*").eq("order_id", orderId);
  if (!items) return;

  for (const item of items) {
    await admin.from("download_permissions").upsert(
      {
        order_id: orderId,
        order_item_id: item.id,
        user_id: order.user_id,
        product_id: item.product_id,
        status: "unlocked",
        granted_at: new Date().toISOString()
      },
      { onConflict: "order_item_id" }
    );
  }
}

export async function lockDownloadPermissions(orderId: string) {
  const admin = createAdminClient();
  await admin.from("download_permissions").update({ status: "locked", granted_at: null }).eq("order_id", orderId);
}

/**
 * The ONLY path that produces a usable download link. Re-checks, at the
 * moment of the click, every link in the chain from §24 of the spec:
 * authenticated -> owns order -> order contains product -> payment
 * verified -> download permission exists -> unlocked. Any failure
 * returns an error instead of a URL; nothing here trusts a cached
 * "unlocked" flag from an earlier page load.
 */
export async function getSignedDownloadUrl(orderItemId: string): Promise<{ url: string } | { error: string }> {
  const { user } = await requireUser();
  const admin = createAdminClient();

  const { data: permission } = await admin
    .from("download_permissions")
    .select("*, order:orders(*), product:products(digital_file_path)")
    .eq("order_item_id", orderItemId)
    .single();

  if (!permission) return { error: "No download found for this item." };
  if (permission.user_id !== user.id) return { error: "ACCESS DENIED." };
  if (permission.status !== "unlocked") return { error: "Download is locked until payment is approved." };

  const { data: payment } = await admin.from("payments").select("status").eq("order_id", permission.order_id).single();
  if (payment?.status !== "verified") return { error: "Payment has not been verified yet." };

  const filePath = (permission as any).product?.digital_file_path;
  if (!filePath) return { error: "No file is attached to this product yet." };

  const { data: signed, error } = await admin.storage.from("product-files").createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);
  if (error || !signed) return { error: "Could not generate download link. Please try again." };

  return { url: signed.signedUrl };
}
