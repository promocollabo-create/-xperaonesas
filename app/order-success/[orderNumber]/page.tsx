import Link from "next/link";

export default function OrderSuccessPage({ params }: { params: { orderNumber: string } }) {
  return (
    <div className="container-xpera flex min-h-[60vh] max-w-lg flex-col items-center justify-center py-10 text-center">
      <div className="mb-4 text-5xl">🎉</div>
      <h1 className="text-3xl font-bold">Order Placed!</h1>
      <p className="mt-2 text-slate-600">
        Order <strong>{params.orderNumber}</strong> has been created. Continue to payment instructions to complete your purchase.
      </p>
      <Link href={`/payment/${params.orderNumber}`} className="btn-primary mt-8">
        Continue to Payment
      </Link>
    </div>
  );
}
