"use client";

import { useFormState, useFormStatus } from "react-dom";
import { adminLoginAction, type AdminLoginState } from "../../../lib/auth/admin-actions";

const initialState: AdminLoginState = undefined;

export default function AdminLoginPage() {
  const [state, formAction] = useFormState(adminLoginAction, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <div className="mb-1 text-sm font-semibold uppercase tracking-wide text-brand-400">XperaOne</div>
        <h1 className="text-2xl font-bold text-white">Admin Login</h1>
        <p className="mt-1 text-sm text-slate-400">Restricted area. Administrator credentials only.</p>

        {state?.error && (
          <p role="alert" className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {state.error}
          </p>
        )}

        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
            Email
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-500"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-300">
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-500"
            />
          </label>
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary mt-2 disabled:opacity-60">
      {pending ? "Verifying..." : "Log In"}
    </button>
  );
}
