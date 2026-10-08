"use client";
import { useState, useTransition } from "react";
import { CodeReady } from "./account-forms";

type CredentialSuccess = { code: string; expiresAt: string } | { message: string };
type CredentialResult = CredentialSuccess | { error: string };

export function CredentialForm({ action, children, label }: { action: (form: FormData) => Promise<CredentialResult>; children: React.ReactNode; label: string }) {
  const [pending, start] = useTransition(), [error, setError] = useState("");
  const [result, setResult] = useState<CredentialSuccess | null>(null);
  if (result) return "code" in result ? <CodeReady title="One-time code ready" code={result.code} expiresAt={result.expiresAt} /> : <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{result.message}</p>;
  return <form method="post" className="space-y-4" onSubmit={event => {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setError("");
    start(async () => {
      try {
        const response = await action(form);
        if ("error" in response) setError(response.error);
        else setResult(response);
      } catch {
        setError("Could not complete this request. Try again. If it continues, refresh Atlas and contact an administrator.");
      }
    });
  }}><fieldset disabled={pending} className="space-y-4">{children}<button type="submit" className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white disabled:opacity-50">{pending ? "Working…" : label}</button></fieldset>{error && <p role="alert" className="text-sm text-rose-700">{error}</p>}</form>;
}
