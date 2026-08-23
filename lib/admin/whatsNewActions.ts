"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["announcement", "news", "product_release", "update", "offer"]),
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  content: z.string().min(1),
  status: z.enum(["draft", "published"])
});

export async function saveWhatsNewAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const id = formData.get("id") as string | null;

  const parsed = schema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    content: formData.get("content"),
    status: formData.get("status")
  });
  if (!parsed.success) return { error: "Please check the form." };

  const payload: any = { ...parsed.data };
  if (parsed.data.status === "published") payload.published_at = new Date().toISOString();

  let itemId = id;
  if (id) {
    await admin.from("whats_new").update(payload).eq("id", id);
  } else {
    const { data } = await admin.from("whats_new").insert(payload).select("id").single();
    itemId = data?.id ?? null;
  }

  const image = formData.get("image") as File | null;
  if (image && image.size > 0 && itemId) {
    const path = `whats-new/${itemId}-${Date.now()}`;
    const buffer = Buffer.from(await image.arrayBuffer());
    const { error } = await admin.storage.from("public-media").upload(path, buffer, { contentType: image.type, upsert: true });
    if (!error) {
      const { data: pub } = admin.storage.from("public-media").getPublicUrl(path);
      await admin.from("whats_new").update({ image_url: pub.publicUrl }).eq("id", itemId);
    }
  }

  revalidatePath("/admin/whats-new");
  revalidatePath("/whats-new");
  redirect("/admin/whats-new");
}

export async function deleteWhatsNewAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("whats_new").delete().eq("id", formData.get("id") as string);
  revalidatePath("/admin/whats-new");
  revalidatePath("/whats-new");
}
