"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export async function toggleCustomerDisabledAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const id = formData.get("id") as string;
  const isDisabled = formData.get("isDisabled") === "true";
  await admin.from("profiles").update({ is_disabled: !isDisabled }).eq("id", id);
  revalidatePath(`/admin/customers/${id}`);
  revalidatePath("/admin/customers");
}
