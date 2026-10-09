"use client";

import { useState, useTransition } from "react";
import { firmPlannedOrderAction, dismissPlannedOrderAction } from "../actions";

export function SuggestionActions({ id, kind, status, canFirm, canManage }: { id: string; kind: string; status: string; canFirm: boolean; canManage: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const firm = () => {
    setError(null);
    start(async () => {
      const result = await firmPlannedOrderAction(id);
      if (result && "success" in result && !result.success) setError(result.error ?? "Could not firm this proposal.");
    });
  };

  const dismiss = () => {
    setError(null);
    start(async () => {
      const result = await dismissPlannedOrderAction(id);
      if (result && "success" in result && !result.success) setError(result.error ?? "Could not dismiss this proposal.");
    });
  };

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-xs font-medium text-rose-600">{error}</span>}
      {canManage && status === "PENDING" && (
        <button type="button" onClick={dismiss} disabled={pending} className="rounded-full px-3 py-1.5 text-sm font-semibold text-[var(--color-ink-muted)] hover:bg-white disabled:opacity-50">
          Dismiss
        </button>
      )}
      {canFirm && kind === "MAKE" && (
        <button type="button" onClick={firm} disabled={pending} className="rounded-full bg-[var(--color-atlas-blue)] px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50">
          {pending ? "Working…" : "Firm to production order"}
        </button>
      )}
      {kind !== "MAKE" && <span className="text-xs text-[var(--color-ink-muted)]">{kind === "BUY" ? "Hand to Purchasing" : "Hand to Logistics"}</span>}
    </div>
  );
}
