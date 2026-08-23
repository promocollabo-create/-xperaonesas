import { NextResponse } from "next/server";
import { z } from "zod";
import { addCartItem, getCart, getCartItemCount, removeCartItem, updateCartItemQuantity } from "../../../lib/orders/cart";
import { effectivePrice } from "../../../lib/utils";

export async function GET() {
  const { items, subtotal, total } = await getCart();
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  return NextResponse.json({
    itemCount,
    subtotal,
    total,
    items: items.map((i) => ({
      productId: i.product_id,
      name: i.product.name,
      slug: i.product.slug,
      image: null,
      quantity: i.quantity,
      unitPrice: effectivePrice(i.product.price, i.product.sale_price),
      lineTotal: effectivePrice(i.product.price, i.product.sale_price) * i.quantity
    }))
  });
}

const addSchema = z.object({ productId: z.string().uuid(), quantity: z.number().int().positive().max(99) });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  try {
    await addCartItem(parsed.data.productId, parsed.data.quantity);
    const itemCount = await getCartItemCount();
    return NextResponse.json({ ok: true, itemCount });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not add to cart." }, { status: 400 });
  }
}

const updateSchema = z.object({ productId: z.string().uuid(), quantity: z.number().int().min(0).max(99) });

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  await updateCartItemQuantity(parsed.data.productId, parsed.data.quantity);
  const itemCount = await getCartItemCount();
  return NextResponse.json({ ok: true, itemCount });
}

const removeSchema = z.object({ productId: z.string().uuid() });

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = removeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  await removeCartItem(parsed.data.productId);
  const itemCount = await getCartItemCount();
  return NextResponse.json({ ok: true, itemCount });
}
