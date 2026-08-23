"use client";

import { useState } from "react";
import { forgotPasswordAction } from "../../lib/auth/actions";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="container-xpera flex min-h-[70vh] items-center justify-center py-10">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">Reset your password</h1>
        {sent ? (
          <p className="mt-4 text-slate-600">
            If an account exists for that email, we've sent a reset link.
          </p>
        ) : (
          <form
            action={async (formData) => {
              await forgotPasswordAction(formData);
              setSent(true);
            }}
            className="mt-6 flex flex-col gap-4"
          >
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              Email
              <input
                name="email"
                type="email"
                required
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400"
              />
            </label>
            <button type="submit" className="btn-primary mt-2">
              Send Reset Link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
