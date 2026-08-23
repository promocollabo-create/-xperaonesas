import { createAdminClient } from "@/lib/supabase/admin";
import { updateFooterAction } from "@/lib/admin/settingsActions";

export default async function AdminFooterPage() {
  const admin = createAdminClient();
  const { data: settings } = await admin.from("website_settings").select("*").eq("id", 1).single();
  const footer = settings?.footer ?? {};

  const toLines = (links?: { label: string; href: string }[]) => (links ?? []).map((l) => `${l.label} | ${l.href}`).join("\n");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Footer</h1>
      <form action={updateFooterAction} className="card flex max-w-xl flex-col gap-4 p-6">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Description
          <textarea name="description" defaultValue={footer.description ?? ""} rows={2} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Support Links (one per line, "Label | /href")
          <textarea name="support" defaultValue={toLines(footer.support)} rows={3} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-mono" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Legal Links
          <textarea name="legal" defaultValue={toLines(footer.legal)} rows={3} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-mono" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Social Links
          <textarea name="social" defaultValue={toLines(footer.social)} rows={3} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-mono" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Copyright
          <input name="copyright" defaultValue={footer.copyright ?? ""} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm" />
        </label>
        <button className="btn-primary self-start">Save</button>
      </form>
    </div>
  );
}
