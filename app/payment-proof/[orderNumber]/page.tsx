import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import PaymentProofForm from "@/components/PaymentProofForm";

export const metadata = { title: "Upload Payment Proof" };

export default async function PaymentProofPage({ params }: { params: { orderNumber: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirectTo=/payment-proof/${params.orderNumber}`);

  const { data: order } = await supabase.from("orders").select("order_number").eq("order_number", params.orderNumber).single();
  if (!order) notFound();

  return (
    <div className="container-xpera max-w-2xl py-10">
      <h1 className="mb-2 text-3xl font-bold">Upload Payment Proof</h1>
      <p className="mb-8 text-slate-600">Order <strong>{order.order_number}</strong></p>
      <PaymentProofForm orderNumber={order.order_number} />
    </div>
  );
}
