import { createAdminClient } from "../../../../lib/supabase/admin";
import ProductForm from "../../../../components/admin/ProductForm";

export default async function NewProductPage() {
  const admin = createAdminClient();
  const { data: categories } = await admin.from("categories").select("*").order("name");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Add Product</h1>
      <ProductForm categories={categories ?? []} />
    </div>
  );
}
