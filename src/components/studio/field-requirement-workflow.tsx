"use client";

import { useRef, useState, useTransition } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldRequirementEditor } from "./field-requirement-editor";
import { FieldMigrationControls, type FieldMigrationControlsProps } from "./field-migration-controls";
import { additionalFieldRequirementSchema, saveAdditionalFieldRequirementEvolutionSchema,
  type AdditionalFieldRequirementEvolutionEditor } from "@/core/studio/authoring/field-requirement-input";

export type FieldRequirementWorkflowProps = {
  initial: AdditionalFieldRequirementEvolutionEditor;
  save(input: unknown): Promise<AdditionalFieldRequirementEvolutionEditor>;
  migration: { initialPreparationId?: string; callbacks: FieldMigrationControlsProps["callbacks"] };
};
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
/** Friendly rule draft + original guided whole-cohort review. No direct required
 * activation, auto queries/batches or assumption that visibility grants access. */
export function FieldRequirementWorkflow({ initial, save, migration }: FieldRequirementWorkflowProps) {
  const [saved, setSaved] = useState(initial), [value, setValue] = useState(initial.initial);
  const [pending, start] = useTransition(), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const change = useRef(0), dirty = !same(saved.initial, value);
  const editable = saved.editable && initial.editable;
  const saveDraft = () => {
    if (pending || !editable || !dirty) return;
    const token = change.current, entered = structuredClone(value);
    setError(""); setNotice("");
    start(async () => {
      try {
        const submitted = additionalFieldRequirementSchema.parse(entered);
        const next = await save(saveAdditionalFieldRequirementEvolutionSchema.parse({ definitionId: saved.definitionId,
          revision: saved.revision, definitionRevision: saved.definitionRevision, sourceVersionId: saved.sourceVersionId, requirement: submitted }));
        if (next.definitionId !== saved.definitionId || next.revision !== saved.revision + 1
          || next.definitionRevision !== saved.definitionRevision || next.sourceVersionId !== saved.sourceVersionId
          || !same(additionalFieldRequirementSchema.parse(next.initial), submitted)) throw new Error("CONFLICT");
        if (token !== change.current) return;
        setSaved(next); setValue(next.initial); setNotice("Rules saved as a draft. Review all existing records before making them live.");
      } catch (failure) {
        if (token !== change.current) return;
        setError(failure instanceof Error && /CONFLICT|REVIEW_CHANGED/.test(failure.message)
          ? "The saved field changed. Your rule choices are kept. Reopen this field to compare before trying again."
          : failure instanceof Error && /FORBIDDEN|CAPABILITY|UNAUTHORI/.test(failure.message)
            ? "Your current access does not allow this rule change. Your live field and choices are kept."
            : "These rules could not be saved. Your choices are kept; check the conditions and try again.");
      }
    });
  };
  return <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.65fr)]">
    <section className="space-y-5"><FieldRequirementEditor value={value} choices={saved.choices} disabled={pending || !editable}
      readOnlyReason={initial.reason ?? saved.reason} onChange={next => { change.current++; setValue(next); setError(""); setNotice(""); }}/>
      <div className="rounded-3xl border border-slate-200 bg-white p-5"><Button type="button" variant="primary" disabled={pending || !editable || !dirty} onClick={saveDraft}>
        <Save size={16}/>{pending ? "Saving rules…" : "Save rule draft"}</Button>
        <p className="mt-3 text-sm leading-6 text-slate-500">Your current field stays live. Atlas reviews every affected record, checks your access again and keeps the change history.</p>
        {dirty && <p className="mt-2 text-sm text-blue-700">Save your rules before reviewing existing records.</p>}
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="mt-3 text-sm text-blue-700">{notice}</p>}
      </div>
    </section>
    <aside><FieldMigrationControls definitionId={saved.definitionId} initialPreparationId={migration.initialPreparationId}
      disabled={pending || dirty} callbacks={migration.callbacks} prepareInput={() => ({ operationId: crypto.randomUUID(),
        definitionId: saved.definitionId, definitionRevision: saved.definitionRevision, draftRevision: saved.revision,
        sourceVersionId: saved.sourceVersionId, conversion: { kind: "same_type" } })}
      onPreparationChange={id => { const url = new URL(window.location.href); if (id) url.searchParams.set("review", id); else url.searchParams.delete("review");
        window.history.replaceState(null, "", `${url.pathname}${url.search}`); }}/></aside>
  </div>;
}
