"use client";
import { useState } from "react";
import { ActionForm } from "@/components/ui/action-form";
import { inputClass } from "@/components/ui/service-fields";
import { changeTicketBusinessType } from "@/core/service-work/record-type-actions";
import type { RecordTypeSelection } from "@/core/studio/record-types/selection-contract";

/** A sibling owning form, never a nested form or a permission grant. Names/help
 * come from the server-approved catalogue; technical identity stays hidden. */
export function TicketBusinessTypeSelector({ selection }: { selection: RecordTypeSelection }) {
  const [chosen, setChosen] = useState(selection.currentDefinitionId ?? "");
  const help = selection.choices.find(choice => choice.definitionId === chosen)?.help;
  if (!selection.choices.length && selection.currentDefinitionId === null) return null;
  return <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
    <h3 className="text-sm font-semibold">Business type</h3>
    <p className="mt-1 text-xs text-[var(--color-ink-muted)]">Choose the business design for this ticket. Its required information must already be complete.</p>
    <ActionForm action={changeTicketBusinessType} label="Apply business type" className="mt-3">
      <input type="hidden" name="operationId" value={selection.operationId}/>
      <input type="hidden" name="recordId" value={selection.recordId}/>
      <input type="hidden" name="recordRevision" value={selection.recordRevision}/>
      <input type="hidden" name="extensionRevision" value={selection.extensionRevision ?? ""}/>
      <label className="block text-xs">Business type<select name="definitionId" className={inputClass} value={chosen} onChange={event => setChosen(event.target.value)}>
        <option value="">Standard business design</option>
        {selection.choices.map(choice => <option key={choice.definitionId} value={choice.definitionId}>{choice.label}</option>)}
      </select></label>
      {help && <p className="text-xs text-[var(--color-ink-muted)]">{help}</p>}
    </ActionForm>
  </section>;
}
