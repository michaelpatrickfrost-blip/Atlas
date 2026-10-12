import { z } from "zod";
import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { entityDetailsSchema } from "@/core/studio/registry/entities";
import { fieldRuntimeAuthorityInTransaction, withFieldRuntimeAuthority, type FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { readVersionedFieldPlanInTransaction } from "@/core/studio/fields/runtime-read";
import { inspectSealedFieldVersion } from "@/core/studio/fields/sealed-field";
import { fieldDefinitionKey } from "@/core/studio/fields/binding";
import { lockFieldEntitiesInTransaction } from "@/core/studio/fields/entity-lock";
import { ticketFieldSearchRequestSchema, ticketFieldSearchResultSchema, ticketSearchFieldSchema, ticketSearchReferenceRequestSchema, type TicketSearchField } from "./field-search-contract";

function corrupt(): never { throw new Error("FIELD_STORAGE_INVALID: additional-detail search is unavailable."); }
const forbidden = (error: unknown) => error instanceof Error && /^FORBIDDEN(?:\b|:)/.test(error.message);

/** No native/value providers. Independently unavailable field/reference Read
 * choices are omitted before names leave the server; invalid seals fail closed. */
export async function ticketSearchFieldsInTransaction(supplied: FieldRuntimeAuthority): Promise<TicketSearchField[]> {
  const authority = await fieldRuntimeAuthorityInTransaction(supplied.session, supplied.transaction), { session, registry, transaction: tx } = authority;
  assertCapability(session, "tickets.ticket.read");
  const owner = await registry.resolve(session, registry.describe("tickets.ticket", 9));
  const policy = entityDetailsSchema.parse(owner.details).record?.fieldPolicy;
  if (owner.kind !== "entity" || !policy) corrupt();
  await lockFieldEntitiesInTransaction(tx, session.organisationId, ["tickets.ticket"]);
  const bindings = await tx.studioFieldBinding.findMany({ where: { organisationId: session.organisationId, entityId: "tickets.ticket" },
    include: { definition: { include: { activeVersion: true } } }, orderBy: { definitionId: "asc" }, take: policy.maxFields + 1 });
  if (bindings.length > policy.maxFields || new Set(bindings.map(row => row.definitionId)).size !== bindings.length) corrupt();
  const fields: TicketSearchField[] = [];
  for (const binding of bindings) {
    const definition = binding.definition;
    if (binding.organisationId !== session.organisationId || binding.entityId !== "tickets.ticket" || binding.definitionId !== definition.id
      || definition.organisationId !== session.organisationId || definition.kind !== "customField") corrupt();
    if ((definition.activeVersionId === null) !== (definition.activeVersion === null)) corrupt();
    if (definition.retiredAt !== null || definition.activeVersionId === null) continue;
    const version = definition.activeVersion;
    if (!version || version.id !== definition.activeVersionId) corrupt();
    const sealed = inspectSealedFieldVersion(registry, version, session.organisationId, definition.id).payload;
    if (sealed.entity.id !== "tickets.ticket" || sealed.field.key !== binding.fieldKey || definition.key !== fieldDefinitionKey(sealed)) corrupt();
    if (!sealed.field.indexed || ["multi_enum", "address"].includes(sealed.field.storage.type)) continue;
    try {
      const payload = await readVersionedFieldPlanInTransaction(authority, version, definition.id);
      fields.push(ticketSearchFieldSchema.parse({ definitionId: definition.id, definitionRevision: definition.revision, versionId: version.id,
        generationId: payload.storageGeneration, label: payload.field.label, help: payload.field.help, storage: payload.field.storage }));
    } catch (error) { if (!forbidden(error)) throw error; }
  }
  return fields;
}

/** Preserve original query's unspecified transaction/hash. Its owning adapter
 * opens its genuine Serializable field runtime and enforces current/written,
 * native-private and reference policy before predicates and projections. */
export async function searchTicketAdditionalDetails(session: Session, input: unknown) {
  assertCapability(session, "tickets.ticket.read");
  const request = ticketFieldSearchRequestSchema.parse(input);
  // Close the metadata-only transaction before the owning query opens its
  // independent genuine runtime transaction. No closed transaction escapes.
  const prepared = await withFieldRuntimeAuthority(session, async authority => ({ session: authority.session,
    registry: authority.registry, query: authority.registry.describe("tickets.ticket.field_search", 1) }));
  const result = ticketFieldSearchResultSchema.parse(await prepared.registry.invoke(prepared.session, prepared.query, request));
  for (const record of result.records) if (record.href !== `/tickets/${record.id}`) corrupt();
  return result;
}

const choicesSchema = z.object({ records: z.array(z.object({ id: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
  fields: z.object({ number: z.string(), subject: z.string() }) })).max(50) });
/** Read-only authenticated reference choices. Does not borrow the edit manifest
 * or grant Extend/fieldWrite. Exact observed field metadata must still be current. */
export async function searchTicketAdditionalDetailReferences(session: Session, input: unknown) {
  assertCapability(session, "tickets.ticket.read");
  const request = ticketSearchReferenceRequestSchema.parse(input);
  return withFieldRuntimeAuthority(session, async authority => {
    const fields = await ticketSearchFieldsInTransaction(authority), field = fields.find(field => field.definitionId === request.definitionId);
    if (!field) throw new Error("FORBIDDEN: this additional-detail search is unavailable.");
    if (field.definitionRevision !== request.definitionRevision || field.versionId !== request.versionId || field.generationId !== request.generationId)
      throw new Error("CONFLICT: the search setup changed. Refresh before searching again.");
    if (field.storage.type !== "reference" || field.storage.entity.id !== "tickets.ticket") corrupt();
    const query = authority.registry.describe("tickets.ticket.list", 1);
    const result = choicesSchema.parse(await authority.registry.invoke(authority.session, query, { search: request.search.trim(), limit: 25 }));
    return result.records.map(record => ({ id: record.id, label: `${record.fields.number} · ${record.fields.subject}` }));
  });
}
