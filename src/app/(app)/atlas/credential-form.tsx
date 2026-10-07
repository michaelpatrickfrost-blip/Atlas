"use client";
import { useState, useTransition } from "react";
import { CodeReady } from "./account-forms";

export function CredentialForm({ action, children, label }: { action: (form: FormData) => Promise<{ code: string; expiresAt: string } | { message: string }>; children: React.ReactNode; label: string }) {
  const [pending, start] = useTransition(), [error, setError] = useState("");
  const [result, setResult] = useState<{ code: string; expiresAt: string } | { message: string } | null>(null);
  if (result) return "code" in result ? <CodeReady title="One-time code ready" code={result.code} expiresAt={result.expiresAt} /> : <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{result.message}</p>;
  return <form className="space-y-4" action={form => start(async () => { setError(""); try { setResult(await action(form)); } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not complete this request."); } })}>{children}<button disabled={pending} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white disabled:opacity-50">{pending ? "Working…" : label}</button>{error && <p role="alert" className="text-sm text-rose-700">{error}</p>}</form>;
}
