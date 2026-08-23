import { forgotPasswordAction } from "../../../lib/auth/actions";
import { createClient } from "../../../lib/supabase/server";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>
      <div className="card max-w-md p-6">
        <h2 className="mb-2 font-semibold text-slate-900">Password</h2>
        <p className="mb-4 text-sm text-slate-500">Send yourself a password reset link.</p>
        <form action={async () => {
          "use server";
          const fd = new FormData();
          fd.set("email", user!.email!);
          await forgotPasswordAction(fd);
        }}>
          <button type="submit" className="btn-secondary">Send Reset Link</button>
        </form>
      </div>
    </div>
  );
}
