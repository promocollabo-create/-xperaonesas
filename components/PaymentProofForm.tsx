"use client";

import { useState, useTransition } from "react";
import { submitPaymentProofAction } from "../lib/payments/actions";

export default function PaymentProofForm({ orderNumber }: { orderNumber: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          const result = await submitPaymentProofAction(formData);
          if (result?.error) setError(result.error);
        })
      }
      encType="multipart/form-data"
      className="card flex flex-col gap-4 p-6"
    >
      <input type="hidden" name="orderNumber" value={orderNumber} />
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <Field label="Transaction ID" name="transactionId" required />
      <Field label="Payment Reference (optional)" name="paymentReference" />
      <Field label="Payment Method" name="paymentMethod" required placeholder="e.g. Bank Transfer, PayPal" />
      <Field label="Payment Date" name="paymentDate" type="date" required />
      <Field label="Amount Paid" name="amount" type="number" step="0.01" required />

      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Payment Screenshot (JPG, PNG, WEBP — max 5MB)
        <input name="screenshot" type="file" accept="image/jpeg,image/png,image/webp" required className="text-sm" />
      </label>

      <button type="submit" disabled={isPending} className="btn-primary mt-2">
        {isPending ? "Submitting..." : "Submit Payment Proof"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  step
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  step?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        step={step}
        className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400"
      />
    </label>
  );
}
