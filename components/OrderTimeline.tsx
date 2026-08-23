import { formatDate } from "@/lib/utils";
import type { OrderStatusHistory } from "../types/database";

const STEP_ORDER = ["pending", "payment_verification", "payment_verified", "completed"];
const STEP_LABEL: Record<string, string> = {
  pending: "Order Placed",
  payment_verification: "Payment Submitted",
  payment_verified: "Payment Approved",
  completed: "Download Available"
};

export default function OrderTimeline({ status, history }: { status: string; history: OrderStatusHistory[] }) {
  const isRejected = status === "rejected";
  const isCancelled = status === "cancelled";
  const currentIndex = STEP_ORDER.indexOf(status);

  const historyByStatus = new Map(history.map((h) => [h.status, h]));

  if (isRejected) {
    const rejection = historyByStatus.get("rejected");
    return (
      <div className="rounded-xl2 border border-red-200 bg-red-50 p-6">
        <p className="font-semibold text-red-700">Payment Rejected</p>
        {rejection?.message && <p className="mt-2 text-sm text-red-700">{rejection.message}</p>}
        {rejection?.created_at && <p className="mt-1 text-xs text-red-500">{formatDate(rejection.created_at)}</p>}
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div className="rounded-xl2 border border-slate-200 bg-slate-50 p-6">
        <p className="font-semibold text-slate-700">Order Cancelled</p>
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-6 sm:flex-row sm:gap-4">
      {STEP_ORDER.map((step, i) => {
        const done = currentIndex >= i;
        const entry = historyByStatus.get(step);
        return (
          <li key={step} className="flex flex-1 items-start gap-3 sm:flex-col sm:items-center sm:text-center">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                done ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {i + 1}
            </div>
            <div>
              <p className={`text-sm font-semibold ${done ? "text-slate-900" : "text-slate-400"}`}>{STEP_LABEL[step]}</p>
              {entry?.created_at && <p className="text-xs text-slate-400">{formatDate(entry.created_at)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
