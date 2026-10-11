import { z } from "zod";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { assertCapability } from "@/core/permissions/check";
import { STUDIO_CAPABILITIES } from "../permissions";
import { checksum } from "../registry/contracts";
import { recordAnchorSchema } from "../registry/entities";
import { fieldRuntimeAuthorityInTransaction } from "../fields/runtime-authority";
import { lockFieldEntitiesInTransaction } from "../fields/entity-lock";
import { validateCandidateRecordProfileRequirements } from "../fields/required-runtime";
import { loadSealedConfigurationVersion } from "../configuration/pins";
import { entityProfilePayloadSchema, recordTypePayloadSchema, configurationReferenceSchema } from "./schema";
import { inspectRecordProfileInTransaction, preflightRecordProfileFields, resolveRecordProfileInTransaction } from "./runtime-profile";

const uuid = z.uuid().transform(value => value.toLowerCase());
const requestSchema = z.strictObject({ definitionId: uuid, versionId: uuid,
  definitionRevision: z.number().int().nonnegative().max(2147483646) });
const scope = { organisationId: z.string().min(1), entityId: z.string().min(1) };
const preflightSchema = z.strictObject({ ...scope, mode: z.literal("preflight"), count: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER), nativeAccessComplete: z.literal(true) });
const pageSchema = z.strictObject({ ...scope, mode: z.literal("snapshot"), records: z.array(recordAnchorSchema).max(50), next: z.string().min(1).max(100).nullable() });
function changed(): never { throw new Error("RECORD_PROFILE_COVERAGE_CHANGED: refresh and review the current business record set."); }

/** Internal original activation prerequisite. The caller retains this same
 * Serializable transaction through pointer CAS/Audit. Inspect the whole owning
 * canonical cohort before selecting the affected stable-type/unassigned subset;
 * no assignment-only shortcut, business writes or temporary active pointers. */
export async function validateCandidateRecordProfileCoverage(authenticated: Session, transaction: Prisma.TransactionClient, input: unknown) {
  const request = requestSchema.parse(input), authority = await fieldRuntimeAuthorityInTransaction(authenticated, transaction);
  const { session, registry } = authority;
  assertCapability(session, STUDIO_CAPABILITIES.publish);
  if (!await transaction.moduleState.findFirst({ where: { organisationId: session.organisationId, moduleId: "studio", enabled: true, entitled: true }, select: { id: true } }))
    throw new Error("DEPENDENCY_BROKEN: Studio is unavailable.");
  const where = { id: request.definitionId, organisationId: session.organisationId, retiredAt: null };
  const versionWhere = { id: request.versionId, definitionId: request.definitionId, organisationId: session.organisationId };
  // Unlocked tenant metadata establishes the entity key; no definition/native
  // tuple lock may precede the shared entity lock, including first publication.
  const observedDefinition = await transaction.studioDefinition.findFirst({ where });
  const observedVersion = await transaction.studioDefinitionVersion.findFirst({ where: versionWhere });
  if (!observedDefinition || !observedVersion || observedDefinition.revision !== request.definitionRevision
    || (observedDefinition.kind !== "entityProfile" && observedDefinition.kind !== "recordType")) changed();
  const payload = observedDefinition.kind === "entityProfile" ? entityProfilePayloadSchema.parse(observedVersion.payload) : recordTypePayloadSchema.parse(observedVersion.payload);
  await registry.resolve(session, payload.entity);
  await lockFieldEntitiesInTransaction(transaction, session.organisationId, [payload.entity.id]);
  await transaction.$queryRaw`SELECT id FROM studio_definitions WHERE id=${request.definitionId}::uuid AND "organisationId"=${session.organisationId} FOR SHARE`;
  const definition = await transaction.studioDefinition.findFirst({ where });
  const version = await transaction.studioDefinitionVersion.findFirst({ where: versionWhere });
  if (!definition || !version || definition.kind !== observedDefinition.kind || definition.revision !== request.definitionRevision
    || definition.activeVersionId !== observedDefinition.activeVersionId || version.checksum !== observedVersion.checksum) changed();
  const pin = configurationReferenceSchema.parse({ kind: definition.kind, definitionId: definition.id, versionId: version.id,
    schemaVersion: version.schemaVersion, checksum: version.checksum });
  const policy = await registry.resolveCurrentRequiredCoverage(session, payload.entity), context = { session, transaction };
  async function preflight() {
    const value = preflightSchema.parse(await registry.invokeQueryInTransaction(context, policy.query, { mode: "preflight" }));
    if (value.organisationId !== session.organisationId || value.entityId !== payload.entity.id) changed();
    return value;
  }
  // Owner-private access is checked before any cohort ID or assignment metadata.
  const initial = await preflight();
  const candidate = await inspectRecordProfileInTransaction(authority, pin);
  if (candidate.entity.id !== payload.entity.id) changed();
  await preflightRecordProfileFields(authority, candidate.profile, payload.entity.id, { kind: "ordinary" });
  let cursor: string | undefined, visited = 0, affected = 0, requirementsChecked = 0;
  let fingerprint = checksum({ organisationId: session.organisationId, candidate: pin, definitionRevision: definition.revision,
    activeVersionId: definition.activeVersionId, owner: policy.owner.contractHash, query: policy.query.contractHash, count: initial.count });
  while (true) {
    const page = pageSchema.parse(await registry.invokeQueryInTransaction(context, policy.query, { mode: "snapshot", ...(cursor ? { cursor } : {}), limit: 50 }));
    if (page.organisationId !== session.organisationId || page.entityId !== payload.entity.id || visited + page.records.length > initial.count
      || (page.next !== null && (page.records.length !== 50 || page.next !== page.records.at(-1)?.recordId))) changed();
    for (const anchor of page.records) {
      if (anchor.organisationId !== session.organisationId || (cursor !== undefined && anchor.recordId <= cursor)) changed();
      const record = { entity: payload.entity, recordId: anchor.recordId, expectedRevision: anchor.revision };
      const current = await resolveRecordProfileInTransaction(authority, record, { kind: "ordinary" });
      const head = await transaction.studioExtensionRecord.findFirst({ where: { organisationId: session.organisationId,
        entityId: payload.entity.id, recordId: anchor.recordId }, select: { id: true, revision: true, recordTypeAssignmentId: true } });
      if ((head?.recordTypeAssignmentId ?? null) !== current.assignmentId) changed();
      const selected = pin.kind === "entityProfile" ? current.recordType === null : current.recordType?.definitionId === pin.definitionId;
      let result: Awaited<ReturnType<typeof validateCandidateRecordProfileRequirements>> | null = null;
      if (selected) {
        affected++;
        // Equal exact required-field sets (including a Page-only design change)
        // impose no new value predicate. Metadata/current grants were still
        // checked above; counts and assignments never bypass owner preflight.
        if (checksum(current.profile?.requiredFields ?? []) !== checksum(candidate.profile.requiredFields)) {
          result = await validateCandidateRecordProfileRequirements(session, transaction, record, pin);
          if (result.recordRevision !== anchor.revision || result.extensionRevision !== (head?.revision ?? null)) changed();
          requirementsChecked++;
        }
      }
      fingerprint = checksum({ previous: fingerprint, anchor, currentProfile: current.fingerprint, head, selected, result });
      visited++; cursor = anchor.recordId;
    }
    if (page.next === null) break;
  }
  if (visited !== initial.count || (await preflight()).count !== initial.count) changed();
  const finalDefinition = await transaction.studioDefinition.findFirst({ where });
  if (!finalDefinition || finalDefinition.kind !== definition.kind || finalDefinition.revision !== definition.revision
    || finalDefinition.activeVersionId !== definition.activeVersionId || finalDefinition.key !== definition.key) changed();
  await loadSealedConfigurationVersion(session, transaction, pin);
  const finalCandidate = await inspectRecordProfileInTransaction(authority, pin);
  await preflightRecordProfileFields(authority, finalCandidate.profile, payload.entity.id, { kind: "ordinary" });
  return { definitionId: definition.id, definitionRevision: definition.revision, versionId: pin.versionId, versionChecksum: pin.checksum,
    recordCount: visited, affectedRecordCount: affected, requirementsChecked, fingerprint };
}
