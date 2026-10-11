import { z } from "zod";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { assertCapability } from "@/core/permissions/check";
import { STUDIO_CAPABILITIES } from "../permissions";
import { checksum } from "../registry/contracts";
import { recordAnchorSchema } from "../registry/entities";
import { compileCustomField } from "../compiler/fields";
import { fieldDefinitionKey } from "./binding";
import { fieldRuntimeAuthorityInTransaction } from "./runtime-authority";
import { readVersionedFieldPlanInTransaction } from "./runtime-read";
import { validateCandidateFieldRequirement, validateRequiredFieldMetadataInTransaction } from "./required-runtime";

const requestSchema = z.strictObject({ definitionId: z.uuid(), versionId: z.uuid(), definitionRevision: z.number().int().nonnegative().max(2147483646) });
const scope = { organisationId: z.string().min(1), entityId: z.string().min(1) };
const preflightSchema = z.strictObject({ ...scope, mode: z.literal("preflight"), count: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER), nativeAccessComplete: z.literal(true) });
const pageSchema = z.strictObject({ ...scope, mode: z.literal("snapshot"), records: z.array(recordAnchorSchema).max(50), next: z.string().min(1).max(100).nullable() });
const pageLimit = 50;
function changed(): never { throw new Error("FIELD_COVERAGE_CHANGED: refresh and review the current business record set."); }

/** Internal read-only proof for the caller's owning Serializable publication/
 * activation transaction. Use a genuine company Session (or one resolved through
 * the existing audited support principal). The metadata-only Admin context fails
 * runtime authority. Never a durable approval, public endpoint or native writer.
 * Caller must hold the common mutation lock order and apply CAS/Audit atomically;
 * dispatch stays gated until native resulting-state enforcement is integrated. */
export async function validateCandidateFieldCoverage(authenticated: Session, transaction: Prisma.TransactionClient, input: unknown) {
  const request = requestSchema.parse(input), authority = await fieldRuntimeAuthorityInTransaction(authenticated, transaction);
  const { session, registry } = authority;
  assertCapability(session, STUDIO_CAPABILITIES.publish);
  if (!await transaction.moduleState.findFirst({ where: { organisationId: session.organisationId, moduleId: "studio", enabled: true, entitled: true }, select: { id: true } }))
    throw new Error("DEPENDENCY_BROKEN: Studio is unavailable.");
  await transaction.$queryRaw`SELECT id FROM studio_definitions WHERE id=${request.definitionId}::uuid AND "organisationId"=${session.organisationId} FOR SHARE`;
  const where = { id: request.definitionId, organisationId: session.organisationId, kind: "customField" as const, retiredAt: null };
  const definition = await transaction.studioDefinition.findFirst({ where });
  const versionWhere = { id: request.versionId, definitionId: request.definitionId, organisationId: session.organisationId };
  const version = await transaction.studioDefinitionVersion.findFirst({ where: versionWhere });
  if (!definition || !version || definition.revision !== request.definitionRevision) changed();
  const payload = await readVersionedFieldPlanInTransaction(authority, version, definition.id);
  if (definition.key !== fieldDefinitionKey(payload)) changed();
  // Publication checks both target Read and Write policy even for an empty set.
  await compileCustomField(session, { schemaVersion: 1, entity: payload.entity, storageGeneration: payload.storageGeneration, field: payload.field }, registry);
  const policy = await registry.resolveCurrentRequiredCoverage(session, payload.entity);
  const context = { session, transaction };
  async function preflight() {
    const value = preflightSchema.parse(await registry.invokeQueryInTransaction(context, policy.query, { mode: "preflight" }));
    if (value.organisationId !== session.organisationId || value.entityId !== payload.entity.id) changed();
    return value;
  }
  // The owner checks inaccessible/private rows before exposing any count or ID.
  const initial = await preflight();
  await validateRequiredFieldMetadataInTransaction(authority, definition.id, version);
  let cursor: string | undefined, visited = 0;
  let fingerprint = checksum({ organisationId: session.organisationId, definitionId: definition.id, definitionRevision: definition.revision,
    activeVersionId: definition.activeVersionId, versionId: version.id, versionChecksum: version.checksum,
    owner: policy.owner.contractHash, query: policy.query.contractHash, count: initial.count });
  while (true) {
    const page = pageSchema.parse(await registry.invokeQueryInTransaction(context, policy.query, { mode: "snapshot", ...(cursor ? { cursor } : {}), limit: pageLimit }));
    if (page.organisationId !== session.organisationId || page.entityId !== payload.entity.id || visited + page.records.length > initial.count
      || (page.next !== null && (page.records.length !== pageLimit || page.next !== page.records.at(-1)?.recordId))) changed();
    for (const anchor of page.records) {
      if (anchor.organisationId !== session.organisationId || (cursor !== undefined && anchor.recordId <= cursor)) changed();
      const result = await validateCandidateFieldRequirement(session, transaction, { definitionId: definition.id, versionId: version.id,
        recordId: anchor.recordId, expectedRevision: anchor.revision });
      if (result.versionId !== version.id || result.recordRevision !== anchor.revision) changed();
      fingerprint = checksum({ previous: fingerprint, recordId: anchor.recordId, result });
      visited++; cursor = anchor.recordId;
    }
    if (page.next === null) break;
  }
  if (visited !== initial.count || (await preflight()).count !== initial.count) changed();
  const finalDefinition = await transaction.studioDefinition.findFirst({ where }), finalVersion = await transaction.studioDefinitionVersion.findFirst({ where: versionWhere });
  if (!finalDefinition || !finalVersion || finalDefinition.revision !== definition.revision || finalDefinition.activeVersionId !== definition.activeVersionId
    || finalDefinition.key !== definition.key || finalVersion.checksum !== version.checksum) changed();
  await readVersionedFieldPlanInTransaction(authority, finalVersion, definition.id);
  await validateRequiredFieldMetadataInTransaction(authority, definition.id, finalVersion);
  return { definitionId: definition.id, definitionRevision: definition.revision, versionId: version.id, versionChecksum: version.checksum,
    recordCount: visited, fingerprint };
}
