"use client";
import { useState } from "react";
import { ActionForm } from "@/components/ui/action-form";
import { SOCIAL_PLATFORMS } from "@/core/email/presets";
import { saveSocialAccount } from "../actions";

const input = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm";
export function SocialForm() {
  const [key, setKey] = useState("bluesky");
  const p = SOCIAL_PLATFORMS.find((x) => x.key === key)!;
  return (
    <ActionForm action={saveSocialAccount} className="grid gap-3 md:grid-cols-2">
      <label className="text-sm font-medium">Platform<select name="platform" value={key} onChange={(e) => setKey(e.target.value)} className={input}>{SOCIAL_PLATFORMS.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}</select></label>
      <label className="text-sm font-medium">Name<input name="label" placeholder={p.label} className={input} /></label>
      {p.fields.map((f) => <label key={`${key}-${f.name}`} className="text-sm font-medium">{f.label}<input name={f.name} required type={f.secret ? "password" : "text"} placeholder={f.hint} autoComplete="off" className={input} /></label>)}
      <p className="md:col-span-2 text-xs text-slate-500">{p.note}</p>
      <div className="md:col-span-2"><button className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs text-white">Add account</button></div>
    </ActionForm>
  );
}
