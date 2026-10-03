"use client";

import { useActionState } from "react";
import { loginAction } from "@/core/auth/actions";
import { Button } from "@/components/ui/button";

const initialState = { error: "" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(async (_: typeof initialState, formData: FormData) => {
    const result = await loginAction(formData);
    return result ?? initialState;
  }, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-[var(--radius-atlas-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--color-ink-muted)]">Email</span>
        <input
          name="email"
          type="email"
          required
          autoFocus
          defaultValue="demo@atlas.app"
          className="rounded-[var(--radius-atlas-sm)] border border-[var(--color-border-strong)] px-3 py-2 text-sm outline-none focus:border-[var(--color-atlas-blue)]"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--color-ink-muted)]">Password</span>
        <input
          name="password"
          type="password"
          required
          defaultValue="atlas-demo"
          className="rounded-[var(--radius-atlas-sm)] border border-[var(--color-border-strong)] px-3 py-2 text-sm outline-none focus:border-[var(--color-atlas-blue)]"
        />
      </label>
      {state.error && <p className="text-sm text-[var(--color-status-danger)]">{state.error}</p>}
      <Button type="submit" variant="primary" className="mt-2" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-xs text-[var(--color-ink-faint)]">Demo credentials are pre-filled.</p>
    </form>
  );
}
