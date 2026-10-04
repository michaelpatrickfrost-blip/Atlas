"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RESOURCE_TYPES, resourceLabel } from "@/modules/manufacturing/domain/plant";
import { retirePlantRecord, saveMachine, saveWorkCentre } from "@/modules/manufacturing/services/plant";

const field = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm";

type Machine = { id: string; name: string; type: string; nominalUnitsPerHour: number | null; active: boolean; products: Array<{ id: string; code: string; name: string; steps: string[] }> };
type Centre = { id: string; code: string; name: string; description: string | null; active: boolean; machines: Machine[]; products: Array<{ id: string; code: string; name: string; steps: string[] }> };

export function PlantEditor({ centres, canEdit }: { centres: Centre[]; canEdit: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [centre, setCentre] = useState({ id: "", code: "", name: "", description: "" });
  const [machine, setMachine] = useState({ id: "", workCentreId: centres.find((item) => item.active)?.id ?? "", name: "", type: "MACHINE", rate: "" });
  const run = (work: () => Promise<void>, done: string) => start(async () => {
    setMessage("");
    try { await work(); setFailed(false); setMessage(done); router.refresh(); }
    catch (error) { setFailed(true); setMessage(error instanceof Error ? error.message : "Could not save."); }
  });
  const productLinks = (rows: Centre["products"]) => rows.length ? <div className="mt-2 flex flex-wrap gap-2">{rows.map((product) => <Link key={product.id} href={`/products/${product.id}`} className="rounded-full border border-slate-200 px-3 py-1 text-xs hover:bg-slate-50">{product.name}<span className="ml-1 text-slate-400">{product.steps.join(", ")}</span></Link>)}</div> : null;
  return <div className="space-y-6">
    <div className="space-y-4">
      {centres.map((item) => <section key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="text-xs text-slate-400">{item.code}{item.active ? "" : " · retired"}</p><h3 className="text-lg font-semibold">{item.name}</h3>{item.description && <p className="mt-1 text-sm text-slate-500">{item.description}</p>}</div>
          {canEdit && item.active && <button type="button" className="text-xs text-slate-500" onClick={() => run(() => retirePlantRecord("centre", item.id), `${item.name} retired. Products keep the name of the step.`)}>Retire</button>}
        </div>
        {productLinks(item.products)}
        <ul className="mt-4 divide-y divide-slate-100">
          {item.machines.map((row) => <li key={row.id} className="py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2"><p className="text-sm font-medium">{row.name}{row.active ? "" : " · retired"}</p><p className="text-xs text-slate-500">{resourceLabel(row.type)}{row.nominalUnitsPerHour ? ` · ${row.nominalUnitsPerHour} per hour` : ""}</p></div>
            {productLinks(row.products)}
            {canEdit && row.active && <button type="button" className="mt-2 text-xs text-slate-500" onClick={() => run(() => retirePlantRecord("machine", row.id), `${row.name} retired.`)}>Retire machine</button>}
          </li>)}
          {!item.machines.length && <li className="py-3 text-sm text-slate-500">No machines in this work centre yet.</li>}
        </ul>
      </section>)}
      {!centres.length && <p className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-sm text-slate-500">Add the work centres and machines this plant uses. A product step then chooses one, and a released production order runs on that machine.</p>}
    </div>
    {canEdit && <div className="grid gap-4 lg:grid-cols-2">
      <form className="rounded-2xl border border-slate-200 bg-white p-5" onSubmit={(event) => { event.preventDefault(); run(async () => { await saveWorkCentre(centre); setCentre({ id: "", code: "", name: "", description: "" }); }, "Work centre saved."); }}>
        <h3 className="text-sm font-semibold">Work centre</h3>
        <p className="mt-1 text-xs text-slate-500">An area of the plant, such as forming, firing or packing.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-slate-500">Code<input className={field} value={centre.code} onChange={(event) => setCentre({ ...centre, code: event.target.value })} /></label>
          <label className="text-xs text-slate-500">Name<input className={field} value={centre.name} onChange={(event) => setCentre({ ...centre, name: event.target.value })} /></label>
          <label className="text-xs text-slate-500 sm:col-span-2">Description<input className={field} value={centre.description} onChange={(event) => setCentre({ ...centre, description: event.target.value })} /></label>
        </div>
        <Button type="submit" variant="primary" className="mt-4" disabled={pending}>Save work centre</Button>
      </form>
      <form className="rounded-2xl border border-slate-200 bg-white p-5" onSubmit={(event) => { event.preventDefault(); run(async () => { await saveMachine({ workCentreId: machine.workCentreId, name: machine.name, type: machine.type, nominalUnitsPerHour: machine.rate.trim() ? Number(machine.rate) : null }); setMachine({ ...machine, name: "", rate: "" }); }, "Machine saved. Choose it on a product step."); }}>
        <h3 className="text-sm font-semibold">Machine</h3>
        <p className="mt-1 text-xs text-slate-500">A press, line, kiln, bench or team inside a work centre. Products choose it on the step that uses it.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-slate-500 sm:col-span-2">Work centre<select className={field} value={machine.workCentreId} onChange={(event) => setMachine({ ...machine, workCentreId: event.target.value })}><option value="">Choose</option>{centres.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="text-xs text-slate-500">Name<input className={field} value={machine.name} onChange={(event) => setMachine({ ...machine, name: event.target.value })} /></label>
          <label className="text-xs text-slate-500">Kind<select className={field} value={machine.type} onChange={(event) => setMachine({ ...machine, type: event.target.value })}>{RESOURCE_TYPES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <label className="text-xs text-slate-500 sm:col-span-2">Nominal units per hour<input className={field} inputMode="decimal" value={machine.rate} placeholder="Optional" onChange={(event) => setMachine({ ...machine, rate: event.target.value })} /></label>
        </div>
        <Button type="submit" variant="primary" className="mt-4" disabled={pending || !centres.some((item) => item.active)}>Save machine</Button>
      </form>
    </div>}
    <p role={failed ? "alert" : "status"} className={`text-xs ${failed ? "text-red-600" : "text-slate-500"}`}>{message}</p>
  </div>;
}
