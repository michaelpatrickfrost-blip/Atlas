import { z } from "zod";
import { fieldRuntimeAuthorityInTransaction, type FieldRuntimeAuthority } from "../fields/runtime-authority";
import { loadSealedViewVersion } from "./seal";
import { viewVersionReferenceSchema, viewPayloadSchema } from "./schema";
import { materialiseCompiledView } from "./definition-compiler";
import { pageQueryCostWeight } from "../registry/query-cost";

export const businessViewHeadSchema = z.strictObject({ versionId: z.uuid(), definitionRevision: z.number().int().nonnegative(), checksum: z.string().regex(/^[a-f0-9]{64}$/) });
const requestSchema = z.strictObject({ definitionId: z.uuid(), expectedHead: businessViewHeadSchema.optional() });
/** Published owner metadata chosen from the actual current tenant pointer, never
 * a client payload/version/source. Refresh and preflight ALL used source/query
 * grants before running any existing provider. Native adapters refresh their own
 * genuine principal too; their original non-transactional reads remain unchanged.
 * This is not an atomic cross-provider data snapshot or a business-result cache. */
async function preparePublishedViewRead(authority: FieldRuntimeAuthority, input: unknown, expectedOwnerId: string) {
  authority = await fieldRuntimeAuthorityInTransaction(authority.session, authority.transaction);
  const request = requestSchema.parse(input);
  const definition = await authority.transaction.studioDefinition.findFirst({ where: { id: request.definitionId,
    organisationId: authority.session.organisationId, kind: "view", retiredAt: null, activeVersionId: { not: null } },
    select: { id: true, name: true, revision: true, activeVersionId: true } });
  if (!definition?.activeVersionId) throw new Error("This published business dashboard is unavailable.");
  const row = await authority.transaction.studioDefinitionVersion.findFirst({ where: { id: definition.activeVersionId, definitionId: definition.id,
    organisationId: authority.session.organisationId }, select: { checksum: true, schemaVersion: true, version: true } });
  if (!row) throw new Error("DEPENDENCY_BROKEN: the published business dashboard is unavailable.");
  const expected = request.expectedHead;
  if (expected && (expected.versionId !== definition.activeVersionId || expected.definitionRevision !== definition.revision || expected.checksum !== row.checksum))
    throw new Error("CONFLICT: the business dashboard changed. Refresh to view its current published layout.");
  const prepared = await prepareSealedViewRead(authority, { kind: "view", definitionId: definition.id,
    versionId: definition.activeVersionId, schemaVersion: row.schemaVersion, checksum: row.checksum }, expectedOwnerId);
  return { ...prepared, result: { definitionId: definition.id, name: definition.name, definitionRevision: definition.revision,
    view: { versionId: prepared.version.id, version: row.version, checksum: prepared.version.checksum }, payload: prepared.materialised.payload } };
}
async function prepareSealedViewRead(authority: FieldRuntimeAuthority, input: unknown, expectedOwnerId?: string) {
  authority = await fieldRuntimeAuthorityInTransaction(authority.session, authority.transaction);
  const pin = viewVersionReferenceSchema.parse(input), version = await loadSealedViewVersion(authority.session, authority.transaction, pin);
  const payload = viewPayloadSchema.parse(version.payload);
  if (expectedOwnerId !== undefined && payload.sourceView.id !== expectedOwnerId) throw new Error("This dashboard belongs to a different registered business area.");
  const compiled = await authority.registry.authoriseViewReadInTransaction({ session: authority.session, transaction: authority.transaction }, payload.sourceView, payload.content);
  const materialised = materialiseCompiledView(payload, compiled);
  if (materialised.checksum !== version.checksum) throw new Error("DEPENDENCY_BROKEN: this business dashboard needs a new review.");
  const queryCost = compiled.requests.reduce((total, request) => {
    const descriptor = authority.registry.describe(request.query.id, request.query.version);
    if (descriptor.kind !== "query" || descriptor.schemaHash !== request.query.schemaHash || descriptor.contractHash !== request.query.contractHash)
      throw new Error("DEPENDENCY_BROKEN: the approved view query changed.");
    return total + pageQueryCostWeight(descriptor.details.costClass);
  }, 0);
  return { authority, pin, version, compiled, materialised, queryCost, queryCount: compiled.requests.length };
}
/** Exact retained pin, never a current active-pointer shortcut. Used metadata
 * grants and immutable full-plan reconstruction precede any enclosing-page data.
 * Cost is measured in the original Page's descriptor-based units. */
export async function inspectSealedViewForReadInTransaction(authority: FieldRuntimeAuthority, input: unknown, expectedOwnerId?: string) {
  const prepared = await prepareSealedViewRead(authority, input, expectedOwnerId);
  return { pin: prepared.pin, payload: prepared.materialised.payload, plan: prepared.materialised.plan,
    queryCost: prepared.queryCost, queryCount: prepared.queryCount };
}
export async function readSealedViewInTransaction(authority: FieldRuntimeAuthority, input: unknown, expectedOwnerId?: string) {
  const prepared = await prepareSealedViewRead(authority, input, expectedOwnerId), dataByWidget: Record<string, unknown> = {};
  for (const request of prepared.compiled.requests)
    dataByWidget[request.widgetId] = await prepared.authority.registry.invoke(prepared.authority.session, request.query, request.input);
  return { pin: prepared.pin, payload: prepared.materialised.payload, dataByWidget };
}
/** Catalogue discovery shares every seal/current source permission check with
 * the data reader, without reading provider results or borrowing authoring grants. */
export async function readPublishedViewMetadataInTransaction(authority: FieldRuntimeAuthority, input: unknown, expectedOwnerId: string) {
  return (await preparePublishedViewRead(authority, input, expectedOwnerId)).result;
}
export async function readPublishedViewInTransaction(authority: FieldRuntimeAuthority, input: unknown, expectedOwnerId: string) {
  const prepared = await preparePublishedViewRead(authority, input, expectedOwnerId), dataByWidget: Record<string, unknown> = {};
  for (const request of prepared.compiled.requests)
    dataByWidget[request.widgetId] = await prepared.authority.registry.invoke(prepared.authority.session, request.query, request.input);
  return { ...prepared.result, dataByWidget };
}
