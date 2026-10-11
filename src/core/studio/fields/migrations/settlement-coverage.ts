import { z } from "zod";
import { assertCapability } from "@/core/permissions/check";
import type { CapabilityRegistry } from "../../registry/registry";
import { checksum, canonicalJson } from "../../registry/contracts";
import { entityDetailsSchema, fieldSettlementPolicySchema, supportsFieldMigrationIntent, supportsFieldMigrationQueryIntent } from "../../registry/entities";
import { compileCustomField } from "../../compiler/fields";
import { customFieldPayloadSchema } from "../schema";
import { assertFieldMigrationPolicies, assertVersionedFieldMigrationPolicies } from "./access";
import { FieldMigrationReviewError } from "./contracts";
import type { FieldMigrationAuthority } from "./authority";
import type { inspectFieldMigrationSettlementIdentity, inspectRequiredFieldMigrationSettlementIdentity } from "./settlement-inspection";
import { fieldRuntimeAuthorityInTransaction } from "../runtime-authority";
import { resolveFieldMigrationPrincipal } from "../principal";
import { fieldMigrationPrincipalSchema } from "../principal-contract";
import { inspectSealedFieldVersion } from "../sealed-field";
import { inspectRollbackRequiredFieldMigrationReview } from "./inspection";

function changed(): never { throw new FieldMigrationReviewError("REVIEW_CHANGED"); }
type Inspected = Awaited<ReturnType<typeof inspectFieldMigrationSettlementIdentity>>;

/** Current actor, active plus original/written policies. No creator identity
 * substitution, client grants, value decoding or original draft assumption. */
export async function validateFieldMigrationSettlementCoverage(authority: FieldMigrationAuthority, registry: CapabilityRegistry, inspected: Inspected,
  mode: "rollback" | "history") {
  const { transaction: tx, session, company } = authority, { intent, definition } = inspected;
  if (intent.organisationId !== session.organisationId || definition.organisationId !== session.organisationId || definition.kind !== "customField" || !definition.activeVersionId) changed();
  const active = await tx.studioDefinitionVersion.findFirst({ where: { id: definition.activeVersionId, organisationId: session.organisationId, definitionId: definition.id },
    select: { id: true, payload: true, checksum: true, compiledPlan: true } });
  if (!active) changed();
  const current = customFieldPayloadSchema.parse(active.payload);
  assertFieldMigrationPolicies(session, company, current, intent.source.payload);
  assertFieldMigrationPolicies(session, company, current, intent.target.payload);
  const versions = await tx.$queryRaw<Array<{ versionId: string }>>`SELECT DISTINCT v."versionId" FROM studio_field_values v
    WHERE v."organisationId"=${session.organisationId} AND v."definitionId"=${definition.id}::uuid AND (
      EXISTS (SELECT 1 FROM studio_field_migration_observations o WHERE o."preparationId"=${intent.id}::uuid AND o."organisationId"=v."organisationId" AND o."valueId"=v.id)
      OR EXISTS (SELECT 1 FROM studio_field_migration_outcomes outcome WHERE outcome."preparationId"=${intent.id}::uuid AND outcome."organisationId"=v."organisationId" AND outcome."targetValueId"=v.id))`;
  const written = await tx.studioDefinitionVersion.findMany({ where: { id: { in: versions.map(row => row.versionId) }, organisationId: session.organisationId, definitionId: definition.id },
    select: { id: true, payload: true, checksum: true, compiledPlan: true } });
  if (written.length !== versions.length) changed();
  const modules = new Set<string>();
  for (const version of [active, inspected.source, inspected.target, ...written]) {
    const payload = customFieldPayloadSchema.parse(version.payload);
    assertFieldMigrationPolicies(session, company, current, payload);
    const compiled = await compileCustomField(session, payload, registry);
    if (compiled.checksum !== version.checksum || checksum(version.compiledPlan) !== version.checksum) changed();
    const owner = await registry.resolve(session, payload.entity), record = entityDetailsSchema.parse(owner.details).record;
    if (!record?.fieldPolicy) changed();
    assertCapability(session, record.writeCapability);
    for (const dependency of compiled.plan.dependencies) modules.add(dependency.ownerModuleId);
  }
  const policy = await registry.resolveFieldSettlement(session, intent.source.payload.entity, intent.target.payload.entity, intent.schemaVersion);
  const details = fieldSettlementPolicySchema.parse(policy.details.fieldSettlement);
  for (const version of [active, inspected.source, inspected.target, ...written]) {
    const storage = customFieldPayloadSchema.parse(version.payload).field.storage;
    if (storage.type === "reference" && (storage.entity.id !== details.entityId || !details.referenceVersions.includes(storage.entity.version))) changed();
  }
  modules.add(policy.ownerModuleId);
  for (const moduleId of [...modules].sort()) {
    await tx.$queryRaw`SELECT id FROM module_states WHERE "organisationId"=${session.organisationId} AND "moduleId"=${moduleId} FOR SHARE`;
    if (!await tx.moduleState.findFirst({ where: { organisationId: session.organisationId, moduleId, enabled: true, entitled: true }, select: { id: true } }))
      throw new Error("DEPENDENCY_BROKEN: field source is unavailable.");
  }
  const result = z.strictObject({ organisationId: z.string(), entityId: z.string(), mode: z.enum(["rollback", "history"]),
    nativeCoverageComplete: z.literal(true), nativeReferenceCoverageComplete: z.literal(true) }).parse(await registry.invokeQueryInTransaction(
    { session, transaction: tx }, policy, { preparationId: intent.id, mode }));
  if (canonicalJson(result) !== canonicalJson({ organisationId: session.organisationId, entityId: intent.target.payload.entity.id, mode,
    nativeCoverageComplete: true, nativeReferenceCoverageComplete: true })) changed();
}

type RequiredInspected = Awaited<ReturnType<typeof inspectRequiredFieldMigrationSettlementIdentity>>;
const sealedSelect = { id: true, organisationId: true, definitionId: true, schemaVersion: true, payload: true, checksum: true, compiledPlan: true } as const;

/** Current settler coverage, separate from creator-bound execution. Historical
 * condition plans remain immutable metadata: only rollback reevaluates their
 * current inputs and exact original representation through its bounded bridge. */
export async function validateRequiredFieldMigrationSettlementCoverage(authority: FieldMigrationAuthority, _registry: CapabilityRegistry,
  inspected: RequiredInspected, mode: "rollback" | "history") {
  const fresh = await fieldRuntimeAuthorityInTransaction(authority.session, authority.transaction);
  const { session, stamp, transaction: tx, registry } = fresh, principal = fieldMigrationPrincipalSchema.parse(authority.principal);
  if (principal.organisationId !== stamp.organisationId || principal.userId !== stamp.userId || principal.membershipId !== stamp.membershipId
    || principal.authVersion !== stamp.authVersion || principal.sessionVersion !== stamp.sessionVersion) changed();
  const resolved = await resolveFieldMigrationPrincipal(principal);
  if (resolved.organisationId !== session.organisationId || resolved.userId !== session.userId || resolved.membershipId !== session.membershipId) changed();
  const { intent, definition } = inspected;
  if (mode !== "rollback" && mode !== "history") changed();
  if (intent.schemaVersion !== 2 || intent.organisationId !== session.organisationId || definition.organisationId !== session.organisationId
    || definition.id !== intent.definitionId || definition.kind !== "customField" || !definition.activeVersionId) changed();
  const company = await tx.organisation.findFirst({ where: { id: session.organisationId }, select: { id: true, kind: true, status: true, archivedAt: true, isTest: true } });
  if (!company) changed();
  const currentCompany = company;
  const active = await tx.studioDefinitionVersion.findFirst({ where: { id: definition.activeVersionId, organisationId: session.organisationId, definitionId: definition.id }, select: sealedSelect });
  if (!active || active.id !== definition.activeVersionId || inspected.source.id !== intent.source.versionId
    || inspected.target.id !== inspected.receipt.targetVersionId || inspected.source.checksum !== intent.source.versionChecksum
    || inspected.target.checksum !== intent.target.compiledChecksum || checksum(inspected.source.payload) !== checksum(intent.source.payload)
    || checksum(inspected.target.payload) !== checksum(intent.target.payload)) changed();
  const modules = new Set<string>(["studio"]), current = inspectSealedFieldVersion(registry, active, session.organisationId, definition.id).payload;
  async function check(version: Parameters<typeof inspectSealedFieldVersion>[1]) {
    const plan = inspectSealedFieldVersion(registry, version, session.organisationId, definition.id), payload = plan.payload;
    assertVersionedFieldMigrationPolicies(session, currentCompany, current, payload);
    // Strip only the conditional metadata for present-day base/native/reference
    // permissions. Its full sealed graph above is neither discarded nor run.
    const base = customFieldPayloadSchema.parse({ schemaVersion: 1, entity: payload.entity, storageGeneration: payload.storageGeneration, field: payload.field });
    const compiledBase = await compileCustomField(session, base, registry);
    const owner = await registry.resolve(session, payload.entity), record = entityDetailsSchema.parse(owner.details).record;
    if (!record?.fieldPolicy) changed();
    assertCapability(session, record.writeCapability);
    for (const dependency of compiledBase.plan.dependencies) modules.add(dependency.ownerModuleId);
    return payload;
  }
  const payloads = [];
  for (const version of [active, inspected.source, inspected.target]) payloads.push(await check(version));
  const targetOwner = await registry.resolve(session, intent.target.payload.entity), record = entityDetailsSchema.parse(targetOwner.details).record;
  const snapshot = record?.migrationSnapshot, query = await registry.resolve(session, intent.ownerQuery);
  if (!record || !snapshot || !supportsFieldMigrationIntent(snapshot, 2) || !snapshot.sourceVersions.includes(intent.source.payload.entity.version)
    || snapshot.query.id !== query.id || snapshot.query.version !== query.version || query.ownerModuleId !== targetOwner.ownerModuleId
    || query.capability !== record.writeCapability || query.details.transaction !== "required"
    || !supportsFieldMigrationQueryIntent(query, targetOwner.id, "snapshot", 2)) changed();
  const policy = await registry.resolveFieldSettlement(session, intent.source.payload.entity, intent.target.payload.entity, 2);
  const details = fieldSettlementPolicySchema.parse(policy.details.fieldSettlement);
  modules.add(policy.ownerModuleId); modules.add(query.ownerModuleId);
  const lockedModules = new Set<string>();
  async function lockModules() {
    for (const moduleId of [...modules].sort()) {
      if (lockedModules.has(moduleId)) continue;
      await tx.$queryRaw`SELECT id FROM module_states WHERE "organisationId"=${session.organisationId} AND "moduleId"=${moduleId} FOR SHARE`;
      if (!await tx.moduleState.findFirst({ where: { organisationId: session.organisationId, moduleId, enabled: true, entitled: true }, select: { id: true } }))
        throw new Error("DEPENDENCY_BROKEN: field source is unavailable.");
      lockedModules.add(moduleId);
    }
  }
  await lockModules();
  const context = { session, transaction: tx };
  // Complete private/native access must precede archive value IDs and SQL.
  await registry.invokeQueryInTransaction(context, intent.ownerQuery, { mode: "preflight" });
  const versions = await tx.$queryRaw<Array<{ versionId: string }>>`SELECT DISTINCT v."versionId" FROM studio_field_values v
    WHERE v."organisationId"=${session.organisationId} AND v."definitionId"=${definition.id}::uuid AND (
      EXISTS (SELECT 1 FROM studio_field_migration_observations o WHERE o."preparationId"=${intent.id}::uuid AND o."organisationId"=v."organisationId" AND o."valueId"=v.id)
      OR EXISTS (SELECT 1 FROM studio_field_migration_outcomes outcome WHERE outcome."preparationId"=${intent.id}::uuid AND outcome."organisationId"=v."organisationId" AND outcome."targetValueId"=v.id))`;
  const written = await tx.studioDefinitionVersion.findMany({ where: { id: { in: versions.map(row => row.versionId) }, organisationId: session.organisationId, definitionId: definition.id }, select: sealedSelect });
  if (written.length !== versions.length || new Set(written.map(row => row.id)).size !== written.length
    || written.some(row => !versions.some(ref => ref.versionId === row.id))) changed();
  for (const version of written) payloads.push(await check(version));
  for (const payload of payloads) if (payload.field.storage.type === "reference"
    && (payload.field.storage.entity.id !== details.entityId || !details.referenceVersions.includes(payload.field.storage.entity.version))) changed();
  await lockModules();
  if (mode === "rollback") await inspectRollbackRequiredFieldMigrationReview({ ...authority, ...fresh, principal, company }, intent);
  const result = z.strictObject({ organisationId: z.string(), entityId: z.string(), mode: z.enum(["rollback", "history"]),
    nativeCoverageComplete: z.literal(true), nativeReferenceCoverageComplete: z.literal(true) }).parse(await registry.invokeQueryInTransaction(context, policy, { preparationId: intent.id, mode }));
  if (canonicalJson(result) !== canonicalJson({ organisationId: session.organisationId, entityId: intent.target.payload.entity.id, mode,
    nativeCoverageComplete: true, nativeReferenceCoverageComplete: true })) changed();
}
