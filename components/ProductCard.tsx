"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatMoney, effectivePrice } from "@/lib/utils";
import { useCart } from "@/components/CartProvider";
import type { ProductWithImages } from "@/types/database";

export default function ProductCard({ product }: { product: ProductWithImages }) {
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const { refreshCount } = useCart();
  const router = useRouter();

  const price = effectivePrice(product.price, product.sale_price);
  const onSale = product.sale_price !== null && product.sale_price < product.price;
  const image = product.product_images?.[0]?.url;

  async function addToCart() {
    startTransition(async () => {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1 })
      });
      if (res.ok) {
        setAdded(true);
        await refreshCount();
        setTimeout(() => setAdded(false), 1500);
      }
    });
  }

  async function buyNow() {
    startTransition(async () => {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1 })
      });
      if (res.ok) router.push("/checkout");
    });
  }

  return (
    <div className="card group relative flex flex-col overflow-hidden">
      <div className="absolute left-3 top-3 z-10 flex gap-2">
        {product.is_new && <span className="badge-new">NEW</span>}
        {product.is_featured && <span className="badge-featured">Featured</span>}
      </div>
      <Link href={`/product/${product.slug}`} className="block aspect-[4/3] overflow-hidden bg-slate-100">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.product_images[0]?.alt ?? product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">No image</div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={`/product/${product.slug}`} className="font-semibold text-slate-900 hover:text-brand-700">
          {product.name}
        </Link>
        {product.short_description && (
          <p className="line-clamp-2 text-sm text-slate-500">{product.short_description}</p>
        )}
        <div className="mt-auto flex items-center gap-2 pt-2">
          <span className="text-lg font-bold text-brand-700">{formatMoney(price)}</span>
          {onSale && <span className="text-sm text-slate-400 line-through">{formatMoney(product.price)}</span>}
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={addToCart} disabled={isPending} className="btn-secondary flex-1 !py-2 text-sm">
            {added ? "Added ✓" : "Add to Cart"}
          </button>
          <button onClick={buyNow} disabled={isPending} className="btn-primary flex-1 !py-2 text-sm">
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}
