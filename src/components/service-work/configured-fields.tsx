"use client";
import type { TicketFieldFormManifest } from "@/core/service-work/field-form-contract";
import { searchTicketFieldReferences } from "@/core/service-work/field-form-actions";
import { TicketTypedFields } from "./typed-fields";

/** Wire the shared renderer to its narrow owning lookup, never a generic query. */
export function TicketConfiguredFields({ manifest, recordId }: { manifest: TicketFieldFormManifest; recordId?: string }) {
  return <TicketTypedFields manifest={manifest} searchReferences={(definitionId, search) => searchTicketFieldReferences({
    form: manifest.operation === "update" ? { operation: "update", recordId } : { operation: "create" }, definitionId, search,
  })}/>;
}
