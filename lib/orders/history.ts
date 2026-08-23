import "server-only";
import { createAdminClient } from "../supabase/admin";

/**
 * Every important order/payment transition writes a row here — this is
 * what powers both /track-order and the admin order detail timeline.
 */
export async function recordStatusHistory(orderId: string, status: string, message: string, createdBy?: string) {
  const admin = createAdminClient();
  await admin.from("order_status_history").insert({
    order_id: orderId,
    status,
    message,
    created_by: createdBy ?? null
  });
}
