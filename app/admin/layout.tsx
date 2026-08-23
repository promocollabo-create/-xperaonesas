import Link from "next/link";
import { requireAdmin } from "../../lib/auth/roles";
import { logoutAction } from "../../lib/auth/actions";

const NAV_GROUPS = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/admin" }]
  },
  {
    title: "Catalog",
    items: [
      { label: "Products", href: "/admin/products" },
      { label: "Categories", href: "/admin/categories" }
    ]
  },
  {
    title: "Sales",
    items: [
      { label: "Customers", href: "/admin/customers" },
      { label: "Orders", href: "/admin/orders" },
      { label: "Payment Verification", href: "/admin/payment-verification" },
      { label: "Invoices", href: "/admin/invoices" },
      { label: "Downloads", href: "/admin/downloads" }
    ]
  },
  {
    title: "Content",
    items: [
      { label: "What's New", href: "/admin/whats-new" },
      { label: "Pages", href: "/admin/pages" },
      { label: "Header", href: "/admin/header" },
      { label: "Footer", href: "/admin/footer" }
    ]
  },
  {
    title: "Settings",
    items: [
      { label: "Payment Settings", href: "/admin/payment-settings" },
      { label: "Email Settings", href: "/admin/email-settings" },
      { label: "Website Settings", href: "/admin/website-settings" }
    ]
  }
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Defense in depth: middleware already blocks non-admins from /admin/*,
  // but every admin surface re-checks here too.
  await requireAdmin();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-5 lg:block">
        <div className="mb-6 px-1 text-lg font-bold text-brand-700">XperaOne Admin</div>
        <nav className="flex flex-col gap-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{group.title}</p>
              <div className="flex flex-col gap-1">
                {group.items.map((item) => (
                  <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <form action={logoutAction} className="mt-8">
          <button type="submit" className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-500 hover:bg-red-50">
            Logout
          </button>
        </form>
      </aside>
      <div className="flex-1 p-6 lg:p-10">{children}</div>
    </div>
  );
}
