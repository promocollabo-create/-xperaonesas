import { createAdminClient } from "../../../lib/supabase/admin";
import { updateWebsiteSettingsAction } from "../../../lib/admin/settingsActions";

export default async function AdminWebsiteSettingsPage() {
  const admin = createAdminClient();
  const { data: settings } = await admin.from("website_settings").select("*").eq("id", 1).single();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Website Settings</h1>
      <form action={updateWebsiteSettingsAction} encType="multipart/form-data" className="card flex max-w-xl flex-col gap-4 p-6">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Site Logo {settings?.logo_url && <span className="text-xs text-slate-400">(current logo set)</span>}
          <input type="file" name="logo" accept="image/*" className="text-sm" />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" name="announcement_enabled" defaultChecked={settings?.announcement_enabled} /> Announcement bar enabled
        </label>
        <textarea name="announcement_text" defaultValue={settings?.announcement_text ?? ""} rows={2} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm" />
        <button className="btn-primary self-start">Save</button>
      </form>
    </div>
  );
}
