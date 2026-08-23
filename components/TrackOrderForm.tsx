"use client";

import { useState } from "react";
import Link from "next/link";
import OrderTimeline from "@/components/OrderTimeline";
import { formatMoney, formatDate } from "@/lib/utils";

export default function TrackOrderForm() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/track-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, email })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Order not found.");
      } else {
        setResult(data);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="card flex flex-col gap-4 p-6">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Order Number
          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="XP-2026-000001"
            required
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400"
          />
        </label>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary mt-2">
          {loading ? "Searching..." : "Track Order"}
        </button>
      </form>

      {result && (
        <div className="card mt-8 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">{result.order.order_number}</p>
              <p className="text-sm text-slate-500">{formatDate(result.order.created_at)}</p>
            </div>
            <p className="text-lg font-bold">{formatMoney(result.order.total, result.order.currency)}</p>
          </div>
          <OrderTimeline status={result.order.status} history={result.history} />
          {result.order.status === "rejected" && (
            <Link href={`/payment-proof/${result.order.order_number}`} className="btn-primary mt-6 flex w-full">
              Resubmit Payment Proof
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
