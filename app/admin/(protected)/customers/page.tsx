import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminCustomersPage({ searchParams }: { searchParams: { q?: string } }) {
  const admin = createAdminClient();
  let query = admin.from("profiles").select("*").eq("role", "customer").order("created_at", { ascending: false });
  if (searchParams.q) query = query.ilike("email", `%${searchParams.q}%`);
  const { data: customers } = await query;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Customers</h1>
      <form className="mb-4" action="/admin/customers">
        <input name="q" defaultValue={searchParams.q} placeholder="Search by email..." className="w-64 rounded-full border border-slate-200 px-4 py-2 text-sm" />
      </form>
      <div className="card divide-y divide-slate-100">
        {customers?.map((c) => (
          <Link key={c.id} href={`/admin/customers/${c.id}`} className="flex items-center justify-between p-4 hover:bg-slate-50">
            <div>
              <p className="font-medium text-slate-900">{c.full_name || "—"}</p>
              <p className="text-xs text-slate-500">{c.email}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${c.is_disabled ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
              {c.is_disabled ? "Disabled" : "Active"}
            </span>
          </Link>
        ))}
        {(!customers || customers.length === 0) && <p className="p-8 text-center text-slate-400">No customers yet.</p>}
      </div>
    </div>
  );
}
