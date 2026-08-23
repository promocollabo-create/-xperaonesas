import { createClient } from "@/lib/supabase/server";
import ProductGrid from "@/components/ProductGrid";
import Link from "next/link";
import type { Category, ProductWithImages } from "@/types/database";

export const metadata = { title: "Store / Shop" };

interface ShopSearchParams {
  q?: string;
  category?: string;
  sort?: string;
}

export default async function ShopPage({ searchParams }: { searchParams: ShopSearchParams }) {
  const supabase = createClient();

  const { data: categories } = await supabase.from("categories").select("*").eq("is_active", true).order("sort_order");

  let query = supabase.from("products").select("*, product_images(*)", { count: "exact" }).eq("status", "published");

  if (searchParams.q) {
    query = query.ilike("name", `%${searchParams.q}%`);
  }
  if (searchParams.category) {
    const cat = (categories as Category[] | null)?.find((c) => c.slug === searchParams.category);
    if (cat) query = query.eq("category_id", cat.id);
  }

  switch (searchParams.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    default:
      query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
  }

  const { data: products } = await query.limit(60);

  return (
    <div className="container-xpera py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Store</h1>
        <form className="flex flex-wrap gap-2" action="/shop">
          <input
            type="text"
            name="q"
            defaultValue={searchParams.q}
            placeholder="Search products..."
            className="w-56 rounded-full border border-slate-200 px-4 py-2 text-sm"
          />
          <select name="sort" defaultValue={searchParams.sort ?? ""} className="rounded-full border border-slate-200 px-4 py-2 text-sm">
            <option value="">Sort: Featured</option>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
          <button className="btn-secondary !py-2 text-sm" type="submit">
            Apply
          </button>
        </form>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <Link href="/shop" className={`btn-secondary !py-1.5 text-xs ${!searchParams.category ? "border-brand-500 text-brand-700" : ""}`}>
          All
        </Link>
        {(categories as Category[] | null)?.map((c) => (
          <Link
            key={c.id}
            href={`/shop?category=${c.slug}`}
            className={`btn-secondary !py-1.5 text-xs ${searchParams.category === c.slug ? "border-brand-500 text-brand-700" : ""}`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <ProductGrid products={(products as ProductWithImages[]) ?? []} emptyMessage="No products match your search." />
    </div>
  );
}
