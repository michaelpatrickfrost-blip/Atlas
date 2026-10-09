"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { loginAction } from "@/core/auth/actions";
import { Button } from "@/components/ui/button";

const initialState = { error: "" };

export function LoginForm({portal,companySlug,recoveryHref="/reset-password"}:{portal?:"atlas";companySlug?:string;recoveryHref?:string} = {}) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, formAction, pending] = useActionState(async (_: typeof initialState, formData: FormData) => {
    const result = await loginAction(formData);
    return result ?? initialState;
  }, initialState);

  return (
    <form action={formAction} className={portal === "atlas" ? "flex flex-col gap-5" : "flex flex-col gap-4 rounded-2xl border border-black/[0.06] bg-white p-5"}>
      {portal && <input type="hidden" name="portal" value={portal}/>}
      {companySlug && <input type="hidden" name="companySlug" value={companySlug}/>}
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">{portal === "atlas" ? "Email address" : "Email"}</span>
        <input
          name="email" autoComplete="username"
          value={email} onChange={event => setEmail(event.target.value)}
          type="email"
          required
          maxLength={254}
          autoFocus
          className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />
      </label>
      <div className="flex flex-col gap-1 text-sm">
        <label htmlFor="login-password" className="font-medium text-slate-700">Password</label>
        <div className="relative">
        <input
          id="login-password"
          name="password" autoComplete="current-password"
          value={password} onChange={event => setPassword(event.target.value)}
          type={showPassword ? "text" : "password"}
          required
          maxLength={128}
          className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-4 pr-14 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        />
        <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div>
      </div>
      {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
      <Button type="submit" variant="primary" className="mt-1 min-h-12 w-full justify-center gap-2 rounded-xl" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}{!pending && portal === "atlas" && <ArrowRight size={17} aria-hidden="true" />}
      </Button>
      <Link href={companySlug ? `/business/${companySlug}/reset-password` : recoveryHref} className="text-center text-[13px] font-medium text-[#0071e3]">Use a setup or recovery code</Link>
    </form>
  );
}
