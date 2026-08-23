import { NextResponse } from "next/server";
import { getSignedDownloadUrl } from "@/lib/downloads/actions";

// Programmatic download-link endpoint (e.g. for a non-browser client).
// The account/downloads UI calls getSignedDownloadUrl directly as a
// Server Action; this route performs the exact same authorization chain.
export async function GET(_request: Request, { params }: { params: { orderItemId: string } }) {
  const result = await getSignedDownloadUrl(params.orderItemId);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 403 });
  return NextResponse.json({ url: result.url });
}
