import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { SAFETY_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { substanceDetail } from "@/modules/safety/services/queries";
import { addSafetyDataSheet, approveSubstance, saveCoshhAssessment } from "@/modules/safety/services/assurance";
import { storageIncompatibility } from "@/modules/safety/domain/work";
import { Field, inputClass } from "../../ui";

export default async function SubstancePage({ params }: { params: Promise<{ substanceId: string }> }) {
  const session = await requireSession();
  const substance = await substanceDetail(session, (await params).substanceId);
  if (!substance) notFound();
  const currentSheet = substance.sheets.find((sheet) => !sheet.supersededAt);
  const clash = storageIncompatibility(substance.classifications, substance.others.flatMap((other) => other.classifications), []);
  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-[var(--color-ink-muted)]">{substance.reference} · {substance.status.replaceAll("_", " ").toLowerCase()}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">{substance.tradeName}</h1>
        <p className="mt-2 text-sm">{substance.signalWord} {substance.hazardStatements.join(" · ")}</p>
      </header>
      <section className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm">
        <p className="font-medium">Emergency</p>
        <p className="mt-2">{substance.emergencyResponse || "No emergency instructions recorded yet."}</p>
        <p className="mt-2">PPE · {substance.ppe || "Not recorded"}</p>
        <p className="mt-2">Sheet · {currentSheet ? `${currentSheet.versionLabel}, ${currentSheet.language}` : "No current safety data sheet"}</p>
      </section>
      {clash && <p className="text-sm text-amber-800">{clash}</p>}
      {!clash && substance.others.length > 0 && <p className="text-sm text-[var(--color-ink-muted)]">Other substances are stored in the same area. No configured incompatibility rule matched. Atlas does not guess chemical compatibility.</p>}
      <section>
        <h2 className="text-sm font-semibold">Where stock says it is</h2>
        {substance.stock.length === 0 && <p className="mt-2 text-sm text-[var(--color-ink-muted)]">No stock location is linked. Link a product when Inventory should show the quantity. Safety does not invent the quantity.</p>}
        <ul className="mt-2 text-sm">{substance.stock.map((row) => <li key={row.id}>{row.warehouse.name} · {row.quantity}</li>)}</ul>
      </section>
      {can(session, C.coshhManage) && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ActionForm action={addSafetyDataSheet} className="space-y-3 rounded-3xl border border-[var(--color-border)] bg-white p-5">
            <input type="hidden" name="substanceId" value={substance.id} />
            <Field label="SDS version"><input name="versionLabel" required className={inputClass} /></Field>
            <Field label="Supplier"><input name="supplier" className={inputClass} /></Field>
            <Field label="Issue date"><input type="date" name="issueDate" className={inputClass} /></Field>
            <Button type="submit">Replace safety data sheet</Button>
          </ActionForm>
          <ActionForm action={saveCoshhAssessment} className="space-y-3 rounded-3xl border border-[var(--color-border)] bg-white p-5">
            <input type="hidden" name="substanceId" value={substance.id} />
            <Field label="Task"><input name="task" required className={inputClass} /></Field>
            <Field label="Can it be eliminated?"><select name="canEliminate" className={inputClass}><option value="">Not answered</option><option value="yes">Yes</option><option value="no">No</option></select></Field>
            <Field label="Can it be substituted?"><select name="canSubstitute" className={inputClass}><option value="">Not answered</option><option value="yes">Yes</option><option value="no">No</option></select></Field>
            <Field label="If not, why"><input name="substitutionReason" className={inputClass} /></Field>
            <Field label="Controls"><textarea name="controls" className={inputClass} /></Field>
            <Button type="submit">Save COSHH assessment</Button>
          </ActionForm>
        </div>
      )}
      {can(session, C.coshhManage) && <ActionForm action={approveSubstance}><input type="hidden" name="substanceId" value={substance.id} /><Button type="submit" variant="primary">Approve for use</Button></ActionForm>}
      <ul className="text-sm">{substance.assessments.map((assessment) => <li key={assessment.id}>Revision {assessment.revision} · {assessment.task} · {assessment.status.toLowerCase()}</li>)}</ul>
      <ul className="text-xs text-[var(--color-ink-muted)]">{substance.sheets.map((sheet) => <li key={sheet.id}>{sheet.versionLabel}{sheet.supersededAt ? " · superseded" : " · current"}</li>)}</ul>
    </div>
  );
}
