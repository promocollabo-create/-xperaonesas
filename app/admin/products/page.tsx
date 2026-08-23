import Link from "next/link";
import { createAdminClient } from "../../../lib/supabase/admin";
import { formatMoney } from "../../../lib/utils";
import { deleteProductAction, togglePublishAction } from "../../../lib/admin/productActions";

export default async function AdminProductsPage({ searchParams }: { searchParams: { q?: string } }) {
  const admin = createAdminClient();
  let query = admin.from("products").select("*").neq("status", "archived").order("created_at", { ascending: false });
  if (searchParams.q) query = query.ilike("name", `%${searchParams.q}%`);
  const { data: products } = await query;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link href="/admin/products/new" className="btn-primary !py-2 text-sm">
          + Add Product
        </Link>
      </div>

      <form className="mb-4" action="/admin/products">
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search products..."
          className="w-64 rounded-full border border-slate-200 px-4 py-2 text-sm"
        />
      </form>

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Flags</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products?.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <Link href={`/admin/products/${p.id}`} className="font-medium text-slate-900 hover:text-brand-700">
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{formatMoney(p.price)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${p.status === "published" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {p.is_new && "NEW "}
                  {p.is_featured && "Featured"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <form action={togglePublishAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="status" value={p.status} />
                      <button className="btn-secondary !py-1 !px-3 text-xs">{p.status === "published" ? "Unpublish" : "Publish"}</button>
                    </form>
                    <form action={deleteProductAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-50">
                        Archive
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!products || products.length === 0) && <p className="p-8 text-center text-slate-400">No products yet.</p>}
      </div>
    </div>
  );
}
