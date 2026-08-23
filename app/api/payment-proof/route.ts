import { NextResponse } from "next/server";
import { submitPaymentProofAction } from "../../../lib/payments/actions";

// Programmatic equivalent of the payment-proof upload form. The UI uses
// submitPaymentProofAction directly as a Server Action for progressive
// enhancement; this route lets a non-browser client submit the same data.
export async function POST(request: Request) {
  const formData = await request.formData();
  const result = await submitPaymentProofAction(formData);
  if (result?.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
