"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ACTIONS, OPERATORS, SCHEDULE_TRIGGER, TRIGGERS, summarise, type Condition, type Step } from "@/modules/automations/engine/catalogue";
import { saveAutomation, testOnPastEvent } from "@/modules/automations/services/actions";

type Options = { templates: Array<{ id: string; name: string; category: string }>; surveys: Array<{ id: string; name: string }>; accounts: Array<{ id: string; label: string }>; audiences: Array<{ id: string; name: string }> };
type Initial = { id: string; name: string; description: string; triggerType: string; triggerEvent: string | null; conditions: Condition[]; steps: Step[]; schedule: { intervalHours?: number } } | null;

const input = "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm";
const card = "rounded-2xl border border-slate-200 bg-white p-5";

export function Builder({ initial, options }: { initial: Initial; options: Options }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [triggerType, setTriggerType] = useState(initial?.triggerType ?? "EVENT");
  const [triggerEvent, setTriggerEvent] = useState(initial?.triggerEvent ?? "");
  const [intervalHours, setIntervalHours] = useState(initial?.schedule?.intervalHours ?? 24);
  const [conditions, setConditions] = useState<Condition[]>(initial?.conditions ?? []);
  const [steps, setSteps] = useState<Step[]>(initial?.steps ?? []);
  const [testResult, setTestResult] = useState<string>("");

  const trigger = TRIGGERS.find((t) => t.event === triggerEvent);
  const fields = trigger?.fields ?? [];
  const summary = useMemo(() => summarise(triggerType === "SCHEDULE" ? SCHEDULE_TRIGGER.event : triggerEvent || null, triggerType, conditions, steps, { every: `${intervalHours} hours` }), [triggerType, triggerEvent, conditions, steps, intervalHours]);

  const addCondition = () => setConditions((c) => [...c, { field: fields[0]?.path ?? "", op: "eq", value: "" }]);
  const addStep = (type: string) => setSteps((s) => [...s, { id: Math.random().toString(36).slice(2, 9), type, params: {} }]);

  const save = () => start(async () => {
    setError("");
    const f = new FormData();
    if (initial?.id) f.set("id", initial.id);
    f.set("name", name); f.set("description", description); f.set("triggerType", triggerType);
    if (triggerType === "EVENT") f.set("triggerEvent", triggerEvent);
    if (triggerType === "SCHEDULE") f.set("intervalHours", String(intervalHours));
    f.set("conditions", JSON.stringify(conditions)); f.set("steps", JSON.stringify(steps));
    try { await saveAutomation(f); if (initial?.id) router.refresh(); }
    catch (e) {
      const digest = typeof e === "object" && e && "digest" in e ? String((e as { digest?: unknown }).digest) : "";
      if (digest.startsWith("NEXT_REDIRECT")) throw e;
      setError(e instanceof Error ? e.message : "Could not save.");
    }
  });

  const test = () => { if (!initial?.id) { setTestResult("Save this automation first, then you can test it."); return; } start(async () => {
    const f = new FormData(); f.set("id", initial.id);
    const r = await testOnPastEvent(f) as { runId: string | null };
    setTestResult(r.runId ? "Tested on the most recent matching event — see Activity for the step-by-step result." : "No matching event has happened yet to test against.");
  }); };

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium">Name<input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Order confirmed → invoice" /></label>
        <label className="mt-3 block text-sm font-medium">What this does (optional)<input className={input} value={description} onChange={(e) => setDescription(e.target.value)} /></label>
      </div>

      <div className={card}>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">When</p>
        <div className="flex flex-wrap gap-2">
          {[["EVENT", "Something happens"], ["SCHEDULE", "On a schedule"], ["MANUAL", "Only when I run it"]].map(([v, l]) => (
            <button key={v} type="button" onClick={() => setTriggerType(v)} className={`rounded-lg px-3 py-1.5 text-sm ${triggerType === v ? "bg-blue-600 text-white" : "border border-slate-200"}`}>{l}</button>
          ))}
        </div>
        {triggerType === "EVENT" && (
          <select className={`${input} mt-3`} value={triggerEvent} onChange={(e) => { setTriggerEvent(e.target.value); setConditions([]); }}>
            <option value="">Choose what starts this…</option>
            {Object.entries(TRIGGERS.reduce<Record<string, typeof TRIGGERS>>((g, t) => ((g[t.group] ??= []).push(t), g), {})).map(([group, items]) => (
              <optgroup key={group} label={group}>{items.map((t) => <option key={t.event} value={t.event}>{t.label}</option>)}</optgroup>
            ))}
          </select>
        )}
        {triggerType === "SCHEDULE" && <label className="mt-3 block text-sm">Every <input type="number" min={1} className="mx-2 w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm" value={intervalHours} onChange={(e) => setIntervalHours(Number(e.target.value))} /> hours</label>}
      </div>

      {triggerType === "EVENT" && !!fields.length && (
        <div className={card}>
          <div className="mb-3 flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">If (optional)</p><button type="button" onClick={addCondition} className="text-xs text-blue-700">+ Add condition</button></div>
          <div className="space-y-2">
            {conditions.map((c, i) => {
              const field = fields.find((f) => f.path === c.field);
              const ops = OPERATORS.filter((o) => o.types.includes(field?.type ?? "text"));
              return (
                <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
                  <select className="rounded-lg border border-slate-200 px-2 py-1.5" value={c.field} onChange={(e) => setConditions((cs) => cs.map((x, xi) => (xi === i ? { ...x, field: e.target.value } : x)))}>{fields.map((f) => <option key={f.path} value={f.path}>{f.label}</option>)}</select>
                  <select className="rounded-lg border border-slate-200 px-2 py-1.5" value={c.op} onChange={(e) => setConditions((cs) => cs.map((x, xi) => (xi === i ? { ...x, op: e.target.value } : x)))}>{ops.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}</select>
                  {!["empty", "notEmpty"].includes(c.op) && (field?.type === "enum" ? (
                    <select className="rounded-lg border border-slate-200 px-2 py-1.5" value={c.value ?? ""} onChange={(e) => setConditions((cs) => cs.map((x, xi) => (xi === i ? { ...x, value: e.target.value } : x)))}>{field.options?.map((o) => <option key={o} value={o}>{o}</option>)}</select>
                  ) : (
                    <input className="rounded-lg border border-slate-200 px-2 py-1.5" value={c.value ?? ""} onChange={(e) => setConditions((cs) => cs.map((x, xi) => (xi === i ? { ...x, value: e.target.value } : x)))} />
                  ))}
                  <button type="button" className="text-xs text-red-700" onClick={() => setConditions((cs) => cs.filter((_, xi) => xi !== i))}>Remove</button>
                </div>
              );
            })}
            {!conditions.length && <p className="text-sm text-slate-400">Runs every time, no extra conditions.</p>}
          </div>
        </div>
      )}

      <div className={card}>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Then</p>
        <div className="space-y-3">
          {steps.map((s) => <StepCard key={s.id} step={s} onChange={(next) => setSteps((ss) => ss.map((x) => (x.id === s.id ? next : x)))} onRemove={() => setSteps((ss) => ss.filter((x) => x.id !== s.id))} options={options} />)}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(ACTIONS.reduce<Record<string, typeof ACTIONS>>((g, a) => ((g[a.group] ??= []).push(a), g), {})).map(([group, items]) => (
            <div key={group} className="flex flex-wrap gap-1.5">{items.map((a) => <button key={a.type} type="button" onClick={() => addStep(a.type)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs hover:bg-slate-50">+ {a.label}</button>)}</div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-slate-50 p-4 text-sm"><span className="font-semibold">In plain English: </span>{summary}</div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {testResult && <p className="text-sm text-slate-600">{testResult}</p>}
      <div className="flex gap-3">
        <button type="button" disabled={pending || !name || !steps.length} onClick={save} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">{pending ? "Saving…" : "Save automation"}</button>
        {initial?.id && <button type="button" disabled={pending} onClick={test} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm">Test on a past event</button>}
      </div>
    </div>
  );
}

function StepCard({ step, onChange, onRemove, options }: { step: Step; onChange: (s: Step) => void; onRemove: () => void; options: Options }) {
  const def = ACTIONS.find((a) => a.type === step.type);
  if (!def) return null;
  const set = (name: string, value: string) => onChange({ ...step, params: { ...step.params, [name]: value } });
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="mb-2 flex items-center justify-between"><p className="text-sm font-medium">{def.label}</p><button type="button" className="text-xs text-red-700" onClick={onRemove}>Remove</button></div>
      <div className="grid gap-2 md:grid-cols-2">
        {def.fields.map((f) => {
          const value = step.params[f.name] ?? "";
          if (f.kind === "recipient") return <select key={f.name} className={input} value={value} onChange={(e) => set(f.name, e.target.value)}><option value="contact">The customer&apos;s contact</option><option value="owner">The record owner</option><option value="rule_owner">Me</option><option value="">Choose…</option></select>;
          if (f.kind === "template") return <select key={f.name} className={input} value={value} onChange={(e) => set(f.name, e.target.value)}><option value="">{f.optional ? "Default message" : "Choose a template…"}</option>{options.templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>;
          if (f.kind === "survey") return <span key={f.name} className="block"><select className={input} value={value} onChange={(e) => set(f.name, e.target.value)}><option value="">Choose a survey…</option>{options.surveys.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select><a href="/csat/surveys" target="_blank" rel="noopener" className="mt-1 block text-xs text-blue-600">{options.surveys.length ? "Create or edit surveys →" : "No surveys yet. Create one from a template →"}</a></span>;
          if (f.kind === "account") return <select key={f.name} className={input} value={value} onChange={(e) => set(f.name, e.target.value)}><option value="">Default sender</option>{options.accounts.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</select>;
          if (f.kind === "audience") return <select key={f.name} className={input} value={value} onChange={(e) => set(f.name, e.target.value)}><option value="">Choose an audience…</option>{options.audiences.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>;
          if (f.kind === "select") return <select key={f.name} className={input} value={value} onChange={(e) => set(f.name, e.target.value)}>{f.options?.map((o) => <option key={o} value={o}>{o}</option>)}</select>;
          if (f.kind === "textarea") return <textarea key={f.name} className={`${input} md:col-span-2`} rows={2} placeholder={f.label} value={value} onChange={(e) => set(f.name, e.target.value)} />;
          return <input key={f.name} type={f.kind === "number" ? "number" : "text"} className={input} placeholder={f.hint ?? f.label} value={value} onChange={(e) => set(f.name, e.target.value)} />;
        })}
      </div>
    </div>
  );
}
