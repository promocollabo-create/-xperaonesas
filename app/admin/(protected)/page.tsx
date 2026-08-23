import { createAdminClient } from "@/lib/supabase/admin";
import { formatMoney } from "@/lib/utils";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const admin = createAdminClient();

  const [
    { count: totalCustomers },
    { count: totalProducts },
    { count: totalOrders },
    { count: pendingPayments },
    { count: verifiedPayments },
    { count: rejectedPayments },
    { data: verifiedOrders }
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
    admin.from("products").select("id", { count: "exact", head: true }),
    admin.from("orders").select("id", { count: "exact", head: true }),
    admin.from("payments").select("id", { count: "exact", head: true }).eq("status", "verification_pending"),
    admin.from("payments").select("id", { count: "exact", head: true }).eq("status", "verified"),
    admin.from("payments").select("id", { count: "exact", head: true }).eq("status", "rejected"),
    admin.from("orders").select("total").in("status", ["payment_verified", "completed"])
  ]);

  const revenue = (verifiedOrders ?? []).reduce((sum, o) => sum + Number(o.total), 0);

  const cards = [
    { label: "Total Customers", value: totalCustomers ?? 0, href: "/admin/customers" },
    { label: "Total Products", value: totalProducts ?? 0, href: "/admin/products" },
    { label: "Total Orders", value: totalOrders ?? 0, href: "/admin/orders" },
    { label: "Pending Payments", value: pendingPayments ?? 0, href: "/admin/payment-verification", highlight: (pendingPayments ?? 0) > 0 },
    { label: "Verified Payments", value: verifiedPayments ?? 0, href: "/admin/payment-verification" },
    { label: "Rejected Payments", value: rejectedPayments ?? 0, href: "/admin/payment-verification" },
    { label: "Revenue", value: formatMoney(revenue), href: "/admin/orders" }
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`card p-5 transition hover:border-brand-300 ${c.highlight ? "border-amber-300 bg-amber-50" : ""}`}
          >
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className="mt-1 text-2xl font-bold">{c.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
