// Order numbers and invoice numbers are generated exclusively by the
// Postgres functions generate_order_number() / generate_invoice_number()
// (see supabase/schema.sql) via the service-role client, so numbering is
// atomic and race-free under concurrent checkouts. This file just gives
// the server actions a typed way to call them.
import { createAdminClient } from "../supabase/admin";

export async function nextOrderNumber(): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("generate_order_number");
  if (error || !data) throw new Error("Could not generate order number.");
  return data as unknown as string;
}

export async function nextInvoiceNumber(): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("generate_invoice_number");
  if (error || !data) throw new Error("Could not generate invoice number.");
  return data as unknown as string;
}
