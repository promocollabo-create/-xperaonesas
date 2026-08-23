"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../../types/database";

/**
 * Browser Supabase client. Uses only the anon key — RLS applies to every
 * query made with this client, exactly as it does for any other user JWT.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
