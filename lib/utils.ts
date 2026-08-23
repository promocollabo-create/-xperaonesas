import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function formatDate(input: string | Date) {
  const d = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(d);
}

/** Effective selling price for a product, honoring an optional sale price. */
export function effectivePrice(price: number, salePrice: number | null) {
  return salePrice !== null && salePrice >= 0 && salePrice < price ? salePrice : price;
}
