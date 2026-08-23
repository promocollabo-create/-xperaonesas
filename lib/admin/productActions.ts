"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "../auth/roles";
import { createAdminClient } from "../supabase/admin";
import { productSchema } from "../validation/schemas";

export async function saveProductAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const id = formData.get("id") as string | null;

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    short_description: formData.get("short_description") || undefined,
    description: formData.get("description") || undefined,
    price: formData.get("price"),
    sale_price: formData.get("sale_price") || null,
    category_id: formData.get("category_id") || null,
    license: formData.get("license") || undefined,
    is_new: formData.get("is_new") === "on",
    is_featured: formData.get("is_featured") === "on",
    status: formData.get("status") || "draft",
    tags: (formData.get("tags") as string)?.split(",").map((t) => t.trim()).filter(Boolean) ?? []
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const featuresRaw = formData.get("features") as string | null;
  const features = featuresRaw ? featuresRaw.split("\n").map((f) => f.trim()).filter(Boolean) : [];

  const payload = { ...parsed.data, sale_price: parsed.data.sale_price || null, features };

  let productId = id;
  if (id) {
    const { error } = await admin.from("products").update(payload).eq("id", id);
    if (error) return { error: "Could not update product (slug may already be in use)." };
  } else {
    const { data, error } = await admin.from("products").insert(payload).select("id").single();
    if (error || !data) return { error: "Could not create product (slug may already be in use)." };
    productId = data.id;
  }

  // Digital file upload (optional on this save)
  const digitalFile = formData.get("digitalFile") as File | null;
  if (digitalFile && digitalFile.size > 0) {
    const path = `${productId}/${digitalFile.name}`;
    const buffer = Buffer.from(await digitalFile.arrayBuffer());
    const { error: uploadError } = await admin.storage.from("product-files").upload(path, buffer, { upsert: true });
    if (!uploadError) {
      await admin
        .from("products")
        .update({ digital_file_path: path, digital_file_name: digitalFile.name, digital_file_size: digitalFile.size })
        .eq("id", productId);
    }
  }

  // Product images (public bucket, multiple allowed)
  const images = formData.getAll("images") as File[];
  let sortOrder = 0;
  for (const img of images) {
    if (!img || img.size === 0) continue;
    const path = `products/${productId}/${Date.now()}-${img.name}`;
    const buffer = Buffer.from(await img.arrayBuffer());
    const { error: uploadError } = await admin.storage.from("public-media").upload(path, buffer, { contentType: img.type, upsert: true });
    if (!uploadError) {
      const { data: pub } = admin.storage.from("public-media").getPublicUrl(path);
      await admin.from("product_images").insert({ product_id: productId, url: pub.publicUrl, sort_order: sortOrder++ });
    }
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const id = formData.get("id") as string;
  await admin.from("products").update({ status: "archived" }).eq("id", id);
  revalidatePath("/admin/products");
}

export async function togglePublishAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  await admin.from("products").update({ status: status === "published" ? "draft" : "published" }).eq("id", id);
  revalidatePath("/admin/products");
}

export async function deleteProductImageAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const imageId = formData.get("imageId") as string;
  const productId = formData.get("productId") as string;
  await admin.from("product_images").delete().eq("id", imageId);
  revalidatePath(`/admin/products/${productId}`);
}
