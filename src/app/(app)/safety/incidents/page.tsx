import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { SAFETY_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { incidentList } from "@/modules/safety/services/queries";
import { Panel, Quiet, Row } from "../ui";

export default async function IncidentsPage() {
  const session = await requireSession();
  if (!can(session, C.incidentRead) && !can(session, C.incidentReport)) assertCapability(session, C.incidentRead);
  const incidents = can(session, C.incidentRead) || can(session, C.sensitiveIncidentRead) ? await incidentList(session) : [];
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Incidents</h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--color-ink-muted)]">Near misses, injuries and unsafe conditions stay on the same record as the investigation and the actions. Injury detail is limited to people who are allowed to see it.</p>
        </div>
        <Link href="/safety/report" className="rounded-full bg-[var(--color-atlas-blue)] px-4 py-2 text-sm font-medium text-white">Report</Link>
      </header>
      <Panel>
        {incidents.length === 0 && <Quiet>{can(session, C.incidentRead) ? "Nothing reported." : "You can report what you saw. The accident book is not shown here."}</Quiet>}
        {incidents.map((incident) => (
          <Row key={incident.id} href={`/safety/incidents/${incident.id}`} title={`${incident.reference} · ${incident.summary}`} meta={incident.kind.replaceAll("_", " ").toLowerCase()} tone={incident.immediateDanger ? "stop" : incident.potentialConsequence === "FATAL" ? "attention" : "active"} />
        ))}
      </Panel>
    </div>
  );
}
