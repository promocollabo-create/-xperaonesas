import Link from "next/link";
import type { WebsiteSettings } from "@/types/database";

export default function Footer({ settings }: { settings: WebsiteSettings | null }) {
  const footer = settings?.footer ?? {};

  return (
    <footer className="border-t border-slate-100 bg-slate-50">
      <div className="container-xpera grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-3 text-xl font-bold text-brand-700">XperaOne</div>
          <p className="text-sm text-slate-600">
            {footer.description ?? "Premium digital products, delivered securely."}
          </p>
        </div>

        <FooterColumn title="Support" links={footer.support ?? defaultSupport} />
        <FooterColumn title="Legal" links={footer.legal ?? defaultLegal} />

        <div>
          <div className="mb-3 text-sm font-semibold text-slate-900">Follow</div>
          <div className="flex flex-col gap-2">
            {(footer.social ?? []).map((s) => (
              <a key={s.href} href={s.href} className="text-sm text-slate-600 hover:text-brand-700">
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        {footer.copyright ?? `© ${new Date().getFullYear()} XperaOne. All rights reserved.`}
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <div className="mb-3 text-sm font-semibold text-slate-900">{title}</div>
      <div className="flex flex-col gap-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="text-sm text-slate-600 hover:text-brand-700">
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

const defaultSupport = [
  { label: "Track Order", href: "/track-order" },
  { label: "Contact", href: "/whats-new" }
];
const defaultLegal = [
  { label: "Terms of Service", href: "/legal/terms" },
  { label: "Privacy Policy", href: "/legal/privacy" }
];
