"use client";
import { useState } from "react";
import { Field, fieldClass } from "./record-form";

type Row = { goal: string; measure: string; support: string; by: string };
const empty = (): Row => ({ goal: "", measure: "", support: "", by: "" });

export function ObjectiveFields({ initial }: { initial?: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial?.length ? initial : [empty()]);
  const update = (index: number, key: keyof Row, value: string) => setRows((current) => current.map((row, i) => i === index ? { ...row, [key]: value } : row));
  return <div className="space-y-4 sm:col-span-2">{rows.map((row, index) => <fieldset key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><legend className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Objective {index + 1}</legend><div className="grid gap-4 sm:grid-cols-2"><Field label="What needs to change"><input name="goal" value={row.goal} onChange={(event) => update(index, "goal", event.target.value)} maxLength={300} className={fieldClass} required={index === 0} /></Field><Field label="How we will know"><input name="measure" value={row.measure} onChange={(event) => update(index, "measure", event.target.value)} maxLength={300} className={fieldClass} /></Field><Field label="Support for this objective"><input name="supportItem" value={row.support} onChange={(event) => update(index, "support", event.target.value)} maxLength={300} className={fieldClass} /></Field><Field label="Target date"><input name="objectiveBy" type="date" value={row.by} onChange={(event) => update(index, "by", event.target.value)} className={fieldClass} /></Field></div>{rows.length > 1 && <button type="button" className="mt-3 text-xs text-slate-500" onClick={() => setRows((current) => current.filter((_, i) => i !== index))}>Remove objective</button>}</fieldset>)}{rows.length < 8 && <button type="button" className="text-sm font-medium text-blue-600" onClick={() => setRows((current) => [...current, empty()])}>Add another objective</button>}</div>;
}
