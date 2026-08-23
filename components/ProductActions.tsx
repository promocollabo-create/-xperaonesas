"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";

export default function ProductActions({ productId }: { productId: string }) {
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const { refreshCount } = useCart();
  const router = useRouter();

  async function addToCart() {
    startTransition(async () => {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity })
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
        body: JSON.stringify({ productId, quantity })
      });
      if (res.ok) router.push("/checkout");
    });
  }

  return (
    <div className="mt-6 flex items-center gap-3">
      <div className="flex items-center rounded-full border border-slate-200">
        <button className="px-3 py-2 text-lg" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
          −
        </button>
        <span className="w-8 text-center">{quantity}</span>
        <button className="px-3 py-2 text-lg" onClick={() => setQuantity((q) => q + 1)} aria-label="Increase quantity">
          +
        </button>
      </div>
      <button onClick={addToCart} disabled={isPending} className="btn-secondary">
        {added ? "Added ✓" : "Add to Cart"}
      </button>
      <button onClick={buyNow} disabled={isPending} className="btn-primary">
        Buy Now
      </button>
    </div>
  );
}
