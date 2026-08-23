import Link from "next/link";
import { logoutAction } from "@/lib/auth/actions";

const NAV = [
  { label: "Overview", href: "/account" },
  { label: "My Orders", href: "/account/orders" },
  { label: "Track Order", href: "/track-order" },
  { label: "Downloads", href: "/account/downloads" },
  { label: "Invoices", href: "/account/invoices" },
  { label: "Profile", href: "/account/profile" },
  { label: "Settings", href: "/account/settings" }
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-xpera grid grid-cols-1 gap-8 py-10 md:grid-cols-[220px_1fr]">
      <aside className="card h-fit p-4">
        <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">XperaOne Panel</p>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              {item.label}
            </Link>
          ))}
          <form action={logoutAction}>
            <button type="submit" className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-500 hover:bg-red-50">
              Logout
            </button>
          </form>
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}
