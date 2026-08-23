import { createAdminClient } from "../../../lib/supabase/admin";
import { updateEmailSettingsAction } from "../../../lib/admin/settingsActions";

export default async function AdminEmailSettingsPage() {
  const admin = createAdminClient();
  const { data: settings } = await admin.from("email_settings").select("*").eq("id", 1).single();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Email Settings</h1>
      <div className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
        Secrets (SMTP password, provider API key) are never stored in the database — set{" "}
        <code>RESEND_API_KEY</code> / SMTP credentials as server environment variables only.
      </div>
      <form action={updateEmailSettingsAction} className="card flex max-w-xl flex-col gap-4 p-6">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Provider
          <select name="provider" defaultValue={settings?.provider ?? "resend"} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm">
            <option value="resend">Resend</option>
            <option value="smtp">SMTP</option>
          </select>
        </label>
        <Field label="From Name" name="from_name" defaultValue={settings?.from_name} />
        <Field label="From Email" name="from_email" defaultValue={settings?.from_email ?? ""} />
        <Field label="SMTP Host (if using SMTP)" name="smtp_host" defaultValue={settings?.smtp_host ?? ""} />
        <Field label="SMTP Port" name="smtp_port" defaultValue={settings?.smtp_port ? String(settings.smtp_port) : ""} />
        <Field label="SMTP Username" name="smtp_username" defaultValue={settings?.smtp_username ?? ""} />
        <button className="btn-primary self-start">Save</button>
      </form>
    </div>
  );
}

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <input name={name} defaultValue={defaultValue} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm" />
    </label>
  );
}
