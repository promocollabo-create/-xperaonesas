import Link from "next/link";
import { createAdminClient } from "../../../lib/supabase/admin";
import { formatMoney, formatDate } from "../../../lib/utils";

export default async function AdminPaymentVerificationPage() {
  const admin = createAdminClient();

  const { data: pending } = await admin
    .from("payments")
    .select("*, order:orders(order_number, full_name, email, total, currency, created_at)")
    .eq("status", "verification_pending")
    .order("created_at", { ascending: true });

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Payment Verification</h1>
      <p className="mb-6 text-sm text-slate-500">
        Orders waiting for manual review. No download unlocks until a payment is explicitly approved here.
      </p>

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pending?.map((p: any) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-brand-700">{p.order?.order_number}</td>
                <td className="px-4 py-3">
                  {p.order?.full_name} <span className="text-xs text-slate-400">({p.order?.email})</span>
                </td>
                <td className="px-4 py-3 font-medium">{formatMoney(p.amount, p.currency)}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(p.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/payment-verification/${p.order?.order_number}`} className="btn-primary !py-1.5 text-xs">
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!pending || pending.length === 0) && (
          <p className="p-8 text-center text-slate-400">No payments waiting for verification. 🎉</p>
        )}
      </div>
    </div>
  );
}
