import { createAdminClient } from "@/lib/supabase/admin";
import { updateWebsiteSettingsAction } from "@/lib/admin/settingsActions";

export default async function AdminHeaderPage() {
  const admin = createAdminClient();
  const { data: settings } = await admin.from("website_settings").select("*").eq("id", 1).single();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Header</h1>
      <form action={updateWebsiteSettingsAction} encType="multipart/form-data" className="card flex max-w-xl flex-col gap-4 p-6">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Logo {settings?.logo_url && <span className="text-xs text-slate-400">(current logo set)</span>}
          <input type="file" name="logo" accept="image/*" className="text-sm" />
        </label>

        <div className="border-t border-slate-100 pt-4">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" name="announcement_enabled" defaultChecked={settings?.announcement_enabled} /> Show announcement bar
          </label>
          <textarea
            name="announcement_text"
            defaultValue={settings?.announcement_text ?? ""}
            placeholder="Free shipping on all digital products this week!"
            rows={2}
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm"
          />
        </div>

        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          Main navigation is fixed to Home / Store / What's New / Track Order, with Search, Cart, and Account
          separate — per the product requirements this cannot be edited here.
        </div>

        <button className="btn-primary self-start">Save</button>
      </form>
    </div>
  );
}
