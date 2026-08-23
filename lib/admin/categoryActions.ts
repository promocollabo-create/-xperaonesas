"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  is_active: z.boolean().optional()
});

export async function saveCategoryAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const id = formData.get("id") as string | null;

  const parsed = schema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || undefined,
    is_active: formData.get("is_active") === "on"
  });
  if (!parsed.success) return { error: "Please check the form." };

  let categoryId = id;
  if (id) {
    await admin.from("categories").update(parsed.data).eq("id", id);
  } else {
    const { data } = await admin.from("categories").insert(parsed.data).select("id").single();
    categoryId = data?.id ?? null;
  }

  const image = formData.get("image") as File | null;
  if (image && image.size > 0 && categoryId) {
    const path = `categories/${categoryId}-${Date.now()}`;
    const buffer = Buffer.from(await image.arrayBuffer());
    const { error } = await admin.storage.from("public-media").upload(path, buffer, { contentType: image.type, upsert: true });
    if (!error) {
      const { data: pub } = admin.storage.from("public-media").getPublicUrl(path);
      await admin.from("categories").update({ image_url: pub.publicUrl }).eq("id", categoryId);
    }
  }

  revalidatePath("/admin/categories");
  return { success: true };
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("categories").delete().eq("id", formData.get("id") as string);
  revalidatePath("/admin/categories");
}
