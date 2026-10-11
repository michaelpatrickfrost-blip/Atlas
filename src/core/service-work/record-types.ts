import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import type { FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { withFieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { readRecordTypeSelectionInTransaction, reassignRecordTypeInTransaction } from "@/core/studio/record-types/selection";
import { recordTypeReassignmentSchema } from "@/core/studio/record-types/selection-contract";

function owner(authority: FieldRuntimeAuthority) {
  const { id, version, schemaHash, contractHash } = authority.registry.describe("tickets.ticket", 9);
  return { id, version, schemaHash, contractHash };
}

/** The owning Ticket integration always supplies its canonical current contract.
 * Other native work kinds and client-selected entities are not supported. */
export async function ticketRecordTypeSelection(authenticated: Session, recordId: string, recordRevision: number) {
  if (!authenticated.capabilities.has("tickets.ticket.read") || !authenticated.capabilities.has("tickets.ticket.manage")) return null;
  return withFieldRuntimeAuthority(authenticated, async authority => {
    if (!authority.session.capabilities.has("tickets.ticket.read") || !authority.session.capabilities.has("tickets.ticket.manage")) return null;
    if (!await authority.transaction.moduleState.findFirst({ where: { organisationId: authority.session.organisationId,
      moduleId: "tickets", enabled: true, entitled: true }, select: { id: true } })) return null;
    return readRecordTypeSelectionInTransaction(authority.session, authority.transaction,
      owner(authority), { recordId, recordRevision });
  });
}

export async function reassignTicketRecordType(authenticated: Session, input: unknown) {
  const request = recordTypeReassignmentSchema.parse(input);
  return withFieldRuntimeAuthority(authenticated, async authority => {
    assertCapability(authority.session, "tickets.ticket.manage");
    assertCapability(authority.session, "tickets.ticket.read");
    return reassignRecordTypeInTransaction(authority.session, authority.transaction,
      owner(authority), request);
  });
}

/** Strict form transport. No tenant, pin, profile or authority-bearing properties. */
export function parseTicketRecordTypeForm(form: FormData) {
  const names = ["operationId", "recordId", "recordRevision", "extensionRevision", "definitionId"];
  if ([...form.keys()].some(key => !names.includes(key)) || names.some(key => form.getAll(key).length !== 1))
    throw new Error("The business type form is invalid. Refresh before saving.");
  const integer = (name: string, nullable = false) => {
    const raw = form.get(name);
    if (nullable && raw === "") return null;
    if (typeof raw !== "string" || !/^(0|[1-9][0-9]*)$/.test(raw)) throw new Error("The ticket changed. Refresh before saving.");
    return Number(raw);
  };
  return recordTypeReassignmentSchema.parse({ operationId: form.get("operationId"), recordId: form.get("recordId"),
    recordRevision: integer("recordRevision"), extensionRevision: integer("extensionRevision", true),
    definitionId: form.get("definitionId") === "" ? null : form.get("definitionId") });
}
