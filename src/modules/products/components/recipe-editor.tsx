"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { COMPONENT_GROUPS } from "@/modules/products/domain/make";
import { saveProductRecipe } from "@/modules/products/services/make";

type Line = { componentId: string; quantityPerUnit: string; scrapPercent: string; notes: string };
type Step = { name: string; workCentreId: string; resourceId: string; setupMinutes: string; runMinutesPerUnit: string; crewSize: string; machineRate: string; labourRate: string; overheadRate: string; logistics: string; machineIncludesLabour: boolean; machineIncludesOverhead: boolean };
type Choice = { id: string; code: string; name: string; unit: string; categoryName: string; supply: string; label: string; costMinor?: number; stock?: number };
type PlantCentre = { id: string; name: string; active?: boolean; machines: Array<{ id: string; name: string; type: string; active?: boolean }> };
const policies = [
  { id: "BUY", title: "Bought in", detail: "You purchase it. Cost is the standard price. It has no bill and no machine." },
  { id: "MAKE", title: "Made here", detail: "A product built from materials, work in progress and steps on your machines." },
  { id: "WIP", title: "Work in progress", detail: "An intermediate you make, hold in stock, and use on another product's bill." },
  { id: "SUBCONTRACT", title: "Sent out", detail: "A supplier makes it. You can still supply some of the parts." },
] as const;
const blankStep = (): Step => ({ name: "", workCentreId: "", resourceId: "", setupMinutes: "0", runMinutesPerUnit: "0", crewSize: "1", machineRate: "0", labourRate: "0", overheadRate: "0", logistics: "0", machineIncludesLabour: false, machineIncludesOverhead: false });
const field = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm";
const resourceLabel = (value: string) => ({ MACHINE: "Machine", PRODUCTION_LINE: "Production line", LABOUR_TEAM: "Labour team", WORKSTATION: "Workstation", CELL: "Cell", SUBCONTRACT: "Subcontract bench" }[value] ?? "Machine");

export function RecipeEditor(props: {
  productId: string;
  supply: string;
  batchQuantity: number;
  yieldPercent: number;
  lines: Array<{ componentId: string; quantityPerUnit: number; scrapPercent: number; notes?: string }>;
  operations: Array<{ name: string; workCentre?: string; workCentreId?: string | null; resourceId?: string | null; setupMinutes: number; runMinutesPerUnit: number; crewSize: number; machineMinorPerHour: number; labourMinorPerHour: number; overheadMinorPerHour?: number; logisticsMinorPerBatch: number; machineIncludesLabour: boolean; machineIncludesOverhead?: boolean }>;
  choices: Choice[];
  plant: PlantCentre[];
  subcontractMinorPerUnit?: number;
}) {
  const router = useRouter();
  const [supply, setSupply] = useState(props.supply);
  const [batch, setBatch] = useState(String(props.batchQuantity || 1));
  const [yieldPercent, setYieldPercent] = useState(String(props.yieldPercent || 100));
  const [fee, setFee] = useState(String((props.subcontractMinorPerUnit ?? 0) / 100));
  const [lines, setLines] = useState<Line[]>(props.lines.map((line) => ({ componentId: line.componentId, quantityPerUnit: String(line.quantityPerUnit), scrapPercent: String(line.scrapPercent), notes: line.notes ?? "" })));
  const [steps, setSteps] = useState<Step[]>(props.operations.map((step) => ({ name: step.name, workCentreId: step.workCentreId ?? "", resourceId: step.resourceId ?? "", setupMinutes: String(step.setupMinutes), runMinutesPerUnit: String(step.runMinutesPerUnit), crewSize: String(step.crewSize), machineRate: String(step.machineMinorPerHour / 100), labourRate: String(step.labourMinorPerHour / 100), overheadRate: String((step.overheadMinorPerHour ?? 0) / 100), logistics: String(step.logisticsMinorPerBatch / 100), machineIncludesLabour: step.machineIncludesLabour, machineIncludesOverhead: step.machineIncludesOverhead ?? false })));
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const choice = (id: string) => props.choices.find((item) => item.id === id);
  const setLine = (index: number, patch: Partial<Line>) => setLines(lines.map((item, i) => i === index ? { ...item, ...patch } : item));
  const setStep = (index: number, patch: Partial<Step>) => setSteps(steps.map((item, i) => i === index ? { ...item, ...patch } : item));
  const save = () => start(async () => {
    setMessage("");
    try {
      await saveProductRecipe(props.productId, {
        supply,
        batchQuantity: Number(batch),
        yieldPercent: Number(yieldPercent),
        lines: lines.filter((line) => line.componentId).map((line) => ({ componentId: line.componentId, quantityPerUnit: Number(line.quantityPerUnit), scrapPercent: Number(line.scrapPercent || 0), notes: line.notes })),
        subcontract: Number(fee || 0),
        operations: steps.filter((step) => step.name.trim()).map((step) => ({ name: step.name.trim(), workCentreId: step.workCentreId, resourceId: step.resourceId, setupMinutes: Number(step.setupMinutes || 0), runMinutesPerUnit: Number(step.runMinutesPerUnit || 0), crewSize: Number(step.crewSize || 1), machineRate: Number(step.machineRate || 0), labourRate: Number(step.labourRate || 0), overheadRate: Number(step.overheadRate || 0), logistics: Number(step.logistics || 0), machineIncludesLabour: step.machineIncludesLabour, machineIncludesOverhead: step.machineIncludesOverhead })),
      });
      setFailed(false);
      setMessage("Saved as the new version. Manufacturing will use this bill and these machines on the next order you release.");
      router.refresh();
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "Could not save the recipe.");
    }
  });
  const yieldValue = Number(yieldPercent) > 0 ? Number(yieldPercent) : 100, batchValue = Number(batch) > 0 ? Number(batch) : 1;
  const money = (minor: number) => `£${(minor / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const figure = (value: number) => value.toLocaleString("en-GB", { maximumFractionDigits: 3 });
  const need = (line: Line) => { const quantity = Number(line.quantityPerUnit); return quantity > 0 ? quantity * (1 + Number(line.scrapPercent || 0) / 100) / (yieldValue / 100) : 0; };
  const materialMinor = lines.reduce((sum, line) => sum + need(line) * (choice(line.componentId)?.costMinor ?? 0), 0);
  const stepMinor = (step: Step) => {
    const hours = (Number(step.setupMinutes || 0) / batchValue + Number(step.runMinutesPerUnit || 0)) / 60 / (yieldValue / 100);
    const machine = hours * Number(step.machineRate || 0) * 100;
    const labour = step.machineIncludesLabour ? 0 : hours * Number(step.crewSize || 1) * Number(step.labourRate || 0) * 100;
    const overhead = step.machineIncludesOverhead ? 0 : hours * Number(step.overheadRate || 0) * 100;
    return { hours, total: machine + labour + overhead + Number(step.logistics || 0) * 100 / batchValue };
  };
  const routeMinor = steps.reduce((sum, step) => sum + stepMinor(step).total, 0);
  const feeMinor = supply === "SUBCONTRACT" ? Number(fee || 0) * 100 : 0;
  const move = (index: number, by: number) => { const next = [...steps], target = index + by; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; setSteps(next); };
  const cell = "w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm";
  const th = "px-2 py-2 text-left text-xs font-medium text-slate-500";
  const made = supply !== "BUY";
  return <section className="space-y-5">
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold">How you get this product</h3>
      <div role="radiogroup" aria-label="How you get this product" className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{policies.map((policy) => { const on = supply === policy.id; return <button key={policy.id} type="button" role="radio" aria-checked={on} onClick={() => setSupply(policy.id)} className={`rounded-2xl border-2 p-4 text-left transition ${on ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}><span className="flex items-center gap-2 text-sm font-semibold"><span className={`flex size-4 items-center justify-center rounded-full border-2 ${on ? "border-blue-600" : "border-slate-300"}`}>{on && <span className="size-2 rounded-full bg-blue-600" />}</span>{policy.title}</span><span className="mt-2 block text-xs leading-5 text-slate-500">{policy.detail}</span></button>; })}</div>
      {!made && <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Bought in: there is no bill of materials or routing, and the cost is the standard price. Choose <strong>Made here</strong>, <strong>Work in progress</strong> or <strong>Sent out</strong> to build this product from components and machine steps.</p>}
      {made && <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <label className="text-xs font-medium">Normal batch size<input className={field} inputMode="decimal" value={batch} onChange={(event) => setBatch(event.target.value)} /><span className="mt-1 block font-normal text-slate-500">Good units from one run. Setup time is shared across it.</span></label>
        <label className="text-xs font-medium">Yield %<input className={field} inputMode="decimal" value={yieldPercent} onChange={(event) => setYieldPercent(event.target.value)} /><span className="mt-1 block font-normal text-slate-500">Share of output that is good. 95 means 5 in 100 are rejected.</span></label>
        {supply === "SUBCONTRACT" && <label className="text-xs font-medium">Subcontract price each (£)<input className={field} inputMode="decimal" value={fee} onChange={(event) => setFee(event.target.value)} /><span className="mt-1 block font-normal text-slate-500">What the supplier charges per good unit.</span></label>}
      </div>}
    </div>

    {made && <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-sm font-semibold">Bill of materials <span className="ml-1 font-normal text-slate-400">{lines.filter((line) => line.componentId).length} components</span></h3><p className="mt-1 text-xs text-slate-500">What goes into one unit. A component can be a bought material, or a product you make that has its own bill.</p></div><Button type="button" onClick={() => setLines([...lines, { componentId: "", quantityPerUnit: "1", scrapPercent: "0", notes: "" }])}>Add component</Button></div>
      {lines.length ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead><tr className="border-b border-slate-200"><th className={`${th} w-8`}>#</th><th className={th}>Component</th><th className={`${th} w-24`}>Qty per unit</th><th className={`${th} w-16`}>Unit</th><th className={`${th} w-20`}>Scrap %</th><th className={`${th} w-28 text-right`}>Needed per good unit</th><th className={`${th} w-24 text-right`}>Cost each</th><th className={`${th} w-24 text-right`}>Line cost</th><th className={`${th} w-24 text-right`}>In stock</th><th className={`${th} w-10`} /></tr></thead>
        <tbody>{lines.map((line, index) => { const item = choice(line.componentId), needed = need(line), short = item?.stock != null && needed > 0 && item.stock < needed * batchValue; return <tr key={index} className="border-b border-slate-100 align-top">
          <td className="px-2 py-2 text-xs text-slate-400">{index + 1}</td>
          <td className="px-2 py-2"><select aria-label="Component" className={cell} value={line.componentId} onChange={(event) => setLine(index, { componentId: event.target.value })}><option value="">Choose a product</option>{COMPONENT_GROUPS.map((group) => <optgroup key={group.supply} label={group.title}>{props.choices.filter((option) => option.supply === group.supply).map((option) => <option key={option.id} value={option.id}>{option.label}{option.categoryName ? ` · ${option.categoryName}` : ""}</option>)}</optgroup>)}</select><input aria-label="What it is for" className={`${cell} mt-1.5 text-xs`} value={line.notes} placeholder="What it is for (optional)" onChange={(event) => setLine(index, { notes: event.target.value })} />{item && <p className="mt-1 text-xs text-slate-400">{COMPONENT_GROUPS.find((group) => group.supply === item.supply)?.title}{item.supply !== "BUY" ? <> · <Link href={`/products/${item.id}#make`} className="text-blue-600">open its bill</Link></> : null}</p>}</td>
          <td className="px-2 py-2"><input aria-label="Quantity per unit" className={`${cell} text-right tabular-nums`} inputMode="decimal" value={line.quantityPerUnit} onChange={(event) => setLine(index, { quantityPerUnit: event.target.value })} /></td>
          <td className="px-2 py-3 text-xs text-slate-500">{item?.unit ?? ""}</td>
          <td className="px-2 py-2"><input aria-label="Scrap percent" className={`${cell} text-right tabular-nums`} inputMode="decimal" value={line.scrapPercent} onChange={(event) => setLine(index, { scrapPercent: event.target.value })} /></td>
          <td className="px-2 py-3 text-right tabular-nums">{needed ? figure(needed) : "—"}</td>
          <td className="px-2 py-3 text-right tabular-nums text-slate-600">{item?.costMinor != null ? money(item.costMinor) : "—"}</td>
          <td className="px-2 py-3 text-right font-medium tabular-nums">{item?.costMinor != null && needed ? money(needed * item.costMinor) : "—"}</td>
          <td className={`px-2 py-3 text-right tabular-nums ${short ? "font-semibold text-amber-700" : "text-slate-600"}`} title={short ? `A batch of ${figure(batchValue)} needs ${figure(needed * batchValue)}` : ""}>{item?.stock != null ? figure(item.stock) : "—"}</td>
          <td className="px-2 py-2 text-right"><button type="button" aria-label="Remove component" onClick={() => setLines(lines.filter((_, i) => i !== index))} className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600">Remove</button></td>
        </tr>; })}</tbody>
        <tfoot><tr><td colSpan={7} className="px-2 py-3 text-right text-xs text-slate-500">Materials for one good unit, at each component&apos;s standard price</td><td className="px-2 py-3 text-right font-semibold tabular-nums">{money(materialMinor)}</td><td colSpan={2} /></tr></tfoot>
      </table></div> : <p className="mt-4 rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">Nothing on the bill yet. Add the first component.</p>}
      <p className="mt-2 text-xs text-slate-500">Amber stock means there is not enough on hand for one normal batch. Needed per good unit already allows for scrap and yield.</p>
    </div>}

    {made && <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-sm font-semibold">Routing <span className="ml-1 font-normal text-slate-400">{steps.filter((step) => step.name.trim()).length} steps</span></h3><p className="mt-1 max-w-3xl text-xs text-slate-500">The steps to make it, in order, each at a work centre and machine. A released production order creates a work order for every step on that machine.</p></div><Button type="button" onClick={() => setSteps([...steps, blankStep()])}>Add step</Button></div>
      {!props.plant.length && <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">No work centres or machines are set up yet. <Link href="/manufacturing/plant" className="font-semibold underline">Set up the plant in Manufacturing</Link>, then pick the machine for each step.</p>}
      {steps.length ? <div className="mt-4 space-y-3">{steps.map((step, index) => { const centre = props.plant.find((item) => item.id === step.workCentreId), cost = stepMinor(step); return <div key={index} className="rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"><span className="flex size-7 items-center justify-center rounded-full bg-slate-900 text-white">{(index + 1) * 10}</span>Step {index + 1}</span><span className="flex items-center gap-1"><span className="mr-2 text-xs text-slate-500">{figure(cost.hours * 60)} min · {money(cost.total)} per good unit</span><button type="button" disabled={index === 0} onClick={() => move(index, -1)} className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30">Up</button><button type="button" disabled={index === steps.length - 1} onClick={() => move(index, 1)} className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30">Down</button><button type="button" onClick={() => setSteps(steps.filter((_, i) => i !== index))} className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600">Remove</button></span></div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <label className="text-xs font-medium xl:col-span-2">Operation<input className={field} value={step.name} placeholder="Cut, form, weld, fire, pack" onChange={(event) => setStep(index, { name: event.target.value })} /></label>
          <label className="text-xs font-medium xl:col-span-2">Work centre<select className={field} value={step.workCentreId} onChange={(event) => setStep(index, { workCentreId: event.target.value, resourceId: "" })}><option value="">Not chosen</option>{props.plant.map((item) => <option key={item.id} value={item.id}>{item.name}{item.active === false ? " · retired" : ""}</option>)}</select></label>
          <label className="text-xs font-medium xl:col-span-2">Machine<select className={field} value={step.resourceId} onChange={(event) => setStep(index, { resourceId: event.target.value })} disabled={!centre}><option value="">{centre ? "Any machine in this centre" : "Choose a work centre first"}</option>{(centre?.machines ?? []).map((machine) => <option key={machine.id} value={machine.id}>{machine.name} · {resourceLabel(machine.type)}{machine.active === false ? " · retired" : ""}</option>)}</select></label>
          <label className="text-xs font-medium">Setup (min)<input className={field} inputMode="decimal" value={step.setupMinutes} onChange={(event) => setStep(index, { setupMinutes: event.target.value })} /></label>
          <label className="text-xs font-medium">Run (min per unit)<input className={field} inputMode="decimal" value={step.runMinutesPerUnit} onChange={(event) => setStep(index, { runMinutesPerUnit: event.target.value })} /></label>
          <label className="text-xs font-medium">Crew<input className={field} inputMode="decimal" value={step.crewSize} onChange={(event) => setStep(index, { crewSize: event.target.value })} /></label>
          <label className="text-xs font-medium">Machine £ / hour<input className={field} inputMode="decimal" value={step.machineRate} onChange={(event) => setStep(index, { machineRate: event.target.value })} /></label>
          <label className="text-xs font-medium">Labour £ / hour each<input className={field} inputMode="decimal" value={step.labourRate} disabled={step.machineIncludesLabour} onChange={(event) => setStep(index, { labourRate: event.target.value })} /></label>
          <label className="text-xs font-medium">Overhead £ / hour<input className={field} inputMode="decimal" value={step.overheadRate} disabled={step.machineIncludesOverhead} onChange={(event) => setStep(index, { overheadRate: event.target.value })} /></label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2"><label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={step.machineIncludesLabour} onChange={(event) => setStep(index, { machineIncludesLabour: event.target.checked })} />Machine rate includes the operator</label><label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={step.machineIncludesOverhead} onChange={(event) => setStep(index, { machineIncludesOverhead: event.target.checked })} />Machine rate includes overhead</label><label className="flex items-center gap-2 text-xs text-slate-600">Handling or transport £ per batch<input aria-label="Logistics per batch" className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm" inputMode="decimal" value={step.logistics} onChange={(event) => setStep(index, { logistics: event.target.value })} /></label></div>
      </div>; })}</div> : <p className="mt-4 rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No steps yet. Add the first operation.</p>}
    </div>}

    <div className="sticky bottom-3 z-10 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {made ? <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm"><div><dt className="text-xs text-slate-500">Materials</dt><dd className="font-semibold tabular-nums">{money(materialMinor)}</dd></div><div><dt className="text-xs text-slate-500">Machine, labour, overhead</dt><dd className="font-semibold tabular-nums">{money(routeMinor)}</dd></div>{supply === "SUBCONTRACT" && <div><dt className="text-xs text-slate-500">Subcontract</dt><dd className="font-semibold tabular-nums">{money(feeMinor)}</dd></div>}<div><dt className="text-xs text-slate-500">Estimated cost each</dt><dd className="text-lg font-semibold tabular-nums">{money(materialMinor + routeMinor + feeMinor)}</dd></div></dl> : <p className="text-sm text-slate-500">Bought in at the standard price.</p>}
        <div className="flex items-center gap-3"><p role={failed ? "alert" : "status"} className={`max-w-sm text-xs ${failed ? "text-red-600" : "text-slate-500"}`}>{message}</p><Button type="button" variant="primary" disabled={pending} onClick={save}>{pending ? "Saving…" : made ? "Save bill and routing" : "Save"}</Button></div>
      </div>
      {made && <p className="mt-2 text-xs text-slate-400">The estimate uses each component&apos;s standard price. After saving, the Costing tab shows the full roll-up through every level of the bill. Saving keeps the previous version.</p>}
    </div>
  </section>;
}
