"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/utils";
import { useCart } from "@/components/CartProvider";

interface CartLine {
  productId: string;
  name: string;
  slug: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export default function CartView() {
  const [items, setItems] = useState<CartLine[] | null>(null);
  const [subtotal, setSubtotal] = useState(0);
  const [isPending, startTransition] = useTransition();
  const { refreshCount } = useCart();

  async function load() {
    const res = await fetch("/api/cart", { cache: "no-store" });
    const data = await res.json();
    setItems(data.items);
    setSubtotal(data.subtotal);
  }

  useEffect(() => {
    load();
  }, []);

  function updateQty(productId: string, quantity: number) {
    startTransition(async () => {
      await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity })
      });
      await load();
      await refreshCount();
    });
  }

  function remove(productId: string) {
    startTransition(async () => {
      await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId })
      });
      await load();
      await refreshCount();
    });
  }

  if (items === null) return <p className="py-16 text-center text-slate-500">Loading cart...</p>;

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-500">Your cart is empty.</p>
        <Link href="/shop" className="btn-primary mt-6 inline-flex">
          Browse the Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        {items.map((item) => (
          <div key={item.productId} className="card flex items-center gap-4 p-4">
            <div className="flex-1">
              <Link href={`/product/${item.slug}`} className="font-semibold text-slate-900 hover:text-brand-700">
                {item.name}
              </Link>
              <p className="text-sm text-slate-500">{formatMoney(item.unitPrice)} each</p>
            </div>
            <div className="flex items-center rounded-full border border-slate-200">
              <button disabled={isPending} className="px-3 py-1.5" onClick={() => updateQty(item.productId, item.quantity - 1)}>
                −
              </button>
              <span className="w-8 text-center">{item.quantity}</span>
              <button disabled={isPending} className="px-3 py-1.5" onClick={() => updateQty(item.productId, item.quantity + 1)}>
                +
              </button>
            </div>
            <div className="w-24 text-right font-semibold">{formatMoney(item.lineTotal)}</div>
            <button disabled={isPending} onClick={() => remove(item.productId)} className="text-sm text-slate-400 hover:text-red-500">
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="card h-fit p-6">
        <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>
        <div className="flex justify-between text-sm text-slate-600">
          <span>Subtotal</span>
          <span>{formatMoney(subtotal)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-slate-100 pt-4 text-lg font-bold">
          <span>Total</span>
          <span>{formatMoney(subtotal)}</span>
        </div>
        <Link href="/checkout" className="btn-primary mt-6 flex w-full">
          Continue to Payment
        </Link>
      </div>
    </div>
  );
}
