import { createClient } from "../../../lib/supabase/server";
import DownloadButton from "../../../components/DownloadButton";

export default async function DownloadsPage() {
  const supabase = createClient();
  const { data: permissions } = await supabase
    .from("download_permissions")
    .select("*, product:products(name, slug), order:orders(order_number)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Downloads</h1>
      <div className="card divide-y divide-slate-100">
        {permissions?.map((p: any) => (
          <div key={p.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold text-slate-900">{p.product?.name}</p>
              <p className="text-xs text-slate-500">
                Order {p.order?.order_number} ·{" "}
                <span className={p.status === "unlocked" ? "text-green-600" : "text-slate-400"}>
                  {p.status === "unlocked" ? "Unlocked" : "Locked — pending payment approval"}
                </span>
              </p>
            </div>
            {p.status === "unlocked" ? (
              <DownloadButton orderItemId={p.order_item_id} />
            ) : (
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">Locked</span>
            )}
          </div>
        ))}
        {(!permissions || permissions.length === 0) && (
          <p className="p-8 text-center text-slate-400">No downloads yet — they'll appear here once a payment is approved.</p>
        )}
      </div>
    </div>
  );
}
