import { createClient } from "../../../lib/supabase/server";
import ProductGrid from "../../../components/ProductGrid";
import { notFound } from "next/navigation";
import type { ProductWithImages } from "../../../types/database";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: category } = await supabase.from("categories").select("*").eq("slug", params.slug).single();
  if (!category) return {};
  return {
    title: category.seo_title ?? category.name,
    description: category.seo_description ?? category.description ?? undefined
  };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: category } = await supabase.from("categories").select("*").eq("slug", params.slug).eq("is_active", true).single();
  if (!category) notFound();

  const { data: products } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("status", "published")
    .eq("category_id", category.id)
    .order("created_at", { ascending: false });

  return (
    <div className="container-xpera py-10">
      <h1 className="mb-2 text-3xl font-bold">{category.name}</h1>
      {category.description && <p className="mb-8 max-w-2xl text-slate-600">{category.description}</p>}
      <ProductGrid products={(products as ProductWithImages[]) ?? []} emptyMessage="No products in this category yet." />
    </div>
  );
}
