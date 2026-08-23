import { NextResponse } from "next/server";
import { z } from "zod";
import { rejectPaymentAction } from "@/lib/payments/actions";
import { requireAdmin } from "@/lib/auth/roles";

const schema = z.object({ reason: z.string().min(5) });

export async function POST(request: Request, { params }: { params: { orderNumber: string } }) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Provide a rejection reason." }, { status: 400 });

    const fd = new FormData();
    fd.set("orderNumber", params.orderNumber);
    fd.set("reason", parsed.data.reason);
    const result = await rejectPaymentAction(fd);
    if (result?.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not reject payment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
