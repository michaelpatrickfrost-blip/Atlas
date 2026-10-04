import { ActionForm } from "@/components/ui/action-form";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { LOGISTICS_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { reportBoard } from "@/modules/logistics/services/queries";
import { policyFor } from "@/modules/logistics/services/numbers";
import { policyAction } from "../actions";

export default async function ReportsPage() {
  const session = await requireSession();
  assertCapability(session, C.reportRead);
  const [report, policy] = await Promise.all([reportBoard(session.organisationId, can(session, C.costRead)), policyFor(session.organisationId)]);
  const tiles = [
    ["Orders fulfilled", report.fulfilled],
    ["Shipments", report.shipments],
    ["Units shipped", report.units],
    ["Open fulfilment", report.backlog],
    ["OTIF", report.otif === null ? "—" : `${report.otif}%`],
    ["On time", report.onTime === null ? "—" : `${report.onTime}%`],
    ["In full", report.inFull === null ? "—" : `${report.inFull}%`],
    ["Picks per hour", report.picksPerHour ?? "—"],
    ["Returns", report.returns],
  ];
  return (
    <div className="space-y-8">
      <header><h1 className="text-3xl font-semibold tracking-tight">Reports</h1><p className="mt-2 max-w-2xl text-sm text-[var(--color-ink-muted)]">Last 30 days. OTIF is on or before the committed date, and in full at the configured percentage. Missing dates stay unmeasured rather than counting as on time. {report.cycleNote}</p></header>
      <div className="grid gap-3 sm:grid-cols-3">{tiles.map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4"><p className="text-2xl font-semibold">{value}</p><p className="text-xs text-[var(--color-ink-muted)]">{label}</p></div>)}</div>
      <section className="grid gap-6 lg:grid-cols-2">
        <List title="Failure reasons" rows={report.failures} />
        <List title="Return reasons" rows={report.reasons} />
      </section>
      <section>
        <h2 className="text-sm font-semibold">Carriers</h2>
        <div className="mt-3 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white"><table className="w-full text-sm"><thead className="text-left text-xs text-[var(--color-ink-muted)]"><tr><th className="px-4 py-3">Carrier</th><th>Shipments</th><th>On time</th>{can(session, C.costRead) && <th>Operational cost</th>}</tr></thead><tbody>{report.carriers.map((row) => <tr key={row.carrier} className="border-t"><td className="px-4 py-3">{row.carrier}</td><td>{row.shipments}</td><td>{row.measured ? `${Math.round((row.onTime / row.measured) * 100)}%` : "—"}</td>{can(session, C.costRead) && <td>{row.cost === null ? "—" : (row.cost / 100).toFixed(2)}</td>}</tr>)}</tbody></table></div>
        <p className="mt-2 text-xs text-[var(--color-ink-muted)]">Pick and pack figures are for the team, not individual surveillance. Freight here is the carrier charge Logistics recorded. Finance owns the ledger.</p>
      </section>
      {can(session, C.policyManage) && (
        <ActionForm action={policyAction} className="grid max-w-xl gap-3 rounded-3xl border border-[var(--color-border)] bg-white p-5">
          <h2 className="text-sm font-semibold">Warehouse mode</h2>
          <select name="mode" defaultValue={policy.mode} className="rounded-xl border px-3 py-2 text-sm"><option value="SIMPLE">Simple · pick then ship</option><option value="STANDARD">Standard · pick, pack, ship</option><option value="ADVANCED">Advanced · wave through load</option></select>
          <select name="reservationPolicy" defaultValue={policy.reservationPolicy} className="rounded-xl border px-3 py-2 text-sm"><option value="ON_CONFIRMATION">Reserve on confirmation</option><option value="ON_RELEASE">Reserve when released</option><option value="MANUAL">Manual reservation</option></select>
          <select name="releaseMethod" defaultValue={policy.releaseMethod} className="rounded-xl border px-3 py-2 text-sm"><option value="MANUAL">Manual release</option><option value="AUTOMATIC">Automatic release</option></select>
          <select name="overPickPolicy" defaultValue={policy.overPickPolicy} className="rounded-xl border px-3 py-2 text-sm"><option value="PROHIBITED">Over-pick prohibited</option><option value="WARNING">Over-pick warning</option><option value="ALLOWED">Over-pick allowed</option></select>
          <button className="rounded-full bg-[var(--color-atlas-blue)] px-4 py-2 text-sm font-semibold text-white" type="submit">Save operating rules</button>
        </ActionForm>
      )}
    </div>
  );
}

function List({ title, rows }: { title: string; rows: Array<{ label: string; value: number }> }) {
  return <div><h2 className="text-sm font-semibold">{title}</h2><ul className="mt-3 space-y-2">{rows.length === 0 && <li className="text-sm text-[var(--color-ink-muted)]">None recorded.</li>}{rows.map((row) => <li key={row.label} className="flex justify-between text-sm"><span>{row.label}</span><span>{row.value}</span></li>)}</ul></div>;
}
