import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatMoney } from "@/lib/utils";

export default async function AccountOverviewPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
  const { data: orders } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(5);
  const { data: downloadCount } = await supabase.from("download_permissions").select("id", { count: "exact", head: true }).eq("status", "unlocked");

  return (
    <div>
      <h1 className="mb-1 text-3xl font-bold">Welcome, {profile?.full_name || "there"}</h1>
      <p className="mb-8 text-slate-500">{profile?.email}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Orders" value={String(orders?.length ?? 0)} />
        <StatCard label="Unlocked Downloads" value={String((downloadCount as any)?.count ?? 0)} />
        <StatCard label="Account Status" value={profile?.is_disabled ? "Disabled" : "Active"} />
      </div>

      <div className="card mt-8 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Recent Orders</h2>
          <Link href="/account/orders" className="text-sm text-brand-700 hover:underline">View all</Link>
        </div>
        <div className="flex flex-col divide-y divide-slate-100">
          {orders?.map((o) => (
            <Link key={o.id} href={`/account/orders/${o.order_number}`} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-slate-900">{o.order_number}</p>
                <p className="text-xs capitalize text-slate-500">{o.status.replace(/_/g, " ")}</p>
              </div>
              <p className="font-semibold">{formatMoney(o.total, o.currency)}</p>
            </Link>
          ))}
          {(!orders || orders.length === 0) && <p className="py-6 text-center text-slate-400">No orders yet.</p>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
