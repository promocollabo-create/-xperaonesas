import { registerAction } from "../../lib/auth/actions";
import Link from "next/link";

export const metadata = { title: "Create Account" };

export default function RegisterPage() {
  return (
    <div className="container-xpera flex min-h-[70vh] items-center justify-center py-10">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <form action={registerAction} className="mt-6 flex flex-col gap-4">
          <Field label="Full Name" name="fullName" type="text" required />
          <Field label="Email" name="email" type="email" required />
          <Field label="Password" name="password" type="password" required />
          <button type="submit" className="btn-primary mt-2">
            Create Account
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-700 hover:underline">
            Log in
          </Link>
        </p>
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
        minLength={name === "password" ? 8 : undefined}
        className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400"
      />
    </label>
  );
}
