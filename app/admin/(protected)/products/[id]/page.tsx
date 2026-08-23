import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient();
  const [{ data: product }, { data: categories }] = await Promise.all([
    admin.from("products").select("*, product_images(*)").eq("id", params.id).single(),
    admin.from("categories").select("*").order("name")
  ]);
  if (!product) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Edit Product</h1>
      <ProductForm product={product as any} categories={categories ?? []} />
    </div>
  );
}
