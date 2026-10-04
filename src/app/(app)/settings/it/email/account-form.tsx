"use client";
import { useState } from "react";
import { ActionForm } from "@/components/ui/action-form";
import { EMAIL_PRESETS } from "@/core/email/presets";
import { saveEmailAccount } from "../actions";

type Existing = { id: string; label: string; fromName: string; fromEmail: string; replyTo: string; smtpHost: string; smtpPort: number; smtpSecurity: string; smtpUser: string; imapHost: string; signatureHtml: string; dailyLimit: number };
const input = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm";

export function AccountForm({ scope, existing }: { scope: "COMPANY" | "PERSONAL"; existing?: Existing }) {
  const [preset, setPreset] = useState(existing ? "custom" : "microsoft");
  const p = EMAIL_PRESETS.find((x) => x.key === preset)!;
  const [email, setEmail] = useState(existing?.fromEmail ?? "");
  const key = `${preset}`;
  return (
    <ActionForm action={saveEmailAccount} className="grid gap-3 md:grid-cols-2">
      <input type="hidden" name="scope" value={scope} />
      {existing && <input type="hidden" name="id" value={existing.id} />}
      {!existing && (
        <label className="md:col-span-2 text-sm font-medium">Provider
          <select className={input} value={preset} onChange={(e) => setPreset(e.target.value)}>{EMAIL_PRESETS.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}</select>
          {p.note && <span className="mt-1 block text-xs font-normal text-slate-500">{p.note}</span>}
        </label>
      )}
      <label className="text-sm font-medium">Name for this mailbox<input name="label" required defaultValue={existing?.label ?? (scope === "COMPANY" ? "Company sales" : "My email")} className={input} /></label>
      <label className="text-sm font-medium">Sender name<input name="fromName" defaultValue={existing?.fromName ?? ""} placeholder="Jane at Northbridge" className={input} /></label>
      <label className="text-sm font-medium">Sending address<input name="fromEmail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} /></label>
      <label className="text-sm font-medium">Reply-to (optional)<input name="replyTo" type="email" defaultValue={existing?.replyTo ?? ""} className={input} /></label>
      <label className="text-sm font-medium">SMTP server<input key={`h${key}`} name="smtpHost" required defaultValue={existing?.smtpHost ?? p.smtpHost} className={input} /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm font-medium">Port<input key={`p${key}`} name="smtpPort" type="number" defaultValue={existing?.smtpPort ?? p.smtpPort} className={input} /></label>
        <label className="text-sm font-medium">Security
          <select key={`s${key}`} name="smtpSecurity" defaultValue={existing?.smtpSecurity ?? p.smtpSecurity} className={input}><option value="STARTTLS">STARTTLS (587)</option><option value="SSL">SSL/TLS (465)</option><option value="NONE">None</option></select>
        </label>
      </div>
      <label className="text-sm font-medium">Username<input name="smtpUser" required value={undefined} defaultValue={existing?.smtpUser ?? ""} placeholder={email || "usually the full address"} className={input} /></label>
      <label className="text-sm font-medium">{existing ? "New password (leave blank to keep)" : "Password or app password"}<input name="password" type="password" autoComplete="new-password" className={input} /></label>
      <label className="text-sm font-medium">Inbox server for replies (optional)<input key={`i${key}`} name="imapHost" defaultValue={existing?.imapHost ?? p.imapHost} className={input} /></label>
      <label className="text-sm font-medium">Daily sending limit<input name="dailyLimit" type="number" defaultValue={existing?.dailyLimit ?? 500} className={input} /></label>
      <label className="md:col-span-2 text-sm font-medium">Signature (plain HTML allowed)<textarea name="signatureHtml" rows={3} defaultValue={existing?.signatureHtml ?? ""} className={input} /></label>
      <div className="md:col-span-2"><button className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs text-white">{existing ? "Save and test connection" : "Add mailbox and test connection"}</button></div>
    </ActionForm>
  );
}
