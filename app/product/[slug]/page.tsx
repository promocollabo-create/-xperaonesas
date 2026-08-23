import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatMoney, effectivePrice } from "@/lib/utils";
import ProductActions from "@/components/ProductActions";
import type { ProductWithImages } from "../../../types/database";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: product } = await supabase.from("products").select("*").eq("slug", params.slug).single();
  if (!product) return {};
  return {
    title: product.seo_title ?? product.name,
    description: product.seo_description ?? product.short_description ?? undefined,
    openGraph: {
      title: product.seo_title ?? product.name,
      description: product.seo_description ?? product.short_description ?? undefined,
      images: product.og_image_url ? [product.og_image_url] : undefined
    }
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, product_images(*), category:categories(*)")
    .eq("slug", params.slug)
    .eq("status", "published")
    .single();

  if (!product) notFound();

  const p = product as unknown as ProductWithImages;
  const price = effectivePrice(p.price, p.sale_price);
  const onSale = p.sale_price !== null && p.sale_price < p.price;
  const images = p.product_images?.sort((a, b) => a.sort_order - b.sort_order) ?? [];

  return (
    <div className="container-xpera grid grid-cols-1 gap-10 py-10 lg:grid-cols-2">
      <div>
        <div className="aspect-square overflow-hidden rounded-xl2 bg-slate-100">
          {images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={images[0].url} alt={images[0].alt ?? p.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300">No image</div>
          )}
        </div>
        {images.length > 1 && (
          <div className="mt-4 grid grid-cols-4 gap-3">
            {images.slice(1).map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={img.id} src={img.url} alt={img.alt ?? p.name} className="aspect-square rounded-lg object-cover" />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex gap-2">
          {p.is_new && <span className="badge-new">NEW</span>}
          {p.is_featured && <span className="badge-featured">Featured</span>}
        </div>
        <h1 className="text-3xl font-bold text-slate-900">{p.name}</h1>
        {p.category && <p className="mt-1 text-sm text-slate-500">in {(p as any).category.name}</p>}

        <div className="mt-4 flex items-center gap-3">
          <span className="text-3xl font-bold text-brand-700">{formatMoney(price)}</span>
          {onSale && <span className="text-lg text-slate-400 line-through">{formatMoney(p.price)}</span>}
        </div>

        {p.short_description && <p className="mt-4 text-slate-600">{p.short_description}</p>}

        <ProductActions productId={p.id} />

        {p.description && (
          <div className="mt-8 border-t border-slate-100 pt-6">
            <h2 className="mb-2 font-semibold text-slate-900">Description</h2>
            <p className="whitespace-pre-line text-slate-600">{p.description}</p>
          </div>
        )}

        {p.features?.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 font-semibold text-slate-900">Features</h2>
            <ul className="list-inside list-disc space-y-1 text-slate-600">
              {p.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        )}

        {p.license && (
          <div className="mt-6 rounded-xl2 bg-slate-50 p-4 text-sm text-slate-600">
            <strong className="text-slate-900">License:</strong> {p.license}
          </div>
        )}
      </div>
    </div>
  );
}
