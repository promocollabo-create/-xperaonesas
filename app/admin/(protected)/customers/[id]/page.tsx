import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatMoney, formatDate } from "@/lib/utils";
import { toggleCustomerDisabledAction } from "@/lib/admin/customerActions";

export default async function AdminCustomerDetailPage({ params }: { params: { id: string } }) {
  const admin = createAdminClient();
  const { data: customer } = await admin.from("profiles").select("*").eq("id", params.id).single();
  if (!customer) notFound();

  const { data: orders } = await admin.from("orders").select("*").eq("user_id", params.id).order("created_at", { ascending: false });
  const { data: invoices } = await admin.from("invoices").select("*").eq("user_id", params.id);
  const { data: downloads } = await admin.from("download_permissions").select("*, product:products(name)").eq("user_id", params.id);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{customer.full_name || customer.email}</h1>
          <p className="text-sm text-slate-500">{customer.email} · Joined {formatDate(customer.created_at)}</p>
        </div>
        <form action={toggleCustomerDisabledAction}>
          <input type="hidden" name="id" value={customer.id} />
          <input type="hidden" name="isDisabled" value={String(customer.is_disabled)} />
          <button className={`rounded-full px-4 py-2 text-sm font-semibold ${customer.is_disabled ? "bg-green-600 text-white" : "border border-red-200 text-red-500"}`}>
            {customer.is_disabled ? "Enable Account" : "Disable Account"}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-4 font-semibold">Orders</h2>
          <div className="flex flex-col divide-y divide-slate-100">
            {orders?.map((o) => (
              <Link key={o.id} href={`/admin/orders/${o.order_number}`} className="flex justify-between py-2 text-sm">
                <span>{o.order_number}</span>
                <span className="capitalize text-slate-500">{o.status.replace(/_/g, " ")}</span>
                <span className="font-medium">{formatMoney(o.total, o.currency)}</span>
              </Link>
            ))}
            {(!orders || orders.length === 0) && <p className="py-4 text-sm text-slate-400">No orders.</p>}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 font-semibold">Downloads</h2>
          <div className="flex flex-col divide-y divide-slate-100">
            {downloads?.map((d: any) => (
              <div key={d.id} className="flex justify-between py-2 text-sm">
                <span>{d.product?.name}</span>
                <span className={d.status === "unlocked" ? "text-green-600" : "text-slate-400"}>{d.status}</span>
              </div>
            ))}
            {(!downloads || downloads.length === 0) && <p className="py-4 text-sm text-slate-400">No downloads.</p>}
          </div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Invoices</h2>
          <div className="flex flex-col divide-y divide-slate-100">
            {invoices?.map((inv) => (
              <div key={inv.id} className="flex justify-between py-2 text-sm">
                <span>{inv.invoice_number}</span>
                <span className="font-medium">{formatMoney(inv.total, inv.currency)}</span>
              </div>
            ))}
            {(!invoices || invoices.length === 0) && <p className="py-4 text-sm text-slate-400">No invoices.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
