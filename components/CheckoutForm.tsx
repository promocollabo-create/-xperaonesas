"use client";

import { useState, useTransition } from "react";
import { createOrderAction } from "../lib/orders/actions";

export default function CheckoutForm({ defaultName, defaultEmail }: { defaultName: string; defaultEmail: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          const result = await createOrderAction(formData);
          if (result?.error) setError(result.error);
        })
      }
      className="card flex flex-col gap-4 p-6"
    >
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full Name" name="fullName" defaultValue={defaultName} required />
        <Field label="Email" name="email" type="email" defaultValue={defaultEmail} required />
        <Field label="Phone" name="phone" required />
        <Field label="Country" name="country" required />
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Billing Address (optional)
        <textarea name="billingAddress" rows={3} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Order Notes (optional)
        <textarea name="notes" rows={2} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400" />
      </label>
      <button type="submit" disabled={isPending} className="btn-primary mt-2">
        {isPending ? "Placing Order..." : "CONTINUE TO PAYMENT"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400"
      />
    </label>
  );
}
