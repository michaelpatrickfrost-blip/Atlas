import { z } from "zod";
import { assertCapability } from "@/core/permissions/check";
import type { CapabilityRegistry } from "../../registry/registry";
import { checksum, canonicalJson } from "../../registry/contracts";
import { entityDetailsSchema, fieldSettlementPolicySchema } from "../../registry/entities";
import { compileCustomField } from "../../compiler/fields";
import { customFieldPayloadSchema } from "../schema";
import { assertFieldMigrationPolicies } from "./access";
import { FieldMigrationReviewError } from "./contracts";
import type { FieldMigrationAuthority } from "./authority";
import type { inspectFieldMigrationSettlementIdentity } from "./settlement-inspection";

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
  const policy = await registry.resolveFieldSettlement(session, intent.source.payload.entity, intent.target.payload.entity);
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
