import { createAdminClient } from "../../../../lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatMoney, formatDate } from "../../../../lib/utils";
import OrderTimeline from "../../../../components/OrderTimeline";
import PaymentVerificationActions from "../../../../components/admin/PaymentVerificationActions";

export default async function AdminOrderDetailPage({ params }: { params: { orderNumber: string } }) {
  const admin = createAdminClient();

  const { data: order } = await admin.from("orders").select("*").eq("order_number", params.orderNumber).single();
  if (!order) notFound();

  const [{ data: items }, { data: payment }, { data: history }, { data: invoice }] = await Promise.all([
    admin.from("order_items").select("*").eq("order_id", order.id),
    admin.from("payments").select("*").eq("order_id", order.id).single(),
    admin.from("order_status_history").select("*").eq("order_id", order.id).order("created_at"),
    admin.from("invoices").select("*").eq("order_id", order.id).maybeSingle()
  ]);

  let proof = null;
  let screenshotUrl: string | null = null;
  if (payment) {
    const { data: p } = await admin.from("payment_proofs").select("*").eq("payment_id", payment.id).order("submitted_at", { ascending: false }).limit(1).maybeSingle();
    proof = p;
    if (proof) {
      const { data: signed } = await admin.storage.from("payment-proofs").createSignedUrl(proof.screenshot_path, 300);
      screenshotUrl = signed?.signedUrl ?? null;
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{order.order_number}</h1>
          <p className="text-sm text-slate-500">{order.full_name} · {order.email} · {formatDate(order.created_at)}</p>
        </div>
        <Link href={`/admin/customers`} className="text-sm text-brand-700 hover:underline">
          View customer records
        </Link>
      </div>

      <div className="card mb-6 p-6">
        <OrderTimeline status={order.status} history={history ?? []} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Items</h2>
          <div className="flex flex-col gap-2">
            {items?.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.product_name} × {item.quantity}</span>
                <span className="font-medium">{formatMoney(item.line_total, order.currency)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-slate-100 pt-4 font-bold">
            <span>Total</span>
            <span>{formatMoney(order.total, order.currency)}</span>
          </div>

          {invoice && (
            <p className="mt-4 text-sm text-slate-500">
              Invoice: <strong>{invoice.invoice_number}</strong>
            </p>
          )}
        </div>

        <div className="card p-6">
          <h2 className="mb-4 font-semibold">Payment</h2>
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="Status" value={payment?.status ?? "—"} />
            <Row label="Method" value={payment?.method ?? "—"} />
            <Row label="Amount" value={formatMoney(payment?.amount ?? 0, order.currency)} />
            {proof && (
              <>
                <Row label="Transaction ID" value={proof.transaction_id ?? "—"} />
                <Row label="Reference" value={proof.payment_reference ?? "—"} />
                <Row label="Paid On" value={proof.payment_date ?? "—"} />
                <Row label="Submitted" value={formatDate(proof.submitted_at)} />
              </>
            )}
          </dl>

          {screenshotUrl && (
            <a href={screenshotUrl} target="_blank" rel="noreferrer" className="mt-4 block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={screenshotUrl} alt="Payment screenshot" className="w-full rounded-lg border border-slate-200" />
            </a>
          )}

          {payment && (payment.status === "verification_pending" || payment.status === "rejected") && (
            <PaymentVerificationActions orderNumber={order.order_number} />
          )}
          {payment?.status === "rejected" && payment.rejection_reason && (
            <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">Last rejection reason: {payment.rejection_reason}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium capitalize">{value}</dd>
    </div>
  );
}
