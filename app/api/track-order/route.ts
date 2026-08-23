import { NextResponse } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { trackOrderSchema } from "../../../lib/validation/schemas";

/**
 * Public endpoint by design (no login required to track an order), so it
 * uses the admin client — but it only ever returns data for the exact
 * order_number + email pair supplied, and only a status-safe projection
 * (no payment screenshots, no other customers' data, no internal ids
 * beyond what's needed to render the timeline).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = trackOrderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter your order number and email." }, { status: 400 });

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, order_number, status, full_name, email, total, currency, created_at")
    .eq("order_number", parsed.data.orderNumber)
    .eq("email", parsed.data.email)
    .maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "No order found for that order number and email." }, { status: 404 });
  }

  const { data: history } = await admin
    .from("order_status_history")
    .select("status, message, created_at")
    .eq("order_id", order.id)
    .order("created_at");

  // Never expose the internal database id to the client.
  const { id, ...publicOrder } = order;

  return NextResponse.json({ order: publicOrder, history: history ?? [] });
}
