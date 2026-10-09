"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/core/auth/actions";
import { Button } from "@/components/ui/button";

const initialState = { error: "" };

export function LoginForm({portal,companySlug}:{portal?:"atlas";companySlug?:string} = {}) {
  const [state, formAction, pending] = useActionState(async (_: typeof initialState, formData: FormData) => {
    const result = await loginAction(formData);
    return result ?? initialState;
  }, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-2xl border border-black/[0.06] bg-white p-5">
      {portal && <input type="hidden" name="portal" value={portal}/>}
      {companySlug && <input type="hidden" name="companySlug" value={companySlug}/>}
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--color-ink-muted)]">Email</span>
        <input
          name="email" autoComplete="username"
          type="email"
          required
          autoFocus
          className="rounded-2xl border border-slate-200 px-3 py-3 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--color-ink-muted)]">Password</span>
        <input
          name="password" autoComplete="current-password"
          type="password"
          required
          className="rounded-2xl border border-slate-200 px-3 py-3 text-sm"
        />
      </label>
      {state.error && <p className="text-sm text-[var(--color-status-danger)]">{state.error}</p>}
      <Button type="submit" variant="primary" className="mt-2" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <Link href={companySlug ? `/business/${companySlug}/reset-password` : portal === "atlas" ? "/atlas/reset-password" : "/reset-password"} className="text-center text-[13px] text-[#0071e3]">Use a setup or recovery code</Link>
    </form>
  );
}
