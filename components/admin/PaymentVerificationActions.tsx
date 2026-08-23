"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approvePaymentAction, rejectPaymentAction } from "../../lib/payments/actions";

export default function PaymentVerificationActions({ orderNumber }: { orderNumber: string }) {
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function approve() {
    startTransition(async () => {
      await approvePaymentAction(orderNumber);
      router.refresh();
    });
  }

  function reject() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("orderNumber", orderNumber);
      formData.set("reason", reason);
      const result = await rejectPaymentAction(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setShowReject(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      {error && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-700">{error}</p>}
      {!showReject ? (
        <div className="flex gap-2">
          <button onClick={approve} disabled={isPending} className="btn-primary flex-1 !py-2 text-sm">
            {isPending ? "Approving..." : "APPROVE"}
          </button>
          <button onClick={() => setShowReject(true)} disabled={isPending} className="flex-1 rounded-full border border-red-300 py-2 text-sm font-semibold text-red-500 hover:bg-red-50">
            REJECT
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejection (shown to customer)"
            rows={3}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button onClick={reject} disabled={isPending || reason.length < 5} className="flex-1 rounded-full bg-red-500 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {isPending ? "Rejecting..." : "Confirm Reject"}
            </button>
            <button onClick={() => setShowReject(false)} className="btn-secondary flex-1 !py-2 text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
