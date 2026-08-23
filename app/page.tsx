import { createClient } from "../lib/supabase/server";
import PageRenderer from "../components/PageBuilder/Renderer";
import ProductGrid from "../components/ProductGrid";
import Link from "next/link";
import type { PageSection, ProductWithImages } from "../types/database";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createClient();

  const { data: page } = await supabase.from("pages").select("*").eq("slug", "home").eq("status", "published").single();

  let sections: PageSection[] = [];
  if (page) {
    const { data } = await supabase
      .from("page_sections")
      .select("*")
      .eq("page_id", page.id)
      .eq("is_draft_version", false)
      .order("sort_order");
    sections = (data as PageSection[]) ?? [];
  }

  // First run / nothing published yet in the builder: fall back to a
  // sensible default layout built from live product data, never hard-coded
  // product content.
  if (sections.length === 0) {
    const { data: featured } = await supabase
      .from("products")
      .select("*, product_images(*)")
      .eq("status", "published")
      .eq("is_featured", true)
      .limit(8);
    const { data: newest } = await supabase
      .from("products")
      .select("*, product_images(*)")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(8);

    return <DefaultHome featured={(featured as ProductWithImages[]) ?? []} newest={(newest as ProductWithImages[]) ?? []} />;
  }

  return <PageRenderer sections={sections} />;
}

function DefaultHome({ featured, newest }: { featured: ProductWithImages[]; newest: ProductWithImages[] }) {
  return (
    <>
      <section className="bg-brand-gradient py-24 text-white">
        <div className="container-xpera flex flex-col items-center gap-6 text-center">
          <h1 className="text-4xl font-extrabold sm:text-5xl">Premium Digital Products</h1>
          <p className="max-w-xl text-lg text-white/85">
            Instant delivery, verified payments, and secure downloads — all in one marketplace.
          </p>
          <Link href="/shop" className="rounded-full bg-white px-8 py-3 font-semibold text-brand-700">
            Browse the Shop
          </Link>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="container-xpera py-14">
          <h2 className="mb-6 text-2xl font-bold">Featured Products</h2>
          <ProductGrid products={featured} />
        </section>
      )}

      {newest.length > 0 && (
        <section className="container-xpera py-14">
          <h2 className="mb-6 text-2xl font-bold">New Arrivals</h2>
          <ProductGrid products={newest} />
        </section>
      )}

      <section className="bg-slate-900 py-14 text-center text-white">
        <div className="container-xpera">
          <h3 className="text-3xl font-bold">Set up your homepage</h3>
          <p className="mt-3 text-white/70">
            Nothing has been published from the Page Builder yet — this is a live default view.
            Go to Admin → Pages → Home → Page Builder to customize it.
          </p>
        </div>
      </section>
    </>
  );
}
