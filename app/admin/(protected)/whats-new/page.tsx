import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteWhatsNewAction } from "@/lib/admin/whatsNewActions";
import { formatDate } from "@/lib/utils";

export default async function AdminWhatsNewPage() {
  const admin = createAdminClient();
  const { data: items } = await admin.from("whats_new").select("*").order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">What's New</h1>
        <Link href="/admin/whats-new/new" className="btn-primary !py-2 text-sm">+ New Post</Link>
      </div>
      <div className="card divide-y divide-slate-100">
        {items?.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium text-slate-900">{item.title}</p>
              <p className="text-xs capitalize text-slate-500">{item.type.replace(/_/g, " ")} · {item.status} · {formatDate(item.created_at)}</p>
            </div>
            <form action={deleteWhatsNewAction}>
              <input type="hidden" name="id" value={item.id} />
              <button className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-50">Delete</button>
            </form>
          </div>
        ))}
        {(!items || items.length === 0) && <p className="p-8 text-center text-slate-400">Nothing posted yet.</p>}
      </div>
    </div>
  );
}
