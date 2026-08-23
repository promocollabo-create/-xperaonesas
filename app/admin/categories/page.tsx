import { createAdminClient } from "@/lib/supabase/admin";
import { saveCategoryAction, deleteCategoryAction } from "@/lib/admin/categoryActions";

export default async function AdminCategoriesPage() {
  const admin = createAdminClient();
  const { data: categories } = await admin.from("categories").select("*").order("sort_order");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Categories</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-1">
          <h2 className="mb-4 font-semibold text-slate-900">Add Category</h2>
          <form action={saveCategoryAction} encType="multipart/form-data" className="flex flex-col gap-3">
            <input name="name" placeholder="Name" required className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm" />
            <input name="slug" placeholder="slug" required className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm" />
            <textarea name="description" placeholder="Description" rows={3} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm" />
            <input type="file" name="image" accept="image/*" className="text-sm" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_active" defaultChecked /> Active
            </label>
            <button className="btn-primary">Add Category</button>
          </form>
        </div>

        <div className="card divide-y divide-slate-100 lg:col-span-2">
          {categories?.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {c.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                )}
                <div>
                  <p className="font-medium text-slate-900">{c.name}</p>
                  <p className="text-xs text-slate-500">/{c.slug}</p>
                </div>
              </div>
              <form action={deleteCategoryAction}>
                <input type="hidden" name="id" value={c.id} />
                <button className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-50">
                  Delete
                </button>
              </form>
            </div>
          ))}
          {(!categories || categories.length === 0) && <p className="p-8 text-center text-slate-400">No categories yet.</p>}
        </div>
      </div>
    </div>
  );
}
