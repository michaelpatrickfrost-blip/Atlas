import type { FieldStorage, FieldValue } from "@/core/studio/fields/schema";
import type { TicketCreationTypeManifest } from "./record-type-creation-contract";

/** Display and observed CAS state only. No private rule graph, facts, tenant,
 * owning proof, capability grant or executable client configuration. */
export type TicketFieldFormControl = {
  operationId: string;
  definitionId: string;
  definitionRevision: number;
  versionId: string;
  generationId: string;
  slotRevision: number | null;
  valueRevision: number | null;
  label: string;
  help: string;
  storage: FieldStorage;
  required: boolean;
  conditionalRequired: boolean;
  value: FieldValue | null;
  /** Authorised literal suggestion for creation only; never submitted authority. */
  defaultValue?: FieldValue;
};
export type TicketFieldFormManifest = {
  schemaVersion: 1;
  operation: "create" | "update";
  operationId: string;
  recordRevision: number | null;
  extensionRevision: number | null;
  manifestChecksum: string;
  fields: TicketFieldFormControl[];
  /** Authorised creation choices only; absent keeps historical manifest shape. */
  recordTypes?: TicketCreationTypeManifest;
};
export type TicketFieldReferenceChoice = { id: string; label: string };
export type TicketFieldReferenceSearch = (definitionId: string, search: string) => Promise<TicketFieldReferenceChoice[]>;
