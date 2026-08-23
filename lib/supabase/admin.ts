import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database";

/**
 * Service-role Supabase client. BYPASSES ROW LEVEL SECURITY.
 *
 * `server-only` above guarantees a build error if this file is ever
 * imported from client code. Never import this in a "use client" file
 * or send its result to the browser.
 *
 * Use ONLY for operations that must run with elevated privilege after
 * you have manually verified the caller's identity/role/ownership in
 * code, e.g.:
 *   - creating an order (price integrity, order-number generation)
 *   - approving/rejecting a payment (admin-gated in the calling action)
 *   - generating a signed download URL (ownership + payment status checked first)
 *   - writing order_status_history
 *
 * Every function that uses this client MUST perform its own
 * authorization check before touching the database — RLS is not
 * protecting you here.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
