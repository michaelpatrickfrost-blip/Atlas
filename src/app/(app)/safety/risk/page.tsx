import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { SAFETY_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { riskRegister, safetyProfile } from "@/modules/safety/services/queries";
import { createRisk, saveRiskMatrix } from "@/modules/safety/services/commands";
import { saveSubstance } from "@/modules/safety/services/assurance";
import { RISK_CATEGORIES, featureOn } from "@/modules/safety/domain/work";
import { Eyebrow, Field, Panel, Quiet, Row, inputClass } from "../ui";

export default async function RiskPage() {
  const session = await requireSession();
  assertCapability(session, C.riskRead);
  const [risks, profile] = await Promise.all([riskRegister(session.organisationId), safetyProfile(session.organisationId)]);
  const substances = featureOn(profile?.features ?? [], "coshh");
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">Risk</h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--color-ink-muted)]">A risk is the thing that could hurt someone, the controls that are actually in place, and the date it must be looked at again.</p>
      </header>
      <section>
        <Eyebrow>Register</Eyebrow>
        <Panel>
          {risks.length === 0 && <Quiet>No risks recorded yet.</Quiet>}
          {risks.map((risk) => (
            <Row key={risk.id} href={`/safety/risk/${risk.id}`} title={`${risk.reference} · ${risk.title}`} meta={risk.current?.residualRating ?? risk.status} tone={risk.current?.residualRating === "Critical" || risk.current?.residualRating === "High" ? "stop" : risk.reviews.length ? "attention" : "verified"} />
          ))}
        </Panel>
      </section>
      {can(session, C.riskCreate) && (
        <ActionForm action={createRisk} className="grid gap-4 rounded-3xl border border-[var(--color-border)] bg-white p-6 md:grid-cols-2">
          <h2 className="md:col-span-2 text-lg font-semibold">New risk assessment</h2>
          <Field label="Title"><input name="title" required className={inputClass} /></Field>
          <Field label="Category"><select name="category" className={inputClass}>{RISK_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></Field>
          <Field label="Hazard"><input name="hazard" required className={inputClass} /></Field>
          <Field label="Who might be harmed?"><input name="whoHarmed" className={inputClass} /></Field>
          <Field label="How?"><input name="howHarmed" className={inputClass} /></Field>
          <Field label="Existing controls"><input name="existingControls" className={inputClass} /></Field>
          <div className="md:col-span-2"><Button type="submit" variant="primary">Create assessment</Button></div>
        </ActionForm>
      )}
      {can(session, C.profileManage) && (
        <ActionForm action={saveRiskMatrix} className="flex flex-wrap items-end gap-3">
          <Field label="Risk matrix"><select name="size" className={inputClass}><option value="5">5×5 likelihood × severity</option><option value="4">4×4</option><option value="3">3×3</option><option value="qualitative">Qualitative</option></select></Field>
          <Button type="submit">Use this matrix</Button>
        </ActionForm>
      )}
      {substances && can(session, C.coshhRead) && (
        <section>
          <Eyebrow>Hazardous substances</Eyebrow>
          <p className="mt-2 max-w-xl text-sm text-[var(--color-ink-muted)]">COSHH lives with the risk, not in a folder of safety data sheets. A substance is approved for use only after the sheet and the assessment.</p>
          {can(session, C.coshhManage) && (
            <ActionForm action={saveSubstance} className="mt-4 grid gap-3 rounded-3xl border border-[var(--color-border)] bg-white p-6 md:grid-cols-2">
              <Field label="Trade name"><input name="tradeName" required className={inputClass} /></Field>
              <Field label="Manufacturer"><input name="manufacturer" className={inputClass} /></Field>
              <Field label="Use"><input name="useSummary" className={inputClass} /></Field>
              <Field label="Signal word"><input name="signalWord" className={inputClass} /></Field>
              <Field label="Emergency"><textarea name="emergencyResponse" className={inputClass} /></Field>
              <Field label="Storage"><textarea name="storageRequirements" className={inputClass} /></Field>
              <div className="md:col-span-2"><Button type="submit" variant="primary">Add substance</Button></div>
            </ActionForm>
          )}
        </section>
      )}
    </div>
  );
}
