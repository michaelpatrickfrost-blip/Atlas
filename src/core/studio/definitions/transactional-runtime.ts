import { z } from "zod";
import type { Session } from "@/core/auth/session";
import { sessionAuthorityStamp } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { STUDIO_CAPABILITIES } from "../permissions";
import { withFieldRuntimeAuthority, type FieldRuntimeAuthority } from "../fields/runtime-authority";
import { lockFieldEntitiesInTransaction } from "../fields/entity-lock";
import { inspectConfigurationGraph, loadSealedConfigurationVersion } from "../configuration/pins";
import { assertNoActiveConfigurationDependantsInTransaction } from "../configuration/usage";
import { inspectRecordProfileInTransaction } from "../record-types/runtime-profile";
import { configurationReferenceSchema, entityProfilePayloadSchema, recordTypePayloadSchema } from "../record-types/schema";
import { referenceSchema } from "../compiler/reference";
import { checksum } from "../registry/contracts";
import { pagePayloadSchema } from "../pages/schema";
import { compilePage } from "../pages/compiler";
import { pageApprovalsSchema } from "../pages/approvals";
import { authoredPageFieldPins } from "../pages/definition-compiler";
import { reconstructPageMetadataInTransaction } from "../pages/server-approvals";

const uuid = z.uuid().transform(value => value.toLowerCase());
const kindSchema = z.enum(["page", "entityProfile", "recordType"]);
const dependencySchema = referenceSchema.extend({ ownerModuleId: z.string(),
  kind: z.enum(["entity", "query", "command", "event", "surface", "decisionFact", "template", "metric", "integration"]),
  classification: z.enum(["public_internal", "confidential", "restricted"]) });
const pageFrame = z.object({ kind: z.literal("page"), schemaVersion: z.literal(1), approvals: pageApprovalsSchema });
const profilePlanSchema = z.strictObject({ kind: z.enum(["entityProfile", "recordType"]), schemaVersion: z.literal(1),
  payload: z.union([entityProfilePayloadSchema, recordTypePayloadSchema]), resolvedProfile: entityProfilePayloadSchema.shape.profile,
  dependencies: z.array(dependencySchema).max(100), configurationDependencies: z.array(configurationReferenceSchema).max(202) });
const removalSchema = z.strictObject({ definitionId: uuid, revision: z.number().int().nonnegative().max(2147483646),
  mode: z.enum(["retire", "deactivate"]) });
const definitionSelect = { id: true, organisationId: true, kind: true, revision: true, latestVersion: true,
  activeVersionId: true, retiredAt: true } as const;
function broken(): never { throw new Error("DEPENDENCY_BROKEN: the business design is unavailable or incompatible."); }
function conflict(): never { throw new Error("CONFLICT: this business design changed. Refresh before continuing."); }

async function requireAuthority(authority: FieldRuntimeAuthority, capability: string) {
  const { session, transaction } = authority, stamp = sessionAuthorityStamp(session);
  if (!stamp || stamp !== authority.stamp || stamp.organisationId !== session.organisationId
    || stamp.userId !== session.userId || stamp.membershipId !== session.membershipId)
    throw new Error("FORBIDDEN: genuine current business design authority is required.");
  assertCapability(session, capability);
  if (!await transaction.moduleState.findFirst({ where: { organisationId: session.organisationId, moduleId: "studio",
    enabled: true, entitled: true }, select: { id: true } })) broken();
}

/** Internal metadata reconstruction only. It does not borrow native Read or
 * field Write, execute a Page query, or approve access to any canonical record. */
async function inspectPlan(authority: FieldRuntimeAuthority, pin: z.infer<typeof configurationReferenceSchema>) {
  const { session, transaction, registry } = authority;
  const version = await loadSealedConfigurationVersion(session, transaction, pin);
  let plan;
  if (pin.kind === "page") {
    const payload = pagePayloadSchema.parse(version.payload);
    const source = pageFrame.parse(version.compiledPlan).approvals.sourcePage;
    const approvals = await reconstructPageMetadataInTransaction(authority, {
      sourcePage: { id: source.id, version: source.version, schemaHash: source.schemaHash, contractHash: source.contractHash },
      customFields: authoredPageFieldPins(payload),
    });
    plan = compilePage(payload, approvals);
    if (checksum(plan) !== pin.checksum) broken();
  } else if (pin.kind === "entityProfile" || pin.kind === "recordType") {
    await inspectRecordProfileInTransaction(authority, pin);
    plan = profilePlanSchema.parse(version.compiledPlan);
  } else broken();
  // Describing a seal intentionally grants no business capability. Availability
  // and support are still required for EVERY used immutable registry dependency.
  for (const dependency of plan.dependencies) {
    const actual = registry.describe(dependency.id, dependency.version);
    if (actual.schemaHash !== dependency.schemaHash || actual.contractHash !== dependency.contractHash
      || actual.ownerModuleId !== dependency.ownerModuleId || actual.kind !== dependency.kind
      || actual.classification !== dependency.classification
      || (actual.lifecycle === "deprecated" && Date.parse(actual.supportedUntil!) <= Date.now())) broken();
  }
  const modules = [...new Set(plan.dependencies.map(dependency => dependency.ownerModuleId))];
  if (await transaction.moduleState.count({ where: { organisationId: session.organisationId, moduleId: { in: modules },
    enabled: true, entitled: true } }) !== modules.length) broken();
  await inspectConfigurationGraph(session, transaction, plan.configurationDependencies, pin.definitionId);
  return { version, plan };
}

/** Original activeDefinition dispatch for transactional Page/profile kinds.
 * Fresh signed identity, module state and immutable seals are checked together;
 * metadata access needs Studio Read, never the author's native/field grants. */
export async function readActiveTransactionalDefinition(authenticated: Session, input: unknown) {
  const definitionId = uuid.parse(input);
  return withFieldRuntimeAuthority(authenticated, authority => readActiveTransactionalDefinitionInTransaction(authority, definitionId));
}

/** Trusted existing fresh-transaction counterpart, not a client callback. */
export async function readActiveTransactionalDefinitionInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  await requireAuthority(authority, STUDIO_CAPABILITIES.read);
  const definitionId = uuid.parse(input), { session, transaction } = authority;
  const definition = await transaction.studioDefinition.findFirst({ where: { id: definitionId,
    organisationId: session.organisationId }, select: definitionSelect });
  if (!definition) return null;
  if (definition.id !== definitionId || definition.organisationId !== session.organisationId) broken();
  if (definition.retiredAt !== null) return null;
  const kind = kindSchema.parse(definition.kind);
  if (definition.activeVersionId === null) return null;
  const current = await transaction.studioDefinitionVersion.findFirst({ where: { id: definition.activeVersionId,
    definitionId, organisationId: session.organisationId }, select: { id: true, version: true, schemaVersion: true, checksum: true } });
  if (!current || current.id !== definition.activeVersionId) broken();
  const pin = configurationReferenceSchema.parse({ kind, definitionId, versionId: current.id,
    schemaVersion: current.schemaVersion, checksum: current.checksum });
  const { plan } = await inspectPlan(authority, pin);
  return { versionId: current.id, version: current.version, plan };
}

/** Removal prerequisite only: the original service owns pointer/retiredAt CAS
 * and Audit in this SAME fresh Serializable transaction. Retained assignments
 * alone do not block. Current type heads block both removal modes; current base
 * heads also block retirement because their exact historical base must remain
 * readable. A base's active pointer is not needed by a retained assigned type.
 * No business rows/values, native capabilities or temporary pointer changes. */
export async function assertTransactionalDefinitionCanBeRemovedInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  await requireAuthority(authority, STUDIO_CAPABILITIES.publish);
  const request = removalSchema.parse(input), { session, transaction } = authority;
  const load = () => transaction.studioDefinition.findFirst({ where: { id: request.definitionId,
    organisationId: session.organisationId, retiredAt: null }, select: definitionSelect });
  const initial = await load();
  if (!initial || initial.id !== request.definitionId || initial.organisationId !== session.organisationId
    || initial.revision !== request.revision) conflict();
  const kind = kindSchema.parse(initial.kind);
  // Read only immutable metadata to choose the shared entity key before any
  // definition/native tuple mutation. Inactive published designs use the latest
  // sealed version. Draft-only retirement needs the original service's separate
  // policy; unsealed draft JSON is never a runtime impact/locking authority here.
  const version = await transaction.studioDefinitionVersion.findFirst({ where: { definitionId: request.definitionId,
    organisationId: session.organisationId, ...(initial.activeVersionId ? { id: initial.activeVersionId } : { version: initial.latestVersion }) },
    select: { id: true, schemaVersion: true, checksum: true } });
  if (!version) broken();
  const pin = configurationReferenceSchema.parse({ kind, definitionId: request.definitionId, versionId: version.id,
    schemaVersion: version.schemaVersion, checksum: version.checksum });
  const inspected = await inspectPlan(authority, pin), entityId = inspected.plan.payload.entity.id;
  await lockFieldEntitiesInTransaction(transaction, session.organisationId, [entityId]);
  const locked = await load();
  if (!locked || checksum(locked) !== checksum(initial)) conflict();
  await assertNoActiveConfigurationDependantsInTransaction(session, transaction, { definitionId: request.definitionId });
  const assignment = kind === "recordType" || (kind === "entityProfile" && request.mode === "retire")
    ? await transaction.studioExtensionRecord.findFirst({ where: { organisationId: session.organisationId,
      recordTypeAssignment: { organisationId: session.organisationId,
        ...(kind === "recordType" ? { recordTypeDefinitionId: request.definitionId } : { baseProfileDefinitionId: request.definitionId }) } },
      select: { id: true } }) : null;
  if (assignment) throw new Error("CONFIGURATION_IN_USE: current business records still use this record design.");
  return { definitionId: request.definitionId, kind, entityId, revision: request.revision,
    activeVersionId: locked.activeVersionId, mode: request.mode };
}
