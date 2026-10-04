import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { SAFETY_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { riskDetail } from "@/modules/safety/services/queries";
import { addControl, approveAssessment, rateAssessment, requestRiskReview, reviseAssessment } from "@/modules/safety/services/commands";
import { CONTROL_HIERARCHY, CONTROL_LABELS, REVIEW_TRIGGERS } from "@/modules/safety/domain/work";
import { Eyebrow, Field, inputClass } from "../../ui";

export default async function RiskRecord({ params }: { params: Promise<{ riskId: string }> }) {
  const session = await requireSession();
  assertCapability(session, C.riskRead);
  const { riskId } = await params;
  const risk = await riskDetail(session.organisationId, riskId);
  if (!risk || !risk.current) notFound();
  const current = risk.current;
  const draft = current.status === "DRAFT";
  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-[var(--color-ink-muted)]">{risk.reference} · {risk.category}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">{risk.title}</h1>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">Revision {current.revision} · {current.status.toLowerCase()}{current.effectiveFrom ? ` · effective ${current.effectiveFrom.toLocaleDateString("en-GB")}` : ""}</p>
      </header>
      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-3xl border border-[var(--color-border)] bg-white p-5">
          <Eyebrow>Initial risk</Eyebrow>
          <p className="mt-3 text-3xl font-semibold">{current.initialRating ?? "Not rated"}</p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-muted)]">{current.initialExplanation ?? "Rate likelihood and severity. The explanation stays with the number."}</p>
        </article>
        <article className="rounded-3xl border border-[var(--color-border)] bg-white p-5">
          <Eyebrow>Controls</Eyebrow>
          <ul className="mt-3 space-y-2 text-sm">
            {current.controls.length === 0 && <li className="text-[var(--color-ink-muted)]">No controls on this revision yet.</li>}
            {current.controls.map((control) => <li key={control.id}>{control.inPlace ? "In place" : "Proposed"} · {CONTROL_LABELS[control.hierarchy as keyof typeof CONTROL_LABELS] ?? control.hierarchy} · {control.description}</li>)}
          </ul>
        </article>
        <article className="rounded-3xl border border-[var(--color-border)] bg-white p-5">
          <Eyebrow>Residual risk</Eyebrow>
          <p className={`mt-3 text-3xl font-semibold ${current.residualRating === "High" || current.residualRating === "Critical" ? "text-rose-700" : ""}`}>{current.residualRating ?? "Not rated"}</p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-muted)]">{current.residualExplanation ?? "A lower number is not, by itself, proof the risk is controlled."}</p>
        </article>
      </section>
      <section className="rounded-3xl border border-[var(--color-border)] bg-white p-6 text-sm leading-relaxed">
        <p><span className="text-[var(--color-ink-muted)]">Hazard. </span>{current.hazard}</p>
        <p className="mt-3"><span className="text-[var(--color-ink-muted)]">Who might be harmed. </span>{current.whoHarmed || "Not recorded"}</p>
        <p className="mt-3"><span className="text-[var(--color-ink-muted)]">How. </span>{current.howHarmed || "Not recorded"}</p>
        <p className="mt-3"><span className="text-[var(--color-ink-muted)]">Next review. </span>{current.reviewDate ? current.reviewDate.toLocaleDateString("en-GB") : "Not set"}</p>
      </section>
      {draft && can(session, C.riskCreate) && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ActionForm action={addControl} className="space-y-3 rounded-3xl border border-[var(--color-border)] bg-white p-5">
            <input type="hidden" name="assessmentId" value={current.id} />
            <Field label="Control"><input name="description" required className={inputClass} /></Field>
            <Field label="Hierarchy"><select name="hierarchy" className={inputClass}>{CONTROL_HIERARCHY.map((item) => <option key={item} value={item}>{CONTROL_LABELS[item]}</option>)}</select></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="inPlace" /> Already in place</label>
            <Button type="submit">Add control</Button>
          </ActionForm>
          <ActionForm action={rateAssessment} className="space-y-3 rounded-3xl border border-[var(--color-border)] bg-white p-5">
            <input type="hidden" name="assessmentId" value={current.id} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Initial likelihood"><input name="initialLikelihood" className={inputClass} /></Field>
              <Field label="Initial severity"><input name="initialSeverity" className={inputClass} /></Field>
              <Field label="Residual likelihood"><input name="residualLikelihood" className={inputClass} /></Field>
              <Field label="Residual severity"><input name="residualSeverity" className={inputClass} /></Field>
            </div>
            <Field label="Or a qualitative initial rating"><input name="initialQualitative" className={inputClass} placeholder="Low, Medium or High" /></Field>
            <Field label="Qualitative residual rating"><input name="residualQualitative" className={inputClass} /></Field>
            <Field label="Review date"><input type="date" name="reviewDate" className={inputClass} /></Field>
            <Field label="Evidence"><input name="evidenceNote" className={inputClass} /></Field>
            <Button type="submit">Rate this revision</Button>
          </ActionForm>
        </div>
      )}
      {draft && can(session, C.riskApprove) && <ActionForm action={approveAssessment}><input type="hidden" name="assessmentId" value={current.id} /><Button type="submit" variant="primary">Approve revision {current.revision}</Button></ActionForm>}
      {can(session, C.riskCreate) && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ActionForm action={reviseAssessment} className="space-y-3">
            <input type="hidden" name="riskId" value={risk.id} />
            <Field label="Why a new revision?"><input name="changeReason" required className={inputClass} /></Field>
            <Button type="submit">Start revision {current.revision + 1}</Button>
          </ActionForm>
          <ActionForm action={requestRiskReview} className="space-y-3">
            <input type="hidden" name="riskId" value={risk.id} />
            <Field label="Review because"><select name="reason" className={inputClass}>{REVIEW_TRIGGERS.map((trigger) => <option key={trigger} value={trigger}>{trigger.replaceAll("_", " ").toLowerCase()}</option>)}</select></Field>
            <Button type="submit">Request review</Button>
          </ActionForm>
        </div>
      )}
      <section>
        <Eyebrow>Previous revisions</Eyebrow>
        <ul className="mt-3 space-y-2 text-sm">
          {risk.assessments.map((assessment) => <li key={assessment.id}>Revision {assessment.revision} · {assessment.status.toLowerCase()} · {assessment.changeReason ?? "No change reason"} · {assessment.authorUserId}</li>)}
        </ul>
      </section>
    </div>
  );
}
