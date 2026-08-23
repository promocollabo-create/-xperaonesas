"use client";

import { useState, useTransition } from "react";
import { getSignedDownloadUrl } from "@/lib/downloads/actions";

export default function DownloadButton({ orderItemId }: { orderItemId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await getSignedDownloadUrl(orderItemId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      window.location.href = result.url;
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button onClick={handleClick} disabled={isPending} className="btn-primary !py-2 text-sm">
        {isPending ? "Preparing..." : "Download"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
