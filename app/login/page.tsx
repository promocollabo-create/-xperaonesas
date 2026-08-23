import { loginAction } from "@/lib/auth/actions";
import Link from "next/link";

export const metadata = { title: "Login" };

export default function LoginPage({ searchParams }: { searchParams: { redirectTo?: string; registered?: string } }) {
  return (
    <div className="container-xpera flex min-h-[70vh] items-center justify-center py-10">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        {searchParams.registered && (
          <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            Account created. Check your email to confirm, then log in.
          </p>
        )}
        <form action={loginAction} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="redirectTo" value={searchParams.redirectTo ?? "/account"} />
          <Field label="Email" name="email" type="email" required />
          <Field label="Password" name="password" type="password" required />
          <button type="submit" className="btn-primary mt-2">
            Log In
          </button>
        </form>
        <div className="mt-4 flex justify-between text-sm">
          <Link href="/forgot-password" className="text-brand-700 hover:underline">
            Forgot password?
          </Link>
          <Link href="/register" className="text-brand-700 hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, type, required }: { label: string; name: string; type: string; required?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400"
      />
    </label>
  );
}
