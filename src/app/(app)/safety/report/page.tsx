import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SAFETY_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { reportIncident } from "@/modules/safety/services/commands";
import { CONSEQUENCE_LEVELS, INCIDENT_KINDS } from "@/modules/safety/domain/work";
import { safetyProfile } from "@/modules/safety/services/queries";
import { Field, inputClass } from "../ui";

export default async function ReportPage() {
  const session = await requireSession();
  assertCapability(session, C.incidentReport);
  const profile = await safetyProfile(session.organisationId);
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">What happened?</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">A few facts are enough. Someone else can investigate. This is saved on the server when you send it.</p>
      </header>
      <ActionForm action={reportIncident} className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-white p-6">
        <Field label="What happened?"><textarea name="summary" required className={inputClass} rows={3} /></Field>
        <Field label="Where?"><input name="where" className={inputClass} /></Field>
        <Field label="When?"><input type="datetime-local" name="occurredAt" className={inputClass} /></Field>
        <Field label="Who was involved?"><input name="involved" className={inputClass} /></Field>
        <Field label="Kind"><select name="kind" className={inputClass} defaultValue="NEAR_MISS">{INCIDENT_KINDS.map((kind) => <option key={kind} value={kind}>{kind.replaceAll("_", " ").toLowerCase()}</option>)}</select></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="immediateDanger" /> Someone could still be hurt</label>
        {profile?.anonymousReports && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="anonymous" /> Send without my name</label>}
        <details className="text-sm">
          <summary className="cursor-pointer text-[var(--color-ink-muted)]">Add consequence, if you know it</summary>
          <div className="mt-3 grid gap-3">
            <Field label="What actually happened"><select name="actualConsequence" className={inputClass}>{CONSEQUENCE_LEVELS.map((level) => <option key={level} value={level}>{level.replaceAll("_", " ").toLowerCase()}</option>)}</select></Field>
            <Field label="What could have happened"><select name="potentialConsequence" className={inputClass}>{CONSEQUENCE_LEVELS.map((level) => <option key={level} value={level}>{level.replaceAll("_", " ").toLowerCase()}</option>)}</select></Field>
            <Field label="Photograph or evidence note"><input name="evidence" className={inputClass} /></Field>
          </div>
        </details>
        <Button type="submit" variant="primary">Send report</Button>
      </ActionForm>
    </div>
  );
}
