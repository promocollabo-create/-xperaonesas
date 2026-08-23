import TrackOrderForm from "@/components/TrackOrderForm";

export const metadata = { title: "Track Order" };

export default function TrackOrderPage() {
  return (
    <div className="container-xpera max-w-xl py-10">
      <h1 className="mb-2 text-3xl font-bold">Track Order</h1>
      <p className="mb-8 text-slate-600">Enter your order number and the email you used at checkout.</p>
      <TrackOrderForm />
    </div>
  );
}
