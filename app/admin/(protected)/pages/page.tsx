import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

const KNOWN_PAGES = [{ slug: "home", title: "Home" }];

export default async function AdminPagesListPage() {
  const admin = createAdminClient();
  const { data: pages } = await admin.from("pages").select("*");
  const bySlug = new Map((pages ?? []).map((p) => [p.slug, p]));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Pages</h1>
      <div className="card divide-y divide-slate-100">
        {KNOWN_PAGES.map((kp) => {
          const page = bySlug.get(kp.slug);
          return (
            <div key={kp.slug} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-slate-900">{kp.title}</p>
                <p className="text-xs text-slate-500">/{kp.slug === "home" ? "" : kp.slug}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${page?.status === "published" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                  {page?.status ?? "unpublished"}
                </span>
                <Link href={`/admin/pages/${kp.slug}/builder`} className="btn-primary !py-1.5 text-xs">
                  Page Builder
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
