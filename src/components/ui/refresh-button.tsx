"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function RefreshButton({ label = "Refresh updates" }: { label?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button type="button" disabled={pending} aria-busy={pending} onClick={() => startTransition(() => router.refresh())} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">{pending ? "Refreshing…" : label}</button>;
}
