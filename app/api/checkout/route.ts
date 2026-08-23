import { NextResponse } from "next/server";
import { createOrderAction } from "../../../lib/orders/actions";

// Programmatic equivalent of the checkout form submission.
export async function POST(request: Request) {
  const formData = await request.formData();
  const result = await createOrderAction(formData);
  if (result?.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
