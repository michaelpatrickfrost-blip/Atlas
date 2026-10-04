import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SAFETY_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { safetyReport } from "@/modules/safety/services/queries";
import { Eyebrow, Panel, Quiet, Row } from "../ui";

export default async function SafetyReports() {
  const session = await requireSession();
  assertCapability(session, C.reportRead);
  const report = await safetyReport(session);
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--color-ink-muted)]">Leading and lagging signals stay separate. There is no single safety score.</p>
      </header>
      <section className="max-w-2xl space-y-2 text-sm leading-relaxed">
        {report.narrative.map((line) => <p key={line}>{line}</p>)}
        <p className="text-[var(--color-ink-muted)]">{report.rate ?? "A rate per hours is not shown because reliable exposure hours are not available. Raw counts are not compared across sites of different size."}</p>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <Eyebrow>Lagging</Eyebrow>
          <Panel>
            <Row href="/safety/incidents" title="High-potential events this month" meta={String(report.highPotential.length)} tone={report.highPotential.length ? "stop" : "verified"} />
          </Panel>
        </div>
        <div>
          <Eyebrow>Leading</Eyebrow>
          <Panel>
            <Row href="/safety/assurance" title="Open actions" meta={String(report.openActions.length)} />
            <Row href="/safety/assurance" title="Overdue actions" meta={String(report.overdueActions.length)} tone={report.overdueActions.length ? "attention" : "verified"} />
            <Row href="/safety/risk" title="High residual risks" meta={String(report.highResidual.length)} tone={report.highResidual.length ? "attention" : "verified"} />
            <Row href="/safety/assurance" title="Inspections completed" meta={report.inspectionCompletion == null ? "No inspections" : `${report.inspectionCompletion}%`} />
            <Row href="/safety/assurance" title="Competence current / expiring / expired" meta={`${report.competence.current} / ${report.competence.expiring} / ${report.competence.expired}`} />
          </Panel>
        </div>
      </section>
      <section>
        <Eyebrow>High potential</Eyebrow>
        <Panel>
          {report.highPotential.length === 0 && <Quiet>No high-potential events this month.</Quiet>}
          {report.highPotential.map((incident) => <Row key={incident.id} href={`/safety/incidents/${incident.id}`} title={`${incident.reference} · ${incident.summary}`} meta={incident.potentialConsequence.replaceAll("_", " ").toLowerCase()} tone="stop" />)}
        </Panel>
      </section>
    </div>
  );
}
