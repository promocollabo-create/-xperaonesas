import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";

export default async function AdminDownloadsPage() {
  const admin = createAdminClient();
  const { data: permissions } = await admin
    .from("download_permissions")
    .select("*, product:products(name), order:orders(order_number), user:profiles(email)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Downloads</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Granted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {permissions?.map((p: any) => (
              <tr key={p.id}>
                <td className="px-4 py-3">{p.product?.name}</td>
                <td className="px-4 py-3">{p.order?.order_number}</td>
                <td className="px-4 py-3 text-slate-500">{p.user?.email}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${p.status === "unlocked" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{p.granted_at ? formatDate(p.granted_at) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!permissions || permissions.length === 0) && <p className="p-8 text-center text-slate-400">No download records yet.</p>}
      </div>
    </div>
  );
}
