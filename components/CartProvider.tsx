"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

interface CartContextValue {
  itemCount: number;
  refreshCount: () => Promise<void>;
}

const CartContext = createContext<CartContextValue>({ itemCount: 0, refreshCount: async () => {} });

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [itemCount, setItemCount] = useState(0);

  const refreshCount = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItemCount(data.itemCount ?? 0);
    } catch {
      // cart badge is non-critical — fail silently
    }
  }, []);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  return <CartContext.Provider value={{ itemCount, refreshCount }}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
