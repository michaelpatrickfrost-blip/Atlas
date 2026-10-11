"use client";
import { useState } from "react";
import { inputClass } from "@/components/ui/service-fields";
import type { TicketCreationTypeManifest } from "@/core/service-work/record-type-creation-contract";

/** Controlled presentation inside the actual owning creation form. Hidden
 * transport selects a stable type only; server metadata and INSERT own authority. */
export function TicketCreationBusinessType({ manifest }: { manifest: TicketCreationTypeManifest }) {
  const [definitionId, setDefinitionId] = useState("");
  const selected = manifest.choices.find(choice => choice.definitionId === definitionId);
  return <section className="space-y-2 rounded-xl border border-[var(--color-border)] p-4">
    <label className="block text-xs font-medium">Business type<select className={inputClass} value={definitionId} onChange={event => setDefinitionId(event.target.value)}>
      <option value="">Standard business design</option>
      {manifest.choices.map(choice => <option key={choice.definitionId} value={choice.definitionId}>{choice.label}</option>)}
    </select></label>
    <input type="hidden" name="studioRecordType" value={JSON.stringify({ schemaVersion: 1,
      manifestChecksum: manifest.manifestChecksum, definitionId: definitionId || null })}/>
    {selected?.help && <p className="text-xs text-[var(--color-ink-muted)]">{selected.help}</p>}
    {!!selected?.requiredFields.length && <p className="text-xs text-[var(--color-ink-muted)]">Required information: {selected.requiredFields.map(field => field.label).join(", ")}.</p>}
  </section>;
}
