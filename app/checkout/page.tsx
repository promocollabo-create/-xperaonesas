import { redirect } from "next/navigation";
import { getCart } from "../../lib/orders/cart";
import { createClient } from "../../lib/supabase/server";
import { formatMoney } from "../../lib/utils";
import CheckoutForm from "../../components/CheckoutForm";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/checkout");

  const { items, subtotal } = await getCart();
  if (items.length === 0) redirect("/cart");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return (
    <div className="container-xpera py-10">
      <h1 className="mb-8 text-3xl font-bold">Checkout</h1>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CheckoutForm defaultName={profile?.full_name ?? ""} defaultEmail={profile?.email ?? user.email ?? ""} />
        </div>
        <div className="card h-fit p-6">
          <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-slate-600">
                  {item.product.name} × {item.quantity}
                </span>
                <span className="font-medium">{formatMoney(item.product.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-slate-100 pt-4 text-lg font-bold">
            <span>Total</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
