"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { COMPONENT_GROUPS, componentPerGoodUnit } from "@/modules/products/domain/make";
import { saveProductRecipe } from "@/modules/products/services/make";

type Line = { componentId: string; quantityPerUnit: string; scrapPercent: string; notes: string };
type Step = { name: string; workCentreId: string; resourceId: string; setupMinutes: string; runMinutesPerUnit: string; crewSize: string; machineRate: string; labourRate: string; overheadRate: string; logistics: string; machineIncludesLabour: boolean; machineIncludesOverhead: boolean };
type Choice = { id: string; code: string; name: string; unit: string; categoryName: string; supply: string; label: string };
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
  const grouped = COMPONENT_GROUPS.map((group) => ({ ...group, lines: lines.map((line, index) => ({ line, index })).filter(({ line }) => choice(line.componentId)?.supply === group.supply) }));
  const unassigned = lines.map((line, index) => ({ line, index })).filter(({ line }) => !choice(line.componentId));
  const perGood = (line: Line) => {
    const quantity = Number(line.quantityPerUnit);
    const scrap = Number(line.scrapPercent || 0);
    const yieldValue = Number(yieldPercent);
    if (!(quantity > 0) || !(yieldValue > 0)) return "";
    try { return componentPerGoodUnit({ componentId: line.componentId, quantityPerUnit: quantity, scrapPercent: scrap }, yieldValue).toLocaleString("en-GB", { maximumFractionDigits: 3 }); } catch { return ""; }
  };
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
  const lineEditor = (line: Line, index: number) => {
    const item = choice(line.componentId);
    return <div key={index} className="rounded-xl bg-slate-50 p-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_7rem_7rem_auto]">
        <label className="text-xs text-slate-500">Component<select className={field} value={line.componentId} onChange={(event) => setLine(index, { componentId: event.target.value })}><option value="">Choose a product</option>{COMPONENT_GROUPS.map((group) => <optgroup key={group.supply} label={group.title}>{props.choices.filter((option) => option.supply === group.supply).map((option) => <option key={option.id} value={option.id}>{option.label}{option.categoryName ? ` · ${option.categoryName}` : ""}</option>)}</optgroup>)}</select></label>
        <label className="text-xs text-slate-500">Qty per unit<input className={field} inputMode="decimal" value={line.quantityPerUnit} onChange={(event) => setLine(index, { quantityPerUnit: event.target.value })} /></label>
        <label className="text-xs text-slate-500">Scrap %<input className={field} inputMode="decimal" value={line.scrapPercent} onChange={(event) => setLine(index, { scrapPercent: event.target.value })} /></label>
        <button type="button" className="self-end px-2 py-2 text-xs text-slate-500" onClick={() => setLines(lines.filter((_, i) => i !== index))}>Remove</button>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
        <label className="text-xs text-slate-500">What this component is for<input className={field} value={line.notes} placeholder="Where it is used on this product" onChange={(event) => setLine(index, { notes: event.target.value })} /></label>
        <p className="self-end text-xs text-slate-500">{item ? `${item.unit}${item.categoryName ? ` · ${item.categoryName}` : ""}` : "Pick a component"}{perGood(line) ? ` · ${perGood(line)} per good unit after yield and scrap` : ""}</p>
      </div>
    </div>;
  };
  return <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <div><h3 className="text-sm font-semibold">How this product is supplied</h3><p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">Bought materials, work in progress and made subassemblies are all products. A work-in-progress item can sit in stock and has its own bill. Saving keeps the previous version.</p></div>
    <div className="mt-4 grid gap-2 sm:grid-cols-2">{policies.map((policy) => <button key={policy.id} type="button" onClick={() => setSupply(policy.id)} className={`rounded-2xl border p-4 text-left ${supply === policy.id ? "border-blue-600 bg-blue-50" : "border-slate-200"}`}><span className="text-sm font-medium">{policy.title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{policy.detail}</span></button>)}</div>
    {supply !== "BUY" && <>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-slate-500">Good units in a normal batch<input className={field} inputMode="decimal" value={batch} onChange={(event) => setBatch(event.target.value)} /></label>
        <label className="text-xs text-slate-500">Yield, percent of good output<input className={field} inputMode="decimal" value={yieldPercent} onChange={(event) => setYieldPercent(event.target.value)} /></label>
        {supply === "SUBCONTRACT" && <label className="text-xs text-slate-500">Subcontract £ each<input className={field} inputMode="decimal" value={fee} onChange={(event) => setFee(event.target.value)} /></label>}
      </div>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div><h4 className="text-sm font-semibold">Bill of materials</h4><p className="mt-1 text-xs text-slate-500">{lines.filter((line) => choice(line.componentId)?.supply === "WIP").length} work in progress · {lines.filter((line) => choice(line.componentId)?.supply === "BUY").length} bought · {lines.filter((line) => choice(line.componentId)?.supply === "MAKE").length} made here · {lines.filter((line) => choice(line.componentId)?.supply === "SUBCONTRACT").length} sent out</p></div>
        <button type="button" className="text-xs font-medium text-blue-600" onClick={() => setLines([...lines, { componentId: "", quantityPerUnit: "1", scrapPercent: "0", notes: "" }])}>Add component</button>
      </div>
      <div className="mt-4 space-y-5">
        {grouped.map((group) => group.lines.length ? <div key={group.supply}><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{group.title}</p><p className="mt-1 text-xs text-slate-500">{group.detail}</p><div className="mt-2 space-y-2">{group.lines.map(({ line, index }) => lineEditor(line, index))}</div></div> : null)}
        {!!unassigned.length && <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Choose a component</p><div className="mt-2 space-y-2">{unassigned.map(({ line, index }) => lineEditor(line, index))}</div></div>}
        {!lines.length && <p className="text-xs text-slate-500">Nothing is on the bill yet. Add a bought material, a work-in-progress product, or a subassembly you make.</p>}
      </div>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div><h4 className="text-sm font-semibold">Machinery and steps</h4><p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">Each step runs at a work centre, on a machine you keep in Manufacturing. Releasing a production order copies this step onto that machine. It does not book the calendar until the order is scheduled.</p></div>
        <button type="button" className="text-xs font-medium text-blue-600" onClick={() => setSteps([...steps, blankStep()])}>Add step</button>
      </div>
      {!props.plant.length && <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">No work centres yet. <Link href="/manufacturing/plant" className="font-medium text-blue-600">Set up the plant in Manufacturing</Link>, then choose the machine for each step.</p>}
      <div className="mt-3 space-y-3">{steps.map((step, index) => {
        const centre = props.plant.find((item) => item.id === step.workCentreId);
        return <div key={index} className="rounded-xl bg-slate-50 p-3">
          <div className="grid gap-2 sm:grid-cols-4">
            <label className="text-xs text-slate-500 sm:col-span-2">Step<input className={field} value={step.name} placeholder="Form, fire, pack" onChange={(event) => setStep(index, { name: event.target.value })} /></label>
            <label className="text-xs text-slate-500">Work centre<select className={field} value={step.workCentreId} onChange={(event) => setStep(index, { workCentreId: event.target.value, resourceId: "" })}><option value="">Not on the plant yet</option>{props.plant.map((item) => <option key={item.id} value={item.id}>{item.name}{item.active === false ? " · retired" : ""}</option>)}</select></label>
            <label className="text-xs text-slate-500">Machine<select className={field} value={step.resourceId} onChange={(event) => setStep(index, { resourceId: event.target.value })} disabled={!centre}><option value="">{centre ? "Any machine in this centre" : "Choose a work centre"}</option>{(centre?.machines ?? []).map((machine) => <option key={machine.id} value={machine.id}>{machine.name} · {resourceLabel(machine.type)}{machine.active === false ? " · retired" : ""}</option>)}</select></label>
            <label className="text-xs text-slate-500">Setup min<input className={field} inputMode="decimal" value={step.setupMinutes} onChange={(event) => setStep(index, { setupMinutes: event.target.value })} /></label>
            <label className="text-xs text-slate-500">Run min / unit<input className={field} inputMode="decimal" value={step.runMinutesPerUnit} onChange={(event) => setStep(index, { runMinutesPerUnit: event.target.value })} /></label>
            <label className="text-xs text-slate-500">Crew<input className={field} inputMode="decimal" value={step.crewSize} onChange={(event) => setStep(index, { crewSize: event.target.value })} /></label>
            <label className="text-xs text-slate-500">Machine £/hour<input className={field} inputMode="decimal" value={step.machineRate} onChange={(event) => setStep(index, { machineRate: event.target.value })} /></label>
            <label className="text-xs text-slate-500">Labour £/hour<input className={field} inputMode="decimal" value={step.labourRate} onChange={(event) => setStep(index, { labourRate: event.target.value })} /></label>
            <label className="text-xs text-slate-500">Overhead £/hour<input className={field} inputMode="decimal" value={step.overheadRate} onChange={(event) => setStep(index, { overheadRate: event.target.value })} /></label>
            <label className="text-xs text-slate-500">Logistics £/batch<input className={field} inputMode="decimal" value={step.logistics} onChange={(event) => setStep(index, { logistics: event.target.value })} /></label>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-col gap-2"><label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={step.machineIncludesLabour} onChange={(event) => setStep(index, { machineIncludesLabour: event.target.checked })} />Machine rate already includes the operator</label><label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={step.machineIncludesOverhead} onChange={(event) => setStep(index, { machineIncludesOverhead: event.target.checked })} />Machine rate already includes overhead</label></div><button type="button" className="text-xs text-slate-500" onClick={() => setSteps(steps.filter((_, i) => i !== index))}>Remove step</button></div>
        </div>;
      })}</div>
    </>}
    <div className="mt-5 flex flex-wrap items-center gap-3"><Button type="button" variant="primary" disabled={pending} onClick={save}>{pending ? "Saving…" : "Save recipe"}</Button><p role={failed ? "alert" : "status"} className={`text-xs ${failed ? "text-red-600" : "text-slate-500"}`}>{message}</p></div>
    </section>;
}
