import { ActionForm } from "@/components/ui/action-form";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { LOGISTICS_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { palletSpaces } from "@/modules/logistics/domain/handling";
import { loadDetail } from "@/modules/logistics/services/queries";
import { departAction, loadScanAction } from "../../actions";

export default async function LoadPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  assertCapability(session, C.shipmentRead);
  const load = await loadDetail(session.organisationId, (await params).id);
  if (!load) notFound();
  const packages = load.stops.flatMap((stop) => stop.shipment.packages);
  const weight = packages.reduce((sum, box) => sum + (box.weightGrams ?? 0), 0);
  const pallets = palletSpaces(packages);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/logistics/dispatch" className="text-sm text-[var(--color-ink-muted)]">Dispatch</Link>
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-atlas-blue)]">Run</p>
        <h1 className="text-4xl font-semibold">{load.reference}</h1>
        <p className="mt-2">{load.vehicleLabel} · {load.driverName || "Driver not named"}</p>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{pallets} pallet space{pallets === 1 ? "" : "s"}{load.maxPallets ? ` / ${load.maxPallets}` : ""} · {(weight / 1000).toFixed(1)} kg{load.maxWeightKg ? ` / ${load.maxWeightKg} kg` : ""}</p>
      </header>
      <ol className="space-y-2">{load.stops.map((stop) => <li key={stop.id} className="flex justify-between rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm"><span>{stop.sequence}. {stop.partyName}</span><span>{stop.status}</span></li>)}</ol>
      {can(session, C.dispatchManage) && <ActionForm action={loadScanAction.bind(null, load.id)} className="flex gap-2"><input name="barcode" placeholder="Scan shipment or handling unit" className="flex-1 rounded-2xl border px-4 py-4 text-2xl" /><button className="rounded-full bg-[var(--color-atlas-blue)] px-4 py-2 text-sm font-semibold text-white" type="submit">Load</button></ActionForm>}
      {can(session, C.shipmentDispatch) && <ActionForm action={departAction.bind(null, load.id)}><button className="rounded-full border px-4 py-2 text-sm" type="submit">Depart</button></ActionForm>}
    </div>
  );
}
