import ProductCard from "./ProductCard";
import type { ProductWithImages } from "../types/database";

export default function ProductGrid({
  products,
  emptyMessage = "No products found."
}: {
  products: ProductWithImages[];
  emptyMessage?: string;
}) {
  if (products.length === 0) {
    return <p className="py-16 text-center text-slate-500">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
