import "server-only";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { effectivePrice } from "../utils";
import type { CartItemWithProduct } from "../../types/database";

const GUEST_CART_COOKIE = "xpera_cart_session";

/**
 * Returns (creating if necessary) the cart id for the current visitor —
 * their own row if logged in, or a guest cart keyed by an httpOnly session
 * cookie otherwise. Uses the admin client for guest carts since there is
 * no auth.uid() for RLS to key off of; every mutation here is scoped to a
 * single cart id that the caller does not control (it's read from a
 * signed httpOnly cookie or the user's own JWT), so this stays safe.
 */
export async function getOrCreateCartId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const admin = createAdminClient();

  if (user) {
    const { data: existing } = await admin.from("carts").select("id").eq("user_id", user.id).maybeSingle();
    if (existing) return existing.id;

    const { data: created, error } = await admin.from("carts").insert({ user_id: user.id }).select("id").single();
    if (error || !created) throw new Error("Could not create cart.");
    return created.id;
  }

  const cookieStore = cookies();
  let sessionId = cookieStore.get(GUEST_CART_COOKIE)?.value;

  if (!sessionId) {
    sessionId = nanoid(24);
    cookieStore.set(GUEST_CART_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30
    });
  }

  const { data: existing } = await admin.from("carts").select("id").eq("session_id", sessionId).maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await admin.from("carts").insert({ session_id: sessionId }).select("id").single();
  if (error || !created) throw new Error("Could not create cart.");
  return created.id;
}

export async function addCartItem(productId: string, quantity: number) {
  const admin = createAdminClient();
  const cartId = await getOrCreateCartId();

  // Never trust a client-supplied price — only productId + quantity are
  // accepted; the price is looked up at read/checkout time.
  const { data: product } = await admin
    .from("products")
    .select("id, status")
    .eq("id", productId)
    .eq("status", "published")
    .single();
  if (!product) throw new Error("Product not available.");

  const { data: existing } = await admin
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    await admin.from("cart_items").update({ quantity: existing.quantity + quantity }).eq("id", existing.id);
  } else {
    await admin.from("cart_items").insert({ cart_id: cartId, product_id: productId, quantity });
  }
}

export async function updateCartItemQuantity(productId: string, quantity: number) {
  const admin = createAdminClient();
  const cartId = await getOrCreateCartId();

  if (quantity <= 0) {
    await admin.from("cart_items").delete().eq("cart_id", cartId).eq("product_id", productId);
    return;
  }
  await admin.from("cart_items").update({ quantity }).eq("cart_id", cartId).eq("product_id", productId);
}

export async function removeCartItem(productId: string) {
  const admin = createAdminClient();
  const cartId = await getOrCreateCartId();
  await admin.from("cart_items").delete().eq("cart_id", cartId).eq("product_id", productId);
}

/**
 * Returns cart items with LIVE product data joined in. This is the only
 * source of truth for prices shown in the cart/checkout UI — never the
 * price the browser last saw.
 */
export async function getCart(): Promise<{ cartId: string; items: CartItemWithProduct[]; subtotal: number; total: number }> {
  const admin = createAdminClient();
  const cartId = await getOrCreateCartId();

  const { data } = await admin
    .from("cart_items")
    .select("*, product:products(*)")
    .eq("cart_id", cartId)
    .order("created_at");

  const items = (data as CartItemWithProduct[]) ?? [];
  const subtotal = items.reduce((sum, item) => sum + effectivePrice(item.product.price, item.product.sale_price) * item.quantity, 0);

  return { cartId, items, subtotal, total: subtotal };
}

export async function getCartItemCount(): Promise<number> {
  const { items } = await getCart();
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

export async function clearCart(cartId: string) {
  const admin = createAdminClient();
  await admin.from("cart_items").delete().eq("cart_id", cartId);
}
