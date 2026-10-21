"use client";

import { useRef, useState, useTransition } from "react";
import { ArrowRight, Eye, Save } from "lucide-react";
import { AdditionalFieldSetup, type AdditionalFieldSetupProps } from "./additional-field-setup";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/service-fields";
import { readAdditionalFieldSetup } from "@/core/studio/authoring/field-form-input";
import { additionalFieldEvolutionDraftSchema } from "@/core/studio/authoring/field-evolution-contract";
import { additionalFieldMigrationSetupSchema, additionalFieldMigrationPreviewSchema,
  type AdditionalFieldMigrationSetup, type AdditionalFieldMigrationPreview } from "@/core/studio/authoring/field-migration-contract";
import { fieldChangeConversion, fieldChangeChoices } from "./field-change-model";

export type FieldChangeEditorProps = Pick<AdditionalFieldSetupProps, "fieldTypes" | "referenceTargets"> & {
  initial: AdditionalFieldMigrationSetup; canPreview: boolean;
  callbacks: { save(input: unknown): Promise<AdditionalFieldMigrationSetup>; preview(input: unknown): Promise<AdditionalFieldMigrationPreview> };
};
const choices = (setup: AdditionalFieldMigrationSetup) => setup.target.kind === "editable" &&
  (setup.target.initial.type === "enum" || setup.target.initial.type === "multi_enum") ? setup.target.initial.settings.choices : [];
const resultLabel = { ready: "Ready", loss: "Needs loss review", invalid: "Needs attention" };
const issueLabel = { INVALID_SOURCE: "The current value needs correction.", INVALID_TARGET: "The new settings cannot accept this value.",
  UNMAPPED_VALUE: "Choose how to map this existing value.", LOSS_REQUIRES_REVIEW: "This change would remove information.", FIELD_STORAGE_INVALID: "The saved value needs its existing support workflow." };
function message(error: unknown) {
  if (error instanceof Error && error.name === "ZodError") return "Check the field settings and conversion choices, then try again.";
  if (error instanceof Error && /REVIEW_CHANGED|CONFLICT/.test(error.message)) return "The saved field changed. Your entries are still here. Reopen this field to compare with the latest saved draft.";
  if (error instanceof Error && /FORBIDDEN|UNAUTHORI|CAPABILITY|RESTRICTED|ACCESS_DENIED/.test(error.message)) return "Your current access does not allow this field change or preview. Your live field is unchanged.";
  return error instanceof Error ? error.message : "The field change could not be completed. Your entries are still here.";
}
export function FieldChangeEditor({ initial, fieldTypes, referenceTargets, canPreview, callbacks }: FieldChangeEditorProps) {
  const [saved, setSaved] = useState(initial), [dirty, setDirty] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [preview, setPreview] = useState<AdditionalFieldMigrationPreview | null>(null), [pending, start] = useTransition();
  const [targetType, setTargetType] = useState(initial.target.kind === "editable" ? initial.target.initial.type : "string");
  const [targetChoices, setTargetChoices] = useState(choices(initial)), [mappingRows, setMappingRows] = useState(1);
  const form = useRef<HTMLFormElement>(null), change = useRef(0);
  if (saved.source.kind !== "editable" || saved.target.kind !== "editable") return <section className="rounded-3xl border border-slate-200 bg-white p-7">
    <h2 className="text-xl font-semibold">Keep this field in its reviewed workflow</h2>
    <p className="mt-3 text-sm leading-6 text-slate-600">{saved.source.kind === "read_only" ? saved.source.reason : saved.target.kind === "read_only" ? saved.target.reason : "These settings need their original reviewed editor."}</p>
  </section>;
  const source = saved.source.initial, target = saved.target.initial;
  const conversion = () => fieldChangeConversion(source.type, targetType, new FormData(form.current!));
  function run(action: "save" | "preview", cursor?: string) {
    if (pending || !form.current || (action === "preview" && dirty)) return;
    if (!form.current.reportValidity()) return;
    const data = new FormData(form.current), token = change.current;
    setError(""); setNotice(""); setPreview(null);
    start(async () => {
      try {
        const rule = conversion();
        if (action === "save") {
          const setup = readAdditionalFieldSetup(data), previousChoices = fieldChangeChoices(source.type, setup, data), request = additionalFieldEvolutionDraftSchema.parse({ definitionId: saved.definitionId,
            definitionRevision: saved.definitionRevision, sourceVersionId: saved.sourceVersionId, revision: saved.draftRevision,
            setup, conversion: rule, ...(previousChoices ? { choiceSourceIndexes: previousChoices } : {}) });
          const next = additionalFieldMigrationSetupSchema.parse(await callbacks.save(request));
          if (next.definitionId !== saved.definitionId || next.definitionRevision !== saved.definitionRevision || next.sourceVersionId !== saved.sourceVersionId || next.draftRevision !== saved.draftRevision + 1)
            throw new Error("The saved field changed. Reopen it before continuing.");
          if (token !== change.current) return;
          setSaved(next); setDirty(false); setTargetChoices(choices(next)); setNotice("New settings saved as a draft. The live field is unchanged.");
        } else {
          const next = additionalFieldMigrationPreviewSchema.parse(await callbacks.preview({ definitionId: saved.definitionId,
            definitionRevision: saved.definitionRevision, draftRevision: saved.draftRevision, sourceVersionId: saved.sourceVersionId,
            conversion: rule, ...(cursor ? { cursor } : {}), limit: 25 }));
          if (next.definitionId !== saved.definitionId || next.definitionRevision !== saved.definitionRevision || next.draftRevision !== saved.draftRevision || next.sourceVersionId !== saved.sourceVersionId)
            throw new Error("The saved field changed. Reopen it before continuing.");
          if (token === change.current) setPreview(next);
        }
      } catch (failure) { if (token === change.current) setError(message(failure)); }
    });
  }
  return <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.65fr)]">
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"><h2 className="mb-5 text-xl font-semibold">Design the new settings</h2>
      <form ref={form} key={saved.draftRevision} onSubmit={event => { event.preventDefault(); run("save"); }} onChange={event => {
        change.current++; setPreview(null); setError(""); setNotice("");
        const element = event.target;
        if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement)) return;
        if (!element.name.startsWith("conversion.")) setDirty(true);
        if (element.name === "type") setTargetType(element.value as typeof targetType);
        if (element.name === "setting.choices") setTargetChoices(element.value.split(/\r?\n/).map(value => value.trim()).filter(Boolean));
      }} className="space-y-6"><fieldset disabled={pending} className="contents">
        <AdditionalFieldSetup fieldTypes={fieldTypes.filter(type => type.id === source.type || (source.type === "integer" && type.id === "decimal") || (source.type === "string" && type.id === "enum") || (source.type === "date" && type.id === "datetime") || (source.type === "datetime" && type.id === "date"))} referenceTargets={referenceTargets} initial={target}/>
        {source.type === targetType && (targetType === "enum" || targetType === "multi_enum") && <fieldset className="space-y-4 rounded-2xl border border-slate-200 p-4"><legend className="px-1 text-sm font-semibold">Keep previous choices connected</legend>
          <p className="text-xs leading-5 text-slate-500">For a rename or reorder, choose the previous choice. Use New choice for a new option. Removed choices remain in the history of existing records.</p>
          {targetChoices.map((label, index) => <label key={`${index}:${label}`} className="grid gap-2 text-sm font-medium">Previous choice for {label}<select name="previousChoice" defaultValue={saved.targetChoiceSourceIndexes[index] ?? "new"} className={inputClass}>
            <option value="new">New choice</option>{saved.sourceChoiceLabels.map((previous, previousIndex) => <option key={previousIndex} value={previousIndex}>{previous}</option>)}
          </select></label>)}
        </fieldset>}
        <fieldset className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/40 p-4"><legend className="px-1 text-sm font-semibold">How existing values change</legend>
          {source.type === targetType ? <p className="text-sm leading-6 text-slate-600">Keep the current kind of detail and validate values against your new settings.</p>
            : source.type === "integer" && targetType === "decimal" ? <p className="text-sm leading-6 text-slate-600">Whole numbers keep their value and can use decimal places.</p>
            : source.type === "date" && targetType === "datetime" ? <p className="text-sm leading-6 text-slate-600">Each date becomes midnight in UTC. Existing days stay the same.</p>
            : source.type === "datetime" && targetType === "date" ? <><p className="text-sm leading-6 text-slate-600">Use the date in UTC. A time other than midnight needs explicit loss review.</p><label className="flex gap-2 text-sm"><input name="conversion.allowTimeLoss" type="checkbox"/>Allow the time of day to be removed in the review</label></>
            : source.type === "string" && targetType === "enum" ? <><p className="text-sm leading-6 text-slate-600">Match each existing text exactly to its new choice.</p>
              {Array.from({ length: mappingRows }, (_, index) => <div key={index} className="grid gap-3 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Existing text {index + 1}<input name="conversion.from" className={inputClass} maxLength={4000}/></label>
                <label className="grid gap-2 text-sm font-medium">Change to choice {index + 1}<select name="conversion.to" className={inputClass}>{targetChoices.map((label, ordinal) => <option key={ordinal} value={ordinal}>{label}</option>)}</select></label></div>)}
              <Button type="button" disabled={mappingRows >= 1000} onClick={() => setMappingRows(count => count + 1)}>Add text mapping</Button>
              <label className="grid gap-2 text-sm font-medium">Other text values<select name="conversion.unmapped" className={inputClass}><option value="reject">Require attention before publishing</option><option value="empty">Review clearing unmatched values</option></select></label>
            </> : <p role="status" className="text-sm leading-6 text-amber-800">There is no approved conversion for this change. Choose the current kind or an available conversion.</p>}
        </fieldset>
        <div className="flex flex-wrap gap-3"><Button type="submit" variant="primary"><Save className="h-4 w-4"/>{pending ? "Working…" : "Save new settings"}</Button>
          {canPreview && <Button type="button" disabled={dirty} onClick={() => run("preview")}><Eye className="h-4 w-4"/>Preview saved change</Button>}</div>
        {dirty && <p className="text-xs leading-5 text-slate-500">Save your settings before previewing the saved change.</p>}
      </fieldset></form><p role="alert" className="mt-4 text-sm text-red-700">{error}</p><p role="status" className="mt-4 text-sm text-blue-700">{notice}</p>
    </section>
    <aside className="space-y-5"><section className="rounded-3xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-semibold">Currently live</h2><p className="mt-4 font-medium">{source.label}</p><p className="mt-2 text-sm text-slate-500">{fieldTypes.find(type => type.id === source.type)?.name ?? "Existing detail"}</p><p className="mt-3 text-sm leading-6 text-slate-500">{source.help || "Your current settings stay live until the complete reviewed change is approved."}</p></section>
      {preview && <section aria-label="Field change preview" className="rounded-3xl border border-blue-200 bg-white p-6"><h2 className="text-xl font-semibold">Before and after</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{preview.affectedCount} records are in scope. This page contains {preview.examples.length} examples.</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">These counts cover this preview page: {preview.pageCounts.valid} ready, {preview.pageCounts.lossy} with loss, {preview.pageCounts.invalid} needing attention. They are not the complete review.</p>
        <div className="mt-5 space-y-3">{preview.examples.map((example, index) => <article key={index} className="rounded-xl border border-slate-200 p-4"><p className="text-xs font-semibold text-slate-500">{example.label} · {resultLabel[example.result]}</p>
          <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-start gap-3 text-sm"><p className="break-words"><span className="mb-1 block text-xs text-slate-500">Before</span>{example.beforeDisplay}</p><ArrowRight className="mt-5 h-4 w-4 text-blue-500"/><p className="break-words"><span className="mb-1 block text-xs text-slate-500">After</span>{example.afterDisplay}</p></div>
          {example.issue && <p className="mt-3 text-xs leading-5 text-amber-800">{issueLabel[example.issue]}</p>}</article>)}</div>
        {preview.nextCursor && <Button type="button" disabled={pending || dirty} onClick={() => run("preview", preview.nextCursor!)} className="mt-4">Next examples</Button>}
        <p className="mt-5 text-xs leading-5 text-slate-500">{preview.impact.uniquenessCheck && "The complete review also checks duplicate values. "}A return to previous settings after new values have been saved requires another reviewed conversion.</p>
        <p className="mt-3 text-sm font-medium text-blue-900">Preview only. Collect and seal the complete review before publishing.</p>
      </section>}
    </aside>
  </div>;
}
