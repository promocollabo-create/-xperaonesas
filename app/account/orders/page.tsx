import { createClient } from "../../../lib/supabase/server";
import Link from "next/link";
import { formatMoney, formatDate } from "../../../lib/utils";

export default async function MyOrdersPage() {
  const supabase = createClient();
  const { data: orders } = await supabase.from("orders").select("*").order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">My Orders</h1>
      <div className="card divide-y divide-slate-100">
        {orders?.map((o) => (
          <Link key={o.id} href={`/account/orders/${o.order_number}`} className="flex items-center justify-between p-4 hover:bg-slate-50">
            <div>
              <p className="font-semibold text-slate-900">{o.order_number}</p>
              <p className="text-xs text-slate-500">{formatDate(o.created_at)}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600">
              {o.status.replace(/_/g, " ")}
            </span>
            <p className="font-semibold">{formatMoney(o.total, o.currency)}</p>
          </Link>
        ))}
        {(!orders || orders.length === 0) && <p className="p-8 text-center text-slate-400">You haven't placed any orders yet.</p>}
      </div>
    </div>
  );
}
