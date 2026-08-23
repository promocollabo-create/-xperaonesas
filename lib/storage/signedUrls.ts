import "server-only";
import { createAdminClient } from "../supabase/admin";

/**
 * Generic short-lived signed URL helper for the private buckets
 * (product-files, payment-proofs, invoices). Domain-specific authorization
 * checks live next to their callers — see lib/downloads/actions.ts for the
 * full ownership + payment-status chain used before this is ever called.
 */
export async function createSignedUrl(bucket: "product-files" | "payment-proofs" | "invoices", path: string, ttlSeconds = 120) {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, ttlSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}
