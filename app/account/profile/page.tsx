import { createClient } from "../../../lib/supabase/server";
import { updateProfileAction } from "../../../lib/auth/profileActions";

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Profile</h1>
      <form action={updateProfileAction} className="card flex max-w-md flex-col gap-4 p-6">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Full Name
          <input name="fullName" defaultValue={profile?.full_name ?? ""} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Email
          <input value={profile?.email ?? ""} disabled className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Phone
          <input name="phone" defaultValue={profile?.phone ?? ""} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400" />
        </label>
        <button type="submit" className="btn-primary mt-2">Save Changes</button>
      </form>
    </div>
  );
}
