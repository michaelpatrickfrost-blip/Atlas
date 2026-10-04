import { ActionForm } from "@/components/ui/action-form";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { LOGISTICS_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { taskDetail } from "@/modules/logistics/services/queries";
import { ScanStation } from "@/modules/logistics/components/scan-station";
import { palletLoad } from "@/modules/logistics/domain/handling";
import { handlingTypes, skuPacks } from "@/modules/logistics/services/handling";
import { assignEquipmentAction, claimAction, completeWorkAction, packUnitAction, removeHandlingTypeAction, retireHandlingTypeAction, saveHandlingTypeAction } from "../../actions";

export default async function WorkPage({ params }: { params: Promise<{ taskId: string }> }) {
  const session = await requireSession();
  assertCapability(session, C.pickRead);
  const { taskId } = await params;
  const task = await taskDetail(session.organisationId, taskId);
  if (!task) notFound();
  const current = task.lines.find((line) => line.status === "OPEN" || line.status === "LOCATED") ?? null;
  const units = task.lines.reduce((sum, line) => sum + line.requiredQuantity, 0);
  const packing = task.kind === "PACK";
  const types = packing ? await handlingTypes(session.organisationId) : [];
  const packs = packing ? await skuPacks(session.organisationId, task.lines.map((line) => line.productId ?? "")) : new Map();
  const activeTypes = types.filter((type) => type.active);
  const parents = task.requirement?.packages.filter((unit) => types.find((type) => type.code === (unit.typeCode ?? unit.packageType))?.canContain) ?? [];
  const order = task.requirement?.salesOrder;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/logistics/fulfil" className="text-sm text-[var(--color-ink-muted)]">Fulfil</Link>
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-atlas-blue)]">{task.kind} · {task.method}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">{task.reference}</h1>
        <p className="mt-2 text-lg">{task.requirement?.party.name}</p>
        {order && <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{order.reference}{order.customerPoReference ? ` · PO ${order.customerPoReference}` : ""}{order.requestedDeliveryDate ? ` · requested ${order.requestedDeliveryDate.toLocaleDateString("en-GB")}` : ""}{order.promisedDeliveryDate ? ` · promised ${order.promisedDeliveryDate.toLocaleDateString("en-GB")}` : ""}</p>}
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{task.lines.length} lines · {units} units{task.wave ? ` · ${task.wave.reference}` : ""}</p>
      </header>
      {can(session, C.pickExecute) && task.status === "READY" && <ActionForm action={claimAction.bind(null, task.id)}><button className="rounded-full bg-[var(--color-atlas-blue)] px-5 py-3 text-sm font-semibold text-white" type="submit">Start {task.kind.toLowerCase()}</button></ActionForm>}
      {can(session, C.pickExecute) && (
        <ActionForm action={assignEquipmentAction.bind(null, task.id)} className="flex flex-wrap items-end gap-3 rounded-3xl border border-[var(--color-border)] bg-white p-4">
          <label className="text-sm">Equipment<input name="equipmentRef" required placeholder="FLT-04" className="mt-1 block rounded-xl border px-3 py-2" /></label>
          <label className="text-sm">Competence<input name="competenceKey" placeholder="FORKLIFT" className="mt-1 block rounded-xl border px-3 py-2" /></label>
          <button className="rounded-full border px-4 py-2 text-sm" type="submit">Assign</button>
        </ActionForm>
      )}
      {packing && can(session, C.packExecute) && task.status !== "COMPLETE" && (
        <ActionForm action={packUnitAction.bind(null, task.id)} className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-white p-5">
          <div>
            <h2 className="text-lg font-semibold">Pack onto a handling unit</h2>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">A pallet, carton or other unit can hold the picked goods. A pallet can contain the cartons.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Type<select name="typeCode" className="mt-1 block w-full rounded-xl border px-3 py-2" required>{activeTypes.map((type) => <option key={type.code} value={type.code}>{type.name} · {type.lengthMm}×{type.widthMm}×{type.heightMm} mm</option>)}</select></label>
            <label className="text-sm">Put inside<select name="parentId" className="mt-1 block w-full rounded-xl border px-3 py-2" defaultValue=""><option value="">No parent</option>{parents.map((unit) => <option key={unit.id} value={unit.id}>{unit.reference} · {unit.typeCode ?? unit.packageType}</option>)}</select></label>
            <label className="text-sm">Length mm<input name="lengthMm" type="number" min={1} className="mt-1 block w-full rounded-xl border px-3 py-2" placeholder="Uses the type" /></label>
            <label className="text-sm">Width mm<input name="widthMm" type="number" min={1} className="mt-1 block w-full rounded-xl border px-3 py-2" /></label>
            <label className="text-sm">Height mm<input name="heightMm" type="number" min={1} className="mt-1 block w-full rounded-xl border px-3 py-2" /></label>
            <label className="text-sm">Gross weight g<input name="weightGrams" type="number" min={1} className="mt-1 block w-full rounded-xl border px-3 py-2" placeholder="Calculated if empty" /></label>
          </div>
          <div className="space-y-2">
            {task.lines.map((line) => {
              const open = Math.max(0, line.requiredQuantity - line.confirmedQuantity);
              const sku = line.productId ? packs.get(line.productId) : undefined;
              const plan = palletLoad(open, sku?.perPallet ?? null);
              return (
                <label key={line.id} className="flex items-center justify-between gap-3 text-sm">
                  <span>
                    <span className="font-medium">{sku?.code || line.productCode || "No SKU"}</span>
                    <span className="ml-2">{line.description}</span>
                    <span className="mt-1 block text-[var(--color-ink-muted)]">{open} still to pack{plan.perPallet ? ` · ${plan.perPallet} ${sku?.unit ?? ""} per pallet` : ""}{plan.full ? ` · ${plan.full} full pallet${plan.full === 1 ? "" : "s"}` : ""}{plan.loose && plan.perPallet ? ` · ${plan.loose} loose` : ""}</span>
                  </span>
                  <input type="hidden" name="taskLine" value={line.id} />
                  <input name={`qty-${line.id}`} type="number" min={0} max={open} defaultValue={plan.perPallet ? Math.min(open, plan.perPallet) : open} className="w-24 rounded-xl border px-3 py-2" />
                </label>
              );
            })}
          </div>
          <button className="rounded-full bg-[var(--color-atlas-blue)] px-4 py-2 text-sm font-semibold text-white" type="submit">Pack</button>
        </ActionForm>
      )}
      {packing && task.requirement && task.requirement.packages.length > 0 && (
        <ul className="space-y-2">
          {task.requirement.packages.map((unit) => (
            <li key={unit.id} className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm">
              <p className="font-medium">{unit.reference} · {unit.typeCode ?? unit.packageType}{unit.parentId ? " · nested" : ""}</p>
              <p className="text-[var(--color-ink-muted)]">{[unit.lengthMm, unit.widthMm, unit.heightMm].filter(Boolean).join(" × ")}{unit.lengthMm ? " mm" : ""}{unit.weightGrams ? ` · ${(unit.weightGrams / 1000).toFixed(1)} kg` : ""}</p>
              <p>{unit.contents.map((content) => `${content.description} × ${content.quantity}`).join(", ")}</p>
            </li>
          ))}
        </ul>
      )}
      {packing && can(session, C.policyManage) && (
        <details className="rounded-3xl border border-[var(--color-border)] bg-white p-5">
          <summary className="cursor-pointer text-sm font-medium">Handling unit types</summary>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">Add a type, or retire one the warehouse no longer uses. A type already packed onto an order can be retired, not deleted.</p>
          <ul className="mt-4 space-y-2 text-sm">
            {types.map((type) => (
              <li key={type.id} className="flex flex-wrap items-center justify-between gap-2">
                <span className={type.active ? "" : "text-[var(--color-ink-muted)]"}>{type.name} · {type.code} · {type.lengthMm}×{type.widthMm}×{type.heightMm} mm{type.canContain ? " · can contain others" : ""}{type.active ? "" : " · retired"}</span>
                <span className="flex gap-2">
                  {type.active && <ActionForm action={retireHandlingTypeAction.bind(null, type.code, task.id)}><button className="text-[var(--color-ink-muted)] underline" type="submit">Retire</button></ActionForm>}
                  <ActionForm action={removeHandlingTypeAction.bind(null, type.code, task.id)}><button className="text-[var(--color-ink-muted)] underline" type="submit">Remove</button></ActionForm>
                </span>
              </li>
            ))}
          </ul>
          <ActionForm action={saveHandlingTypeAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="taskId" value={task.id} />
            <label className="text-sm">Name<input name="name" required className="mt-1 block w-full rounded-xl border px-3 py-2" /></label>
            <label className="text-sm">Code<input name="code" required placeholder="EURO" className="mt-1 block w-full rounded-xl border px-3 py-2" /></label>
            <label className="text-sm">Length mm<input name="lengthMm" type="number" min={1} required className="mt-1 block w-full rounded-xl border px-3 py-2" /></label>
            <label className="text-sm">Width mm<input name="widthMm" type="number" min={1} required className="mt-1 block w-full rounded-xl border px-3 py-2" /></label>
            <label className="text-sm">Height mm<input name="heightMm" type="number" min={1} required className="mt-1 block w-full rounded-xl border px-3 py-2" /></label>
            <label className="text-sm">Tare kg<input name="tareKg" type="number" min={0} step="0.1" defaultValue={0} className="mt-1 block w-full rounded-xl border px-3 py-2" /></label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2"><input name="canContain" type="checkbox" /> This unit can hold other units</label>
            <button className="rounded-full border px-4 py-2 text-sm sm:col-span-2" type="submit">Add type</button>
          </ActionForm>
        </details>
      )}
      {!packing && can(session, C.pickExecute) && <ScanStation taskId={task.id} line={current} />}
      <ul className="divide-y divide-[var(--color-border)] rounded-3xl border border-[var(--color-border)] bg-white">
        {task.lines.map((line) => (
          <li key={line.id} className="flex items-center justify-between px-5 py-4 text-sm">
            <span>{line.clusterSlot ? `${line.clusterSlot} · ` : ""}{line.zoneCode ? `${line.zoneCode} · ` : ""}{line.locationCode} · {line.productCode || line.description}</span>
            <span className={line.status === "DONE" ? "text-emerald-600" : line.status === "SHORT" || line.status === "EXCEPTION" ? "text-rose-600" : "text-[var(--color-ink-muted)]"}>{line.confirmedQuantity}/{line.requiredQuantity}</span>
          </li>
        ))}
      </ul>
      {(packing ? can(session, C.packExecute) : can(session, C.pickExecute)) && task.status !== "COMPLETE" && <ActionForm action={completeWorkAction.bind(null, task.id)}><button className="rounded-full border px-5 py-3 text-sm" type="submit">Complete {task.kind.toLowerCase()}</button></ActionForm>}
    </div>
  );
}
