import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { assertCapability } from "@/core/permissions/check";
import { writeAudit } from "@/core/audit/log";
import { STUDIO_CAPABILITIES } from "../permissions";
import { assertFieldBinding } from "../fields/binding";
import { checksum } from "../registry/contracts";
import type { ReviewedCompiledDefinition } from "./publication";
import { lockFieldEntitiesInTransaction } from "../fields/entity-lock";
import { assertStudioRuntimeFeatureEnabled, studioRuntimeFeaturesForPayload } from "../runtime-features";
import { inspectConfigurationGraph } from "../configuration/pins";
import { assertProfileBinding } from "../record-types/binding";
import { validateCandidateRecordProfileCoverage } from "../record-types/coverage";
import type { CompiledRecordProfile } from "../record-types/compiler";
import { assertFieldConfigurationCompatibilityInTransaction } from "../configuration/impact";

type ActivationVersion = Pick<Prisma.StudioDefinitionVersionGetPayload<object>,
  "id" | "organisationId" | "definitionId" | "version" | "compiledPlan" | "checksum">;

/** One platform activation transaction primitive. Caller loads the immutable
 * version and compiles it on the server, refreshes Studio/module/data authority
 * where needed and owns the transaction. No client hook or migration waiver.
 * Database guards independently require exact reviewed cutover lineage. */
export async function activateCompiledVersionInTransaction(tx: Prisma.TransactionClient, session: Session,
  definitionId: string, expectedRevision: number, version: ActivationVersion, compiled: ReviewedCompiledDefinition, expectedActiveVersionId?: string) {
  assertCapability(session, STUDIO_CAPABILITIES.publish);
  if (version.organisationId !== session.organisationId || version.definitionId !== definitionId)
    throw new Error("FORBIDDEN: this Studio version is unavailable in the current company.");
  if (version.checksum !== checksum(version.compiledPlan) || version.checksum !== compiled.checksum)
    throw new Error("DEPENDENCY_BROKEN: published Studio plan changed or is incompatible");
  for (const feature of studioRuntimeFeaturesForPayload(compiled.plan.kind, compiled.plan.payload)) assertStudioRuntimeFeatureEnabled(feature);
  const modules = [...new Set(compiled.plan.dependencies.map(d => d.ownerModuleId))];
  if (await tx.moduleState.count({ where: { organisationId: session.organisationId, moduleId: { in: modules }, enabled: true, entitled: true } }) !== modules.length)
    throw new Error("DEPENDENCY_BROKEN: source module unavailable");
  if (compiled.plan.kind === "customField" || compiled.plan.kind === "page" || compiled.plan.kind === "entityProfile" || compiled.plan.kind === "recordType")
    await lockFieldEntitiesInTransaction(tx, session.organisationId, [compiled.plan.payload.entity.id]);
  if ("configurationDependencies" in compiled.plan)
    await inspectConfigurationGraph(session, tx, compiled.plan.configurationDependencies, definitionId);
  if (compiled.plan.kind === "customField") {
    await assertFieldBinding(tx, session, definitionId, compiled.plan.payload);
    await assertFieldConfigurationCompatibilityInTransaction(session, tx, definitionId, compiled.plan.payload);
  }
  if (compiled.plan.kind === "entityProfile" || compiled.plan.kind === "recordType") {
    await assertProfileBinding(tx, session, definitionId, compiled as CompiledRecordProfile);
    await validateCandidateRecordProfileCoverage(session, tx, { definitionId, versionId: version.id, definitionRevision: expectedRevision });
  }
  const changed = await tx.studioDefinition.updateMany({ where: { id: definitionId, organisationId: session.organisationId, revision: expectedRevision,
    retiredAt: null, ...(expectedActiveVersionId !== undefined ? { activeVersionId: expectedActiveVersionId } : {}) },
    data: { activeVersionId: version.id, revision: { increment: 1 } } });
  if (changed.count !== 1) throw new Error("CONFLICT: another editor changed this definition. Reload and compare your draft before saving.");
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "studio.definition.activated",
    entityType: "StudioDefinition", entityId: definitionId, after: { versionId: version.id, version: version.version } }, tx);
  return { revision: expectedRevision + 1 };
}
