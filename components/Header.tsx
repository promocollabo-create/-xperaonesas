"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";
import type { Profile, WebsiteSettings } from "../types/database";
import { cn } from "../lib/utils";

// Primary navigation is fixed by product requirements. "XperaOne Panel" is
// intentionally NOT here — it lives one level deep, under Account.
const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Store / Shop", href: "/shop" },
  { label: "What's New", href: "/whats-new" },
  { label: "Track Order", href: "/track-order" }
];

export default function Header({
  settings,
  user
}: {
  settings: WebsiteSettings | null;
  user: Profile | null;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount } = useCart();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="container-xpera flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-brand-700">
          {settings?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logo_url} alt="XperaOne" className="h-8 w-auto" />
          ) : (
            <span className="bg-brand-gradient bg-clip-text text-transparent">XperaOne</span>
          )}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium text-slate-600 transition hover:text-brand-700",
                pathname === item.href && "text-brand-700"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/shop" aria-label="Search" className="hidden text-slate-600 hover:text-brand-700 sm:block">
            <SearchIcon />
          </Link>
          <Link href="/cart" aria-label="Cart" className="relative text-slate-600 hover:text-brand-700">
            <CartIcon />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>
          <Link
            href={user ? "/account" : "/login"}
            className="hidden text-sm font-semibold text-slate-700 hover:text-brand-700 sm:block"
          >
            {user ? "Account" : "Login"}
          </Link>
          <button
            className="text-slate-600 md:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white md:hidden">
          <nav className="container-xpera flex flex-col gap-1 py-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={user ? "/account" : "/login"}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => setMobileOpen(false)}
            >
              {user ? "XperaOne Panel" : "Login"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
