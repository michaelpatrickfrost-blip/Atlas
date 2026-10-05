"use client";
import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CAMPAIGN_TYPES } from "../domain/policy";
import { CAMPAIGN_CHANNELS, CAMPAIGN_TEMPLATES, launchPlan } from "../domain/campaign";
import { createCampaignAction } from "../services/campaign-actions";
import type { BriefOptions } from "./campaign-brief";
import { words } from "./format";

const field = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm";
const STEPS = [
  { id: "start", label: "Starting point", help: "Pick the kind of campaign. It fills in a sensible first draft you can change." },
  { id: "basics", label: "The basics", help: "Name it, say who owns it and when it runs." },
  { id: "why", label: "Goal", help: "What it has to achieve, and the numbers you will judge it by." },
  { id: "who", label: "Audience", help: "Who you are talking to and what they care about." },
  { id: "what", label: "Message and offer", help: "What you are saying and what you want them to do." },
  { id: "where", label: "Channels and budget", help: "Where it runs and how the money is shared out." },
  { id: "plan", label: "Launch plan", help: "A dated plan worked back from the start date." },
  { id: "review", label: "Check and create", help: "Read it back before it is created." },
] as const;
type Template = (typeof CAMPAIGN_TEMPLATES)[number];
type Snap = Record<string, string>;
const day = (date: Date | null) => (date ? date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "No date");
const iso = (date: Date) => date.toISOString().slice(0, 10);
const amount = (value: string) => { const number = Number(String(value).replace(/,/g, "")); return Number.isFinite(number) && number > 0 ? number : 0; };
const gbp = (value: number, currency: string) => { try { return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "GBP", maximumFractionDigits: 0 }).format(value); } catch { return value.toFixed(0); } };

function Area({ name, label, value, hint, rows = 3 }: { name: string; label: string; value?: string; hint?: string; rows?: number }) {
  return <label className="block text-xs font-medium">{label}<textarea name={name} rows={rows} maxLength={5000} defaultValue={value ?? ""} placeholder={hint} className={field} /></label>;
}

/** Step-by-step campaign builder: starting point, brief, channels, budget split and a dated launch plan, created in one go. */
export function CampaignBuilder({ options }: { options: BriefOptions }) {
  const form = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [template, setTemplate] = useState<Template | null>(null);
  const [channels, setChannels] = useState<string[]>([]);
  const [splits, setSplits] = useState<Record<string, string>>({});
  const [snap, setSnap] = useState<Snap>({ currency: "GBP" });
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const read = () => { if (!form.current) return; const next: Snap = {}; new FormData(form.current).forEach((value, key) => { if (typeof value === "string" && key !== "channels") next[key] = value; }); setSnap(next); };
  const dates = useMemo(() => { const begin = new Date(); begin.setUTCHours(0, 0, 0, 0); begin.setUTCDate(begin.getUTCDate() + 21); return (weeks: number) => ({ startAt: iso(begin), endAt: iso(new Date(begin.getTime() + weeks * 7 * 86_400_000)) }); }, []);
  const choose = (next: Template | null) => { setTemplate(next); setChannels(next ? [...next.channels] : []); setSplits({}); setStep(1); setTimeout(read, 0); };
  const toggle = (channel: string) => setChannels((current) => current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel]);
  const budget = amount(snap.budget ?? ""), currency = (snap.currency || "GBP").toUpperCase();
  const allocated = channels.reduce((total, channel) => total + amount(splits[channel] ?? ""), 0);
  const even = () => { if (!budget || !channels.length) return; const share = Math.floor((budget / channels.length) * 100) / 100; setSplits(Object.fromEntries(channels.map((channel) => [channel, share.toFixed(2)]))); };
  const startAt = snap.startAt ? new Date(`${snap.startAt}T00:00:00Z`) : null, endAt = snap.endAt ? new Date(`${snap.endAt}T00:00:00Z`) : null;
  const plan = useMemo(() => launchPlan(channels, startAt && !Number.isNaN(startAt.getTime()) ? startAt : null, endAt && !Number.isNaN(endAt.getTime()) ? endAt : null), [channels, snap.startAt, snap.endAt]); // eslint-disable-line react-hooks/exhaustive-deps
  const seed = snap.seedPlan === "on";
  const done: Record<string, boolean> = { start: step > 0, basics: !!snap.name?.trim() && !!snap.startAt && !!snap.endAt, why: !!snap.objective?.trim(), who: !!snap.audienceId || !!snap.targetMarket?.trim(), what: !!snap.message?.trim() && !!snap.cta?.trim(), where: channels.length > 0 && budget > 0, plan: seed && channels.length > 0, review: false };
  const ready = Math.round((["basics", "why", "who", "what", "where", "plan"].filter((id) => done[id]).length / 6) * 100);
  const leads = amount(snap.targetLeads ?? "");
  const submit = (data: FormData) => {
    if (!String(data.get("name") ?? "").trim()) { setStep(1); setError("Give the campaign a name."); return; }
    setError("");
    start(async () => { try { await createCampaignAction(data); } catch (problem) { if (typeof (problem as { digest?: string })?.digest === "string" && (problem as { digest: string }).digest.startsWith("NEXT_REDIRECT")) throw problem; setError(problem instanceof Error ? problem.message : "The campaign could not be created. Try again."); } });
  };
  const t = template, initial = t ? dates(t.weeks) : { startAt: "", endAt: "" };
  const panel = (id: string) => STEPS[step].id !== id;
  return <form ref={form} action={submit} onInput={read} onChange={read} className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_300px]">
    <nav className="space-y-1 lg:sticky lg:top-4 lg:self-start">{STEPS.map((item, index) => <button key={item.id} type="button" onClick={() => setStep(index)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${index === step ? "bg-blue-50 font-semibold text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}><span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${done[item.id] ? "bg-emerald-500 text-white" : index === step ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}`}>{done[item.id] ? "✓" : index + 1}</span>{item.label}</button>)}</nav>

    <div className="min-w-0">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-xs font-medium text-slate-500">Step {step + 1} of {STEPS.length}</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">{STEPS[step].label}</h2>
        <p className="mt-1 text-sm text-slate-500">{STEPS[step].help}</p>

        <div className={panel("start") ? "hidden" : "mt-5 grid gap-3 sm:grid-cols-2"}>
          {CAMPAIGN_TEMPLATES.map((item) => <button key={item.id} type="button" onClick={() => choose(item)} className={`rounded-2xl border p-4 text-left hover:border-blue-400 ${template?.id === item.id ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}><p className="font-semibold">{item.label}</p><p className="mt-1 text-sm text-slate-500">{item.blurb}</p><p className="mt-3 text-xs text-slate-400">{item.weeks} weeks · {item.channels.join(", ")}</p></button>)}
          <button type="button" onClick={() => choose(null)} className="rounded-2xl border border-dashed border-slate-300 p-4 text-left hover:border-blue-400"><p className="font-semibold">Blank campaign</p><p className="mt-1 text-sm text-slate-500">Start with an empty brief and fill in every part yourself.</p></button>
        </div>

        {/* Every step stays in the form, so nothing typed is lost when moving between steps. Choosing a starting point resets the draft. */}
        <div key={template?.id ?? "blank"}>
          <div hidden={panel("basics")} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-medium sm:col-span-2">Campaign name<input name="name" maxLength={250} defaultValue="" placeholder={t ? `${t.label}: ` : "Spring drainage range launch"} className={field} /></label>
              <label className="block text-xs font-medium">Type<select name="type" defaultValue={t?.type ?? "LEAD_GENERATION"} className={field}>{CAMPAIGN_TYPES.map((type) => <option key={type} value={type}>{words(type)}</option>)}</select></label>
              <label className="block text-xs font-medium">Code (optional)<input name="code" maxLength={50} placeholder="Made for you if left blank" className={field} /></label>
              <label className="block text-xs font-medium">Starts<input name="startAt" type="date" defaultValue={initial.startAt} className={field} /></label>
              <label className="block text-xs font-medium">Ends<input name="endAt" type="date" defaultValue={initial.endAt} className={field} /></label>
              <label className="block text-xs font-medium">Owner<select name="ownerUserId" defaultValue="" className={field}><option value="">Me</option>{options.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
              <label className="block text-xs font-medium">Team<input name="teamName" maxLength={150} placeholder="Marketing, with Sales north" className={field} /></label>
              <label className="block text-xs font-medium">Part of a programme<select name="parentId" defaultValue="" className={field}><option value="">Stands alone</option>{options.programmes.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
              <label className="flex items-center gap-2 self-end pb-2.5 text-sm"><input type="checkbox" name="isProgramme" className="size-4" />This is a programme other campaigns sit under</label>
            </div>
            <Area name="description" label="Summary" value={t?.blurb} hint="One paragraph anyone in the business could read and understand." />
          </div>

          <div hidden={panel("why")} className="mt-5 space-y-4">
            <Area name="objective" label="Objective" value={t?.objective} hint="What this campaign must achieve, in one or two sentences." />
            <Area name="businessGoal" label="Business goal it supports" hint="Grow the contractor channel by 15% this year." rows={2} />
            <label className="block text-xs font-medium">Headline goal<input name="goal" maxLength={300} defaultValue={t?.goal} placeholder="120 qualified leads by the end of June" className={field} /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-medium">Target leads<input name="targetLeads" type="number" min={0} className={field} /></label>
              <label className="block text-xs font-medium">Target new customers<input name="targetCustomers" type="number" min={0} className={field} /></label>
              <label className="block text-xs font-medium">Target pipeline value<input name="targetPipeline" inputMode="decimal" placeholder="0.00" className={field} /></label>
              <label className="block text-xs font-medium">Target revenue<input name="targetRevenue" inputMode="decimal" placeholder="0.00" className={field} /></label>
            </div>
          </div>

          <div hidden={panel("who")} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-medium">Audience<select name="audienceId" defaultValue="" className={field}><option value="">Not chosen yet</option>{options.audiences.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select><span className="mt-1 block font-normal text-slate-500">Needed before a campaign can be scheduled. <Link href="/marketing/audiences" target="_blank" className="text-blue-600">Build an audience</Link></span></label>
              <label className="block text-xs font-medium">Product or range<select name="productId" defaultValue="" className={field}><option value="">Not tied to one product</option>{options.products.map((row) => <option key={row.id} value={row.id}>{row.code} · {row.name}</option>)}</select></label>
              <label className="block text-xs font-medium">Region<input name="region" maxLength={150} placeholder="North West, UK" className={field} /></label>
              <label className="block text-xs font-medium">Language<input name="language" maxLength={40} defaultValue="en" className={field} /></label>
            </div>
            <Area name="targetMarket" label="Target market" hint="Groundworks contractors with 10 to 50 staff buying through merchants." rows={2} />
            <Area name="persona" label="The person we are talking to" hint="Contracts manager. Cares about delivery on the day and not being let down on site." rows={2} />
          </div>

          <div hidden={panel("what")} className="mt-5 space-y-4">
            <Area name="positioning" label="Positioning" hint="Why us, against the alternatives." rows={2} />
            <Area name="message" label="Key message" value={t?.message} hint="The one thing they should remember." rows={2} />
            <Area name="offer" label="Offer" value={t?.offer} hint="Free site survey, or 10% off first order before 30 June." rows={2} />
            <label className="block text-xs font-medium">Call to action<input name="cta" maxLength={300} defaultValue={t?.cta} placeholder="Book a site survey" className={field} /></label>
            <Area name="risks" label="Risks" hint="Stock of the new range may not land before launch." rows={2} />
            <Area name="dependencies" label="Depends on" hint="Price list signed off; product photography; sales team briefed." rows={2} />
          </div>

          <div hidden={panel("where")} className="mt-5 space-y-5">
            <div><p className="text-xs font-medium">Channels</p><div className="mt-2 grid gap-2 sm:grid-cols-3">{CAMPAIGN_CHANNELS.map((channel) => <label key={channel} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${channels.includes(channel) ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}><input type="checkbox" name="channels" value={channel} checked={channels.includes(channel)} onChange={() => toggle(channel)} className="size-4" />{channel}</label>)}</div></div>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-xs font-medium">Total budget<input name="budget" inputMode="decimal" placeholder="0.00" className={field} /></label>
              <label className="block text-xs font-medium">Currency<input name="currency" maxLength={3} defaultValue="GBP" className={field} /></label>
              <label className="block text-xs font-medium">Tracking name for links<input name="utmCampaign" maxLength={150} placeholder="spring-drainage-launch" className={field} /></label>
            </div>
            {channels.length > 0 && <div className="rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3"><p className="text-sm font-semibold">Share the budget between channels</p><button type="button" onClick={even} disabled={!budget} className="text-sm font-medium text-blue-600 disabled:text-slate-300">Split evenly</button></div>
              {channels.map((channel) => { const value = amount(splits[channel] ?? ""); return <div key={channel} className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-sm last:border-0"><span className="w-32 shrink-0">{channel}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-500" style={{ width: `${budget ? Math.min(100, (value / budget) * 100) : 0}%` }} /></div><input name={`split:${channel}`} inputMode="decimal" value={splits[channel] ?? ""} onChange={(event) => setSplits((current) => ({ ...current, [channel]: event.target.value }))} placeholder="0.00" className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-right text-sm tabular-nums" /></div>; })}
              <div className={`flex justify-between px-4 py-3 text-sm font-medium ${allocated > budget && budget ? "text-red-700" : "text-slate-600"}`}><span>{gbp(allocated, currency)} shared out of {gbp(budget, currency)}</span><span>{budget ? allocated > budget ? `${gbp(allocated - budget, currency)} over` : `${gbp(budget - allocated, currency)} left` : "Set the total budget first"}</span></div>
            </div>}
          </div>

          <div hidden={panel("plan")} className="mt-5 space-y-4">
            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 text-sm"><input type="checkbox" name="seedPlan" defaultChecked className="mt-0.5 size-4" /><span><span className="font-semibold">Build the launch plan for me</span><span className="mt-0.5 block text-slate-500">Adds these activities to the campaign with dates worked back from the start date. Every one can be changed, reassigned or removed afterwards.</span></span></label>
            {!channels.length && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Choose channels in the previous step to get activities for each one.</p>}
            <div className={`overflow-hidden rounded-2xl border border-slate-200 ${seed ? "" : "opacity-40"}`}><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-xs text-slate-500"><tr><th className="px-4 py-2 font-medium">Phase</th><th className="px-4 py-2 font-medium">Activity</th><th className="px-4 py-2 font-medium">Channel</th><th className="px-4 py-2 font-medium">When</th></tr></thead><tbody>{plan.map((row, index) => <tr key={index} className="border-t border-slate-100"><td className="px-4 py-2 text-slate-500">{row.phase}</td><td className="px-4 py-2 font-medium">{row.name}</td><td className="px-4 py-2 text-slate-500">{row.channel || "All"}</td><td className="whitespace-nowrap px-4 py-2 tabular-nums text-slate-500">{row.startAt ? `${day(row.startAt)}${row.endAt && row.endAt.getTime() !== row.startAt.getTime() ? ` – ${day(row.endAt)}` : ""}` : "Set dates"}</td></tr>)}</tbody></table></div>
          </div>
        </div>

        <div hidden={panel("review")} className="mt-5 space-y-3 text-sm">
          {[["Campaign", snap.name || "Not named yet"], ["Type", words(snap.type ?? "")], ["Runs", snap.startAt && snap.endAt ? `${day(startAt)} – ${day(endAt)}` : "Dates not set"], ["Objective", snap.objective || "Not written"], ["Audience", options.audiences.find((row) => row.id === snap.audienceId)?.name ?? (snap.targetMarket || "Not chosen")], ["Key message", snap.message || "Not written"], ["Offer", snap.offer || "None"], ["Call to action", snap.cta || "Not written"], ["Channels", channels.join(", ") || "None chosen"], ["Budget", budget ? `${gbp(budget, currency)} · ${gbp(allocated, currency)} shared between channels` : "Not set"], ["Launch plan", seed ? `${plan.length} activities will be added` : "Not adding activities"]].map(([label, value]) => <div key={label} className="grid gap-1 border-b border-slate-100 pb-3 sm:grid-cols-[150px_1fr]"><span className="text-slate-500">{label}</span><span className="whitespace-pre-line font-medium">{value}</span></div>)}
          <p className="text-slate-500">The campaign is created as a draft. Nothing is sent or published until you schedule it.</p>
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Button type="button" variant="secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
        <div className="flex gap-2">
          {step > 0 && step < STEPS.length - 1 && <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Creating…" : "Create now"}</Button>}
          {step < STEPS.length - 1 ? <Button type="button" variant="primary" onClick={() => { if (step === 0 && !template) choose(null); else setStep(step + 1); }}>Next</Button> : <Button type="submit" variant="primary" disabled={pending}>{pending ? "Creating…" : "Create campaign"}</Button>}
        </div>
      </div>
    </div>

    <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-medium text-slate-500">Campaign at a glance</p>
        <p className="mt-1 text-lg font-semibold leading-snug">{snap.name || "Untitled campaign"}</p>
        <p className="mt-1 text-sm text-slate-500">{words(snap.type ?? t?.type ?? "")}{snap.startAt && snap.endAt ? ` · ${day(startAt)} – ${day(endAt)}` : ""}</p>
        <div className="mt-4"><div className="flex justify-between text-xs text-slate-500"><span>Brief complete</span><span>{ready}%</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${ready === 100 ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${ready}%` }} /></div></div>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-3"><dt className="text-slate-500">Budget</dt><dd className="font-medium tabular-nums">{budget ? gbp(budget, currency) : "—"}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-slate-500">Target leads</dt><dd className="font-medium tabular-nums">{leads || "—"}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-slate-500">Cost per lead</dt><dd className="font-medium tabular-nums">{budget && leads ? gbp(budget / leads, currency) : "—"}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-slate-500">Return on target</dt><dd className="font-medium tabular-nums">{budget && amount(snap.targetRevenue ?? "") ? `${(amount(snap.targetRevenue ?? "") / budget).toFixed(1)}× budget` : "—"}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-slate-500">Activities</dt><dd className="font-medium tabular-nums">{seed ? plan.length : 0}</dd></div>
        </dl>
        {channels.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{channels.map((channel) => <span key={channel} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{channel}</span>)}</div>}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm"><p className="font-semibold">Still to do</p><ul className="mt-2 space-y-1.5">{STEPS.slice(1, 7).filter((item) => !done[item.id]).map((item) => <li key={item.id}><button type="button" onClick={() => setStep(STEPS.findIndex((row) => row.id === item.id))} className="text-left text-blue-600">{item.label}</button></li>)}{STEPS.slice(1, 7).every((item) => done[item.id]) && <li className="text-emerald-700">Everything is filled in.</li>}</ul></div>
    </aside>
  </form>;
}
