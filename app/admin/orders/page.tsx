import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatMoney, formatDate } from "@/lib/utils";

const STATUS_FILTERS = ["all", "pending", "payment_verification", "payment_verified", "completed", "rejected", "cancelled"];

export default async function AdminOrdersPage({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  const admin = createAdminClient();
  let query = admin.from("orders").select("*").order("created_at", { ascending: false });
  if (searchParams.status && searchParams.status !== "all") query = query.eq("status", searchParams.status as any);
  if (searchParams.q) query = query.or(`order_number.ilike.%${searchParams.q}%,email.ilike.%${searchParams.q}%`);
  const { data: orders } = await query;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Orders</h1>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((s) => (
          <Link
            key={s}
            href={`/admin/orders${s === "all" ? "" : `?status=${s}`}`}
            className={`btn-secondary !py-1.5 text-xs capitalize ${(!searchParams.status && s === "all") || searchParams.status === s ? "border-brand-500 text-brand-700" : ""}`}
          >
            {s.replace(/_/g, " ")}
          </Link>
        ))}
        <form action="/admin/orders" className="ml-auto">
          <input type="hidden" name="status" value={searchParams.status ?? ""} />
          <input name="q" defaultValue={searchParams.q} placeholder="Search order # or email..." className="w-64 rounded-full border border-slate-200 px-4 py-2 text-sm" />
        </form>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders?.map((o) => (
              <tr key={o.id} className="cursor-pointer hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.order_number}`} className="font-medium text-brand-700">
                    {o.order_number}
                  </Link>
                </td>
                <td className="px-4 py-3">{o.full_name} <span className="text-xs text-slate-400">({o.email})</span></td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                    {o.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">{formatMoney(o.total, o.currency)}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(o.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!orders || orders.length === 0) && <p className="p-8 text-center text-slate-400">No orders found.</p>}
      </div>
    </div>
  );
}
