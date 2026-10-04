import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { SAFETY_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { inspectionDetail } from "@/modules/safety/services/queries";
import { completeInspection } from "@/modules/safety/services/control";
import { commitmentLabel } from "@/modules/safety/domain/work";
import { Field, inputClass } from "../../../ui";

export default async function InspectionPage({ params }: { params: Promise<{ inspectionId: string }> }) {
  const session = await requireSession();
  const inspection = await inspectionDetail(session.organisationId, (await params).inspectionId);
  if (!inspection) notFound();
  const questions = Array.isArray(inspection.template?.questions) ? inspection.template.questions as Array<{ id: string; prompt: string }> : [];
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <p className="text-sm text-[var(--color-ink-muted)]">{inspection.reference}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">{inspection.title}</h1>
        <p className="mt-2 text-sm">{inspection.status.toLowerCase()} · {commitmentLabel(inspection.commitment === "PENDING" ? "PENDING" : "COMMITTED")}</p>
      </header>
      {inspection.status === "DUE" && can(session, C.inspectionExecute) && (
        <ActionForm action={completeInspection} className="space-y-4">
          <input type="hidden" name="inspectionId" value={inspection.id} />
          {questions.map((question) => (
            <fieldset key={question.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
              <legend className="text-sm font-medium">{question.prompt}</legend>
              <div className="mt-3 flex gap-4 text-sm">
                {["YES", "NO", "N/A"].map((answer) => <label key={answer} className="flex items-center gap-2"><input type="radio" name={`q_${question.id}`} value={answer} required />{answer}</label>)}
              </div>
              <Field label="Note"><input name={`note_${question.id}`} className={inputClass} /></Field>
            </fieldset>
          ))}
          <Button type="submit" variant="primary">Submit inspection</Button>
        </ActionForm>
      )}
      {inspection.status !== "DUE" && <p className="text-sm text-[var(--color-ink-muted)]">A failed answer creates an action. It is not stored as a silent fail.</p>}
    </div>
  );
}
