import CartView from "@/components/CartView";

export const metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <div className="container-xpera py-10">
      <h1 className="mb-8 text-3xl font-bold">Your Cart</h1>
      <CartView />
    </div>
  );
}
