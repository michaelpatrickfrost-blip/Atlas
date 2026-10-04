"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { createCompanyAccount } from "./actions";
import { createCompanyUser } from "./setup-actions";

function CodeReady({ title, code, expiresAt, href, hrefLabel }: { title: string; code: string; expiresAt: string; href?: string; hrefLabel?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-4 rounded-2xl border border-blue-200 bg-blue-50 p-5">
      <h3 className="text-sm font-semibold text-blue-900">{title}</h3>
      <p className="text-xs leading-relaxed text-blue-800">Shown only here. Share it directly with this person. They choose “Use a setup or recovery code” on the Atlas sign-in screen. Email delivery is not configured.</p>
      <code className="block break-all rounded-xl bg-white p-4 text-xs text-slate-700">{code}</code>
      <p className="text-xs text-blue-700">Expires {new Date(expiresAt).toLocaleString("en-GB")} · single use.</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="rounded-lg bg-blue-600 px-4 py-2 text-xs text-white" onClick={async () => { await navigator.clipboard.writeText(code); setCopied(true); }}>{copied ? "Copied" : "Copy code"}</button>
        {href && <Link className="rounded-lg bg-white px-4 py-2 text-xs text-blue-600" href={href}>{hrefLabel}</Link>}
      </div>
    </div>
  );
}

export function NewCompanyForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ organisationId: string; code: string; expiresAt: string } | null>(null);
  const input = "mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm";
  if (result) return <CodeReady title="Company ready" code={result.code} expiresAt={result.expiresAt} href={`/atlas/${result.organisationId}/setup`} hrefLabel="Set up this company →" />;
  return (
    <form className="grid gap-4 sm:grid-cols-2" action={(form) => startTransition(async () => { setError(""); try { setResult(await createCompanyAccount(form)); } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not create the company."); } })}>
      <label className="text-sm">Company name<input required name="name" maxLength={150} className={input} /></label>
      <label className="text-sm">Administrator name<input required name="ownerName" maxLength={100} className={input} /></label>
      <label className="text-sm sm:col-span-2">Administrator email<input required name="email" type="email" maxLength={254} className={input} /></label>
      <p className="text-xs text-slate-500 sm:col-span-2">Creates an isolated workspace with the implemented apps for a 14-day trial. The administrator sets their own password with a one-time setup code. Subscription charging is not connected.</p>
      <button disabled={pending} className="rounded-xl bg-blue-600 px-5 py-3 text-sm text-white sm:col-span-2">{pending ? "Creating…" : "Create company account"}</button>
      {error && <p role="alert" className="text-xs text-rose-600 sm:col-span-2">{error}</p>}
    </form>
  );
}

export function NewCompanyUserForm({ organisationId, roles }: { organisationId: string; roles: { id: string; name: string }[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ code: string; expiresAt: string } | null>(null);
  const input = "mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm";
  if (result) return <CodeReady title="Setup code ready" code={result.code} expiresAt={result.expiresAt} />;
  return (
    <form className="space-y-4" action={(form) => startTransition(async () => { setError(""); try { setResult(await createCompanyUser(form)); } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not create the user."); } })}>
      <input type="hidden" name="organisationId" value={organisationId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs">Full name<input name="name" required maxLength={100} className={input} /></label>
        <label className="text-xs">Email<input name="email" type="email" required maxLength={254} className={input} /></label>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-xs font-medium">Roles in this company</legend>
        <div className="flex flex-wrap gap-2">{roles.map((role) => <label key={role.id} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs"><input type="checkbox" name="roleId" value={role.id} className="accent-blue-600" />{role.name}</label>)}</div>
      </fieldset>
      <button disabled={pending} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm text-white">{pending ? "Creating…" : "Create user & setup code"}</button>
      {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
    </form>
  );
}
