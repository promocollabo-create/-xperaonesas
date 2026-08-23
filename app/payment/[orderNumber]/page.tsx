import { createClient } from "../../../lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "../../../lib/utils";

export const metadata = { title: "Payment Instructions" };

export default async function PaymentPage({ params }: { params: { orderNumber: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirectTo=/payment/${params.orderNumber}`);

  // RLS (orders_select_own_or_admin) guarantees this returns null for
  // anyone who isn't the order's owner or an admin — no manual ownership
  // check needed on top of the query itself.
  const { data: order } = await supabase.from("orders").select("*").eq("order_number", params.orderNumber).single();
  if (!order) notFound();

  const { data: payment } = await supabase.from("payments").select("*").eq("order_id", order.id).single();
  const { data: settings } = await supabase.from("payment_settings").select("*").eq("id", 1).single();

  return (
    <div className="container-xpera max-w-2xl py-10">
      <h1 className="mb-2 text-3xl font-bold">Payment Instructions</h1>
      <p className="mb-8 text-slate-600">
        Order <strong>{order.order_number}</strong> — pay the amount below using the method shown, then upload your proof of payment.
      </p>

      <div className="card space-y-4 p-6">
        <Row label="Order Number" value={order.order_number} />
        <Row label="Amount Due" value={formatMoney(order.total, order.currency)} />
        <Row label="Payment Method" value={settings?.method_name ?? "Bank Transfer"} />
        {settings?.account_name && <Row label="Account Name" value={settings.account_name} />}
        {settings?.account_number && <Row label="Account Number" value={settings.account_number} />}
        {settings?.bank_details && <Row label="Bank Details" value={settings.bank_details} />}
        {settings?.instructions && (
          <div>
            <p className="text-sm font-semibold text-slate-500">Instructions</p>
            <p className="whitespace-pre-line text-slate-700">{settings.instructions}</p>
          </div>
        )}
      </div>

      <Link href={`/payment-proof/${order.order_number}`} className="btn-primary mt-8 flex w-full">
        I've Paid — Upload Proof
      </Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 pb-3 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}
