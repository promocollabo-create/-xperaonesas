import { createClient } from "../../../lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import OrderTimeline from "../../../components/OrderTimeline";
import { formatMoney } from "../../../lib/utils";

export default async function OrderDetailPage({
  params,
  searchParams
}: {
  params: { orderNumber: string };
  searchParams: { submitted?: string };
}) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirectTo=/order/${params.orderNumber}`);

  const { data: order } = await supabase.from("orders").select("*").eq("order_number", params.orderNumber).single();
  if (!order) notFound();

  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", order.id);
  const { data: history } = await supabase
    .from("order_status_history")
    .select("*")
    .eq("order_id", order.id)
    .order("created_at");
  const { data: payment } = await supabase.from("payments").select("*").eq("order_id", order.id).single();

  return (
    <div className="container-xpera max-w-3xl py-10">
      {searchParams.submitted && (
        <p className="mb-6 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          Payment proof submitted — we'll verify it shortly.
        </p>
      )}
      <h1 className="mb-1 text-3xl font-bold">Order {order.order_number}</h1>
      <p className="mb-8 text-slate-500">Placed by {order.full_name}</p>

      <div className="card mb-8 p-6">
        <OrderTimeline status={order.status} history={history ?? []} />
      </div>

      {order.status === "rejected" && (
        <Link href={`/payment-proof/${order.order_number}`} className="btn-primary mb-8 flex w-full">
          Resubmit Payment Proof
        </Link>
      )}
      {order.status === "pending" && payment?.status === "pending" && (
        <Link href={`/payment/${order.order_number}`} className="btn-primary mb-8 flex w-full">
          View Payment Instructions
        </Link>
      )}
      {order.status === "completed" && (
        <Link href="/account/downloads" className="btn-primary mb-8 flex w-full">
          Go to Downloads
        </Link>
      )}

      <div className="card p-6">
        <h2 className="mb-4 font-semibold text-slate-900">Items</h2>
        <div className="flex flex-col gap-3">
          {items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-slate-600">
                {item.product_name} × {item.quantity}
              </span>
              <span className="font-medium">{formatMoney(item.line_total, order.currency)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between border-t border-slate-100 pt-4 text-lg font-bold">
          <span>Total</span>
          <span>{formatMoney(order.total, order.currency)}</span>
        </div>
      </div>
    </div>
  );
}
