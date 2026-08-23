import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatMoney, formatDate } from "@/lib/utils";

export default async function AdminInvoicesPage() {
  const admin = createAdminClient();
  const { data: invoices } = await admin
    .from("invoices")
    .select("*, order:orders(order_number, full_name, email)")
    .order("issued_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Invoices</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Issued</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices?.map((inv: any) => (
              <tr key={inv.id}>
                <td className="px-4 py-3 font-medium">{inv.invoice_number}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${inv.order?.order_number}`} className="text-brand-700 hover:underline">
                    {inv.order?.order_number}
                  </Link>
                </td>
                <td className="px-4 py-3">{inv.order?.full_name} <span className="text-xs text-slate-400">({inv.order?.email})</span></td>
                <td className="px-4 py-3 font-medium">{formatMoney(inv.total, inv.currency)}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(inv.issued_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!invoices || invoices.length === 0) && <p className="p-8 text-center text-slate-400">No invoices yet.</p>}
      </div>
    </div>
  );
}
