import { createAdminClient } from "@/lib/supabase/admin";
import { updatePaymentSettingsAction } from "@/lib/admin/settingsActions";

export default async function AdminPaymentSettingsPage() {
  const admin = createAdminClient();
  const { data: settings } = await admin.from("payment_settings").select("*").eq("id", 1).single();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Payment Settings</h1>
      <form action={updatePaymentSettingsAction} className="card flex max-w-xl flex-col gap-4 p-6">
        <Field label="Payment Method Name" name="method_name" defaultValue={settings?.method_name} />
        <Field label="Account Name" name="account_name" defaultValue={settings?.account_name ?? ""} />
        <Field label="Account Number" name="account_number" defaultValue={settings?.account_number ?? ""} />
        <TextArea label="Bank Details" name="bank_details" defaultValue={settings?.bank_details ?? ""} />
        <TextArea label="Payment Instructions" name="instructions" defaultValue={settings?.instructions ?? ""} />
        <Field label="Currency" name="currency" defaultValue={settings?.currency ?? "USD"} />
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" name="allow_resubmission" defaultChecked={settings?.allow_resubmission} /> Allow proof resubmission after rejection
        </label>
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
function TextArea({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <textarea name={name} defaultValue={defaultValue} rows={3} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm" />
    </label>
  );
}
