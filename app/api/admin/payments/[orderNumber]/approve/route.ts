import { NextResponse } from "next/server";
import { approvePaymentAction } from "../../../../../../lib/payments/actions";
import { requireAdmin } from "../../../../../../lib/auth/roles";

// Programmatic equivalent of the admin "Approve" button, for any external
// integration/automation. The UI itself calls approvePaymentAction directly
// as a Server Action; this route exists for API-based admin tooling.
export async function POST(_request: Request, { params }: { params: { orderNumber: string } }) {
  try {
    await requireAdmin();
    await approvePaymentAction(params.orderNumber);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not approve payment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
