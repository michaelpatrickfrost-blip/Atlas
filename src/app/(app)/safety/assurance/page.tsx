import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { SAFETY_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { assuranceBoard, safetyProfile } from "@/modules/safety/services/queries";
import { createInspection, saveStatutoryCheck } from "@/modules/safety/services/control";
import { acknowledgeDocument, addAuditFinding, approveAudit, saveAudit, saveChange, saveCompetence, saveSafetyDocument } from "@/modules/safety/services/assurance";
import { PUWER_CHECKS, featureOn } from "@/modules/safety/domain/work";
import { advanceAction } from "@/modules/safety/services/commands";
import { Eyebrow, Field, Panel, Quiet, Row, inputClass } from "../ui";

export default async function AssurancePage() {
  const session = await requireSession();
  if (!can(session, C.inspectionExecute) && !can(session, C.actionRead) && !can(session, C.documentRead) && !can(session, C.auditExecute)) {
    const { assertCapability } = await import("@/core/permissions/check");
    assertCapability(session, C.inspectionExecute);
  }
  const [board, profile] = await Promise.all([assuranceBoard(session), safetyProfile(session.organisationId)]);
  const features = profile?.features ?? [];
  const actions = can(session, C.actionRead) ? await import("@/core/db/client").then(({ db }) => db.safetyAction.findMany({ where: { organisationId: session.organisationId, status: { in: ["OPEN", "IN_PROGRESS", "COMPLETE"] } }, orderBy: { dueDate: "asc" }, take: 30 })) : [];
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">Assurance</h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--color-ink-muted)]">Are the controls actually working? Inspections, audits, statutory checks, training and documents live here.</p>
      </header>
      <section>
        <Eyebrow>Actions</Eyebrow>
        <Panel>
          {actions.length === 0 && <Quiet>No open actions.</Quiet>}
          {actions.map((action) => (
            <div key={action.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm">
              <span>{action.reference} · {action.title}</span>
              <span className="text-[var(--color-ink-muted)]">{action.status.toLowerCase()}{action.dueDate ? ` · ${action.dueDate.toLocaleDateString("en-GB")}` : ""}</span>
              {can(session, C.actionManage) && <ActionForm action={advanceAction}><input type="hidden" name="actionId" value={action.id} /><input type="hidden" name="status" value="COMPLETE" /><Button type="submit">Complete</Button></ActionForm>}
            </div>
          ))}
        </Panel>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <Eyebrow>Inspections</Eyebrow>
          <Panel>
            {board.inspections.length === 0 && <Quiet>No inspections scheduled.</Quiet>}
            {board.inspections.map((inspection) => <Row key={inspection.id} href={`/safety/assurance/inspections/${inspection.id}`} title={inspection.title} meta={inspection.status.toLowerCase()} tone={inspection.status === "FAILED" ? "stop" : inspection.status === "COMPLETE" ? "verified" : "attention"} />)}
          </Panel>
        </div>
        <div>
          <Eyebrow>Statutory checks</Eyebrow>
          <Panel>
            {board.checks.length === 0 && <Quiet>No examinations recorded.</Quiet>}
            {board.checks.map((check) => <Row key={check.id} href={`/safety/equipment/${check.id}`} title={`${check.reference} · ${check.assetLabel}`} meta={check.overall ?? check.status} tone={check.seriousDefect ? "stop" : "verified"} />)}
          </Panel>
        </div>
      </section>
      <section>
        <Eyebrow>Audits</Eyebrow>
        <Panel>
          {board.audits.length === 0 && <Quiet>No audits.</Quiet>}
          {board.audits.map((audit) => (
            <div key={audit.id} className="px-5 py-4 text-sm">
              <p className="font-medium">{audit.reference} · {audit.title}</p>
              <p className="text-[var(--color-ink-muted)]">{audit.status.toLowerCase()} · {audit.findings.length} findings{audit.approvedAt ? " · approved, and kept as approved" : ""}</p>
              {!audit.approvedAt && can(session, C.auditExecute) && (
                <ActionForm action={addAuditFinding} className="mt-3 flex flex-wrap gap-2">
                  <input type="hidden" name="auditId" value={audit.id} />
                  <input name="statement" placeholder="Finding" className={inputClass} />
                  <select name="kind" className={inputClass}><option>OBSERVATION</option><option>MINOR</option><option>MAJOR</option><option>CRITICAL</option><option>CONFORMANCE</option></select>
                  <label className="flex items-center gap-2"><input type="checkbox" name="createAction" defaultChecked /> Action</label>
                  <Button type="submit">Add</Button>
                </ActionForm>
              )}
              {!audit.approvedAt && can(session, C.auditManage) && <ActionForm action={approveAudit} className="mt-2"><input type="hidden" name="auditId" value={audit.id} /><Button type="submit">Approve audit</Button></ActionForm>}
            </div>
          ))}
        </Panel>
      </section>
      <section>
        <Eyebrow>Competence</Eyebrow>
        <Panel>
          {board.competences.length === 0 && <Quiet>No safety competence recorded against People.</Quiet>}
          {board.competences.map((item) => {
            const person = board.employees.find((employee) => employee.id === item.employeeId);
            return <Row key={item.id} href="/people" title={`${person ? `${person.firstName} ${person.lastName}` : "Person"} · ${item.label}`} meta={item.expiresAt ? item.expiresAt.toLocaleDateString("en-GB") : "No expiry"} tone={item.expiresAt && item.expiresAt < new Date() ? "stop" : "verified"} />;
          })}
        </Panel>
      </section>
      {(featureOn(features, "dse") || featureOn(features, "fire") || featureOn(features, "first_aid")) && (
        <section>
          <Eyebrow>Workplace</Eyebrow>
          <Panel>
            {board.records.filter((record) => ["DSE_ASSESSMENT", "FIRE_ASSESSMENT", "FIRE_DRILL", "FIRST_AID_NEED", "FIRST_AID_KIT", "EMERGENCY_PLAN"].includes(record.kind)).map((record) => (
              <Row key={record.id} href={`/safety/records/${record.id}`} title={record.title} meta={record.kind.replaceAll("_", " ").toLowerCase()} />
            ))}
          </Panel>
        </section>
      )}
      <section className="grid gap-4 lg:grid-cols-2">
        {can(session, C.inspectionManage) && <ActionForm action={createInspection} className="space-y-3 rounded-3xl border border-[var(--color-border)] bg-white p-5"><h2 className="font-semibold">Inspection</h2><Field label="Name"><input name="title" required className={inputClass} /></Field><Field label="One question per line"><textarea name="questions" className={inputClass} rows={4} placeholder={"Fire exit clear\nExtinguisher in date"} /></Field><Button type="submit">Schedule</Button></ActionForm>}
        {can(session, C.statutoryManage) && <ActionForm action={saveStatutoryCheck} className="space-y-3 rounded-3xl border border-[var(--color-border)] bg-white p-5"><h2 className="font-semibold">Statutory check</h2><Field label="Equipment"><input name="assetLabel" required className={inputClass} /></Field><Field label="Kind"><select name="kind" className={inputClass}><option>LOLER</option><option>PUWER</option><option>LEV</option><option>FIRE_EQUIPMENT</option><option>OTHER</option></select></Field><Field label="Next due"><input type="date" name="nextDueAt" className={inputClass} /></Field>{PUWER_CHECKS.map(([key, label]) => <label key={key} className="flex items-center justify-between text-sm">{label}<select name="check" defaultValue={`${key}:PASS`} className="rounded-lg border px-2 py-1"><option value={`${key}:PASS`}>Pass</option><option value={`${key}:FAIL`}>Fail</option><option value={`${key}:N/A`}>N/A</option></select></label>)}<label className="flex items-center gap-2 text-sm"><input type="checkbox" name="seriousDefect" /> Serious defect</label><Button type="submit">Save examination</Button></ActionForm>}
        {can(session, C.competenceManage) && <ActionForm action={saveCompetence} className="space-y-3 rounded-3xl border border-[var(--color-border)] bg-white p-5"><h2 className="font-semibold">Competence</h2><Field label="Person"><select name="employeeId" className={inputClass}>{board.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName}</option>)}</select></Field><Field label="Key"><input name="key" placeholder="FORKLIFT" required className={inputClass} /></Field><Field label="Expires"><input type="date" name="expiresAt" className={inputClass} /></Field><Button type="submit">Save</Button></ActionForm>}
        {can(session, C.riskRead) && <Link href="/safety/workplace" className="rounded-3xl border bg-white p-5"><h2 className="font-semibold">Workplace safety register</h2><p className="mt-2 text-sm text-[var(--color-ink-muted)]">Fire, DSE, first aid, contractors, PPE, lone working and more. Guided findings, responsible people and review dates.</p><span className="mt-3 block text-sm text-[var(--color-atlas-blue)]">Open workplace records →</span></Link>}
        {can(session, C.auditManage) && <ActionForm action={saveAudit} className="space-y-3 rounded-3xl border border-[var(--color-border)] bg-white p-5"><h2 className="font-semibold">Audit</h2><Field label="Title"><input name="title" required className={inputClass} /></Field><Field label="Scope"><input name="scope" className={inputClass} /></Field><Button type="submit">Plan audit</Button></ActionForm>}
        {can(session, C.documentManage) && <ActionForm action={saveSafetyDocument} className="space-y-3 rounded-3xl border border-[var(--color-border)] bg-white p-5"><h2 className="font-semibold">Document</h2><Field label="Title"><input name="title" required className={inputClass} /></Field><Field label="Body"><textarea name="body" className={inputClass} /></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="requiresAcknowledgement" /> Acknowledgement required</label><Button type="submit">Save draft</Button></ActionForm>}
        {can(session, C.changeManage) && <ActionForm action={saveChange} className="space-y-3 rounded-3xl border border-[var(--color-border)] bg-white p-5"><h2 className="font-semibold">Management of change</h2><Field label="Change"><input name="title" required className={inputClass} /></Field><Field label="Trigger"><input name="trigger" className={inputClass} placeholder="NEW_EQUIPMENT" /></Field><Button type="submit">Propose</Button></ActionForm>}
      </section>
      <section>
        <Eyebrow>Documents and duties</Eyebrow>
        <ul className="mt-3 space-y-2 text-sm">
          {board.documents.map((document) => <li key={document.id} className="flex flex-wrap items-center justify-between gap-3">{document.reference} rev {document.revision} · {document.title} · {document.status.toLowerCase()}{document.status === "ACTIVE" && document.requiresAcknowledgement && can(session, C.documentRead) && <ActionForm action={acknowledgeDocument}><input type="hidden" name="documentId" value={document.id} /><Button type="submit">Acknowledge</Button></ActionForm>}</li>)}
          {board.obligations.map((item) => <li key={item.id}>{item.topic} · {item.status.replaceAll("_", " ").toLowerCase()} · {item.source}</li>)}
          {board.changes.map((change) => <li key={change.id}>{change.reference} · {change.title} · {change.status.toLowerCase()}</li>)}
          {board.substances.map((substance) => <li key={substance.id}><Link href={`/safety/substances/${substance.id}`} className="text-[var(--color-atlas-blue)]">{substance.reference} · {substance.tradeName}</Link> · {substance.status.toLowerCase()}</li>)}
        </ul>
      </section>
    </div>
  );
}
