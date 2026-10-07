"use client";
import { useState, useTransition } from "react";

export function PortalActionForm({ action, children, label = "Save" }: { action: (form: FormData) => Promise<void>; children: React.ReactNode; label?: string }) {
  const [pending, start] = useTransition(), [error, setError] = useState(""), [saved, setSaved] = useState(false);
  return <form className="space-y-4" action={form => { setError(""); setSaved(false); start(async () => { try { await action(form); setSaved(true); } catch (caught) { if (caught && typeof caught === "object" && "digest" in caught && String(caught.digest).startsWith("NEXT_REDIRECT")) throw caught; setError(caught instanceof Error ? caught.message : "Could not save. Try again."); } }); }}>
    {children}<div className="flex items-center gap-3"><button disabled={pending} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white disabled:opacity-50">{pending ? "Saving…" : label}</button>{saved && <span role="status" className="text-xs text-emerald-700">Saved</span>}</div>{error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
  </form>;
}
