import { createClient } from "../../../lib/supabase/server";
import { formatMoney, formatDate } from "../../../lib/utils";

export default async function InvoicesPage() {
  const supabase = createClient();
  const { data: invoices } = await supabase.from("invoices").select("*, order:orders(order_number)").order("issued_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Invoices</h1>
      <div className="card divide-y divide-slate-100">
        {invoices?.map((inv: any) => (
          <div key={inv.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold text-slate-900">{inv.invoice_number}</p>
              <p className="text-xs text-slate-500">
                Order {inv.order?.order_number} · {formatDate(inv.issued_at)}
              </p>
            </div>
            <p className="font-semibold">{formatMoney(inv.total, inv.currency)}</p>
          </div>
        ))}
        {(!invoices || invoices.length === 0) && (
          <p className="p-8 text-center text-slate-400">Invoices appear here once a payment is approved.</p>
        )}
      </div>
    </div>
  );
}
