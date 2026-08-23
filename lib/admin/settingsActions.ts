"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateWebsiteSettingsAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const payload: Record<string, unknown> = {
    announcement_text: formData.get("announcement_text") || null,
    announcement_enabled: formData.get("announcement_enabled") === "on"
  };

  const logo = formData.get("logo") as File | null;
  if (logo && logo.size > 0) {
    const path = `settings/logo-${Date.now()}`;
    const buffer = Buffer.from(await logo.arrayBuffer());
    const { error } = await admin.storage.from("public-media").upload(path, buffer, { contentType: logo.type, upsert: true });
    if (!error) {
      const { data: pub } = admin.storage.from("public-media").getPublicUrl(path);
      payload.logo_url = pub.publicUrl;
    }
  }

  await admin.from("website_settings").update(payload).eq("id", 1);
  revalidatePath("/", "layout");
  revalidatePath("/admin/header");
  revalidatePath("/admin/website-settings");
}

export async function updateFooterAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const footer = {
    description: formData.get("description") || "",
    copyright: formData.get("copyright") || "",
    support: parseLinks(formData.get("support") as string),
    legal: parseLinks(formData.get("legal") as string),
    social: parseLinks(formData.get("social") as string)
  };

  await admin.from("website_settings").update({ footer }).eq("id", 1);
  revalidatePath("/", "layout");
  revalidatePath("/admin/footer");
}

function parseLinks(raw: string | null): { label: string; href: string }[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, href] = line.split("|").map((s) => s.trim());
      return { label: label ?? line, href: href ?? "#" };
    });
}

export async function updatePaymentSettingsAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  await admin
    .from("payment_settings")
    .update({
      method_name: formData.get("method_name"),
      account_name: formData.get("account_name") || null,
      account_number: formData.get("account_number") || null,
      bank_details: formData.get("bank_details") || null,
      instructions: formData.get("instructions") || null,
      currency: formData.get("currency") || "USD",
      allow_resubmission: formData.get("allow_resubmission") === "on"
    })
    .eq("id", 1);

  revalidatePath("/admin/payment-settings");
}

export async function updateEmailSettingsAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  // Secrets (SMTP password / provider API key) are intentionally NOT
  // accepted here — they live only in environment variables. This form
  // only manages non-secret sender identity/config.
  await admin
    .from("email_settings")
    .update({
      provider: formData.get("provider"),
      from_name: formData.get("from_name"),
      from_email: formData.get("from_email") || null,
      smtp_host: formData.get("smtp_host") || null,
      smtp_port: formData.get("smtp_port") ? Number(formData.get("smtp_port")) : null,
      smtp_username: formData.get("smtp_username") || null
    })
    .eq("id", 1);

  revalidatePath("/admin/email-settings");
}
