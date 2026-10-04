import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { SAFETY_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { incidentDetail } from "@/modules/safety/services/queries";
import { addCause, createSafetyAction, openInvestigation, reviewRiddor, saveImmediateControl, saveRootCause } from "@/modules/safety/services/commands";
import { CAUSE_CATEGORIES, CONSEQUENCE_LEVELS, INVESTIGATION_METHODS } from "@/modules/safety/domain/work";
import { Eyebrow, Field, inputClass } from "../../ui";

export default async function IncidentRecord({ params }: { params: Promise<{ incidentId: string }> }) {
  const session = await requireSession();
  assertCapability(session, C.incidentRead);
  const incident = await incidentDetail(session, (await params).incidentId);
  if (!incident) notFound();
  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-[var(--color-ink-muted)]">{incident.reference} · {incident.kind.replaceAll("_", " ").toLowerCase()}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">{incident.summary}</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{incident.whereLabel ?? "Location not recorded"} · {incident.occurredAt.toLocaleString("en-GB")}</p>
      </header>
      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl border border-[var(--color-border)] bg-white p-5"><Eyebrow>Actual</Eyebrow><p className="mt-3 text-2xl font-semibold">{incident.actualConsequence.replaceAll("_", " ").toLowerCase()}</p></article>
        <article className="rounded-3xl border border-[var(--color-border)] bg-white p-5"><Eyebrow>Potential</Eyebrow><p className={`mt-3 text-2xl font-semibold ${incident.potentialConsequence === "FATAL" ? "text-rose-700" : ""}`}>{incident.potentialConsequence.replaceAll("_", " ").toLowerCase()}</p></article>
      </section>
      <ul className="grid gap-2 text-sm sm:grid-cols-2">
        {[
          ["Anyone still at risk", incident.anyoneStillAtRisk],
          ["Isolation", incident.isolationRequired],
          ["Area closed", incident.areaClosureRequired],
          ["First aid", incident.firstAidRequired],
          ["Emergency services", incident.emergencyServicesRequired],
          ["Management told", incident.managementNotified],
        ].map(([label, done]) => <li key={String(label)} className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3">{done ? "Done" : "Not confirmed"} · {label}</li>)}
      </ul>
      {can(session, C.incidentInvestigate) && (
        <ActionForm action={saveImmediateControl} className="grid gap-3 rounded-3xl border border-[var(--color-border)] bg-white p-5 md:grid-cols-2">
          <input type="hidden" name="incidentId" value={incident.id} />
          {["anyoneStillAtRisk", "isolationRequired", "areaClosureRequired", "firstAidRequired", "emergencyServicesRequired", "managementNotified"].map((name) => <label key={name} className="flex items-center gap-2 text-sm"><input type="checkbox" name={name} /> {name.replaceAll(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)}</label>)}
          <Field label="Actual"><select name="actualConsequence" defaultValue={incident.actualConsequence} className={inputClass}>{CONSEQUENCE_LEVELS.map((level) => <option key={level}>{level}</option>)}</select></Field>
          <Field label="Potential"><select name="potentialConsequence" defaultValue={incident.potentialConsequence} className={inputClass}>{CONSEQUENCE_LEVELS.map((level) => <option key={level}>{level}</option>)}</select></Field>
          <div className="md:col-span-2"><Button type="submit">Save immediate control</Button></div>
        </ActionForm>
      )}
      <section className="space-y-4">
        <Eyebrow>Investigation</Eyebrow>
        <p className="text-sm text-[var(--color-ink-muted)]">{incident.investigation ? incident.investigation.method.replaceAll("_", " ").toLowerCase() : "Not opened. A paper cut does not need a formal method. A high-potential event does."}</p>
        {incident.investigation?.causes.map((cause) => <p key={cause.id} className="text-sm">{cause.category} · {cause.statement}</p>)}
        {incident.investigation?.rootCause && <p className="text-sm">Root cause · {incident.investigation.rootCause}</p>}
        {can(session, C.incidentInvestigate) && (
          <div className="grid gap-4 lg:grid-cols-2">
            <ActionForm action={openInvestigation} className="space-y-3">
              <input type="hidden" name="incidentId" value={incident.id} />
              <Field label="Method"><select name="method" className={inputClass}>{INVESTIGATION_METHODS.map((method) => <option key={method} value={method}>{method.replaceAll("_", " ").toLowerCase()}</option>)}</select></Field>
              <Field label="Timeline"><textarea name="timeline" className={inputClass} /></Field>
              <Button type="submit">Open investigation</Button>
            </ActionForm>
            {incident.investigation && (
              <ActionForm action={addCause} className="space-y-3">
                <input type="hidden" name="investigationId" value={incident.investigation.id} />
                <Field label="Contributor"><select name="category" className={inputClass}>{CAUSE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></Field>
                <Field label="What contributed"><input name="statement" required className={inputClass} /></Field>
                <p className="text-xs text-[var(--color-ink-muted)]">A category describes the system. It is not a finding that a person is to blame.</p>
                <Button type="submit">Add contributor</Button>
              </ActionForm>
            )}
          </div>
        )}
        {incident.investigation && can(session, C.incidentInvestigate) && (
          <ActionForm action={saveRootCause} className="grid gap-3 md:grid-cols-3">
            <input type="hidden" name="investigationId" value={incident.investigation.id} />
            <Field label="Immediate causes"><input name="immediateCauses" defaultValue={incident.investigation.immediateCauses ?? ""} className={inputClass} /></Field>
            <Field label="Underlying causes"><input name="underlyingCauses" defaultValue={incident.investigation.underlyingCauses ?? ""} className={inputClass} /></Field>
            <Field label="Root cause"><input name="rootCause" defaultValue={incident.investigation.rootCause ?? ""} className={inputClass} /></Field>
            <Button type="submit">Save causes</Button>
          </ActionForm>
        )}
      </section>
      {can(session, C.riddorReview) && (
        <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6">
          <Eyebrow>RIDDOR review</Eyebrow>
          <p className="mt-3 text-sm leading-relaxed">{incident.assistance.guidance}</p>
          {incident.assistance.potentialCategory && <p className="mt-2 text-sm">Potential category · {incident.assistance.potentialCategory}. {incident.assistance.reminder}</p>}
          <p className="mt-2 text-xs text-[var(--color-ink-muted)]">{incident.riddor?.ruleVersion ?? incident.assistance.ruleVersion}. Atlas does not send this to the regulator.</p>
          <ActionForm action={reviewRiddor} className="mt-4 grid gap-3 md:grid-cols-2">
            <input type="hidden" name="incidentId" value={incident.id} />
            <Field label="Work related?"><select name="workRelated" className={inputClass} defaultValue={incident.riddor?.workRelated == null ? "" : incident.riddor.workRelated ? "yes" : "no"}><option value="">Not reviewed</option><option value="yes">Yes</option><option value="no">No</option></select></Field>
            <Field label="Person"><select name="personClass" className={inputClass} defaultValue={incident.riddor?.personClass ?? ""}><option value="">Unknown</option><option value="EMPLOYEE">Employee</option><option value="NON_WORKER">Person not at work</option></select></Field>
            <Field label="Outcome code"><select name="outcome" className={inputClass} defaultValue={incident.riddor?.outcome ?? ""}><option value="">Not selected</option><option value="FATAL">Death</option><option value="SPECIFIED_INJURY">Specified injury</option><option value="OVER_SEVEN_DAY">Over-seven-day</option><option value="DISEASE">Occupational disease</option><option value="DANGEROUS_OCCURRENCE">Dangerous occurrence</option><option value="GAS">Gas event</option></select></Field>
            <Field label="Decision"><select name="decision" className={inputClass} defaultValue={incident.riddor?.decision ?? "PENDING"}><option value="PENDING">Review required</option><option value="REPORTABLE">Mark reportable</option><option value="NOT_REPORTABLE">Mark not reportable</option></select></Field>
            <Field label="Why"><input name="rationale" defaultValue={incident.riddor?.rationale ?? ""} className={inputClass} /></Field>
            <Field label="Submission reference, if you reported it"><input name="submissionReference" defaultValue={incident.riddor?.submissionReference ?? ""} className={inputClass} /></Field>
            <div className="md:col-span-2"><Button type="submit">Save RIDDOR review</Button></div>
          </ActionForm>
        </section>
      )}
      {can(session, C.actionManage) && (
        <ActionForm action={createSafetyAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="sourceType" value="INCIDENT" />
          <input type="hidden" name="sourceId" value={incident.id} />
          <input type="hidden" name="capaStage" value="CORRECTIVE" />
          <Field label="Corrective action"><input name="title" required className={inputClass} /></Field>
          <Button type="submit">Create action</Button>
        </ActionForm>
      )}
      <ul className="text-sm">{incident.actions.map((action) => <li key={action.id}>{action.reference} · {action.title} · {action.status.toLowerCase()}</li>)}</ul>
      {incident.links.length > 0 && <ul className="text-sm">{incident.links.map((link) => <li key={link.id}>{link.label ?? link.targetType} · {link.targetId}</li>)}</ul>}
    </div>
  );
}
