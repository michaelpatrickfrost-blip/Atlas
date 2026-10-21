import type { Prisma } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { writeAudit } from "@/core/audit/log";
import { STUDIO_CAPABILITIES } from "../permissions";
import type { compileDefinition } from "../compiler";
import { bindPublishedField } from "../fields/binding";
import type { compileConditionalCustomField } from "../fields/conditional-compiler";
import type { VersionedFieldPayload } from "../fields/required-contract";
import { lockFieldEntitiesInTransaction } from "../fields/entity-lock";
import { assertStudioRuntimeFeatureEnabled, studioRuntimeFeaturesForPayload } from "../runtime-features";
import type { CompiledRecordProfile } from "../record-types/compiler";
import type { CompiledPageDefinition } from "../pages/definition-compiler";
import type { CompiledViewDefinition } from "../views/definition-compiler";
import { bindPublishedProfile } from "../record-types/binding";
import { inspectConfigurationGraph } from "../configuration/pins";
import { pagePayloadSchema } from "../pages/schema";

export type PublicationDraft = Prisma.StudioDraftGetPayload<{ include: { definition: true; baseVersion: { select: { version: true } } } }>;
export type CompiledDefinition = Awaited<ReturnType<typeof compileDefinition>>;
export type ReviewedCompiledDefinition = CompiledDefinition | Awaited<ReturnType<typeof compileConditionalCustomField>> | CompiledRecordProfile | CompiledPageDefinition | CompiledViewDefinition;
type ReviewedFieldBinder = (tx: Prisma.TransactionClient, session: Session, definitionId: string, key: string, versionId: string, payload: VersionedFieldPayload) => Promise<void>;
function conflict(): never { throw new Error("CONFLICT: another editor changed this definition. Reload and compare your draft before saving."); }

/** Internal single publisher transaction. The caller supplies a server-loaded
 * scoped draft and freshly compiled plan, enforces module/current authority, and
 * owns the transaction. A reviewed field binder is a trusted Core callback only;
 * never a client/persisted hook. Ordinary callers retain the original binder.
 */
export async function publishCompiledDefinitionInTransaction(tx: Prisma.TransactionClient, session: Session,
  draft: PublicationDraft, expectedRevision: number, compiled: ReviewedCompiledDefinition, bindField?: ReviewedFieldBinder) {
  assertCapability(session, STUDIO_CAPABILITIES.publish);
  // Closed ordinary publication remains schema1. Conditional plans may enter
  // only through the reviewed migration caller's trusted Core binder.
  if (compiled.plan.schemaVersion === 2 && !bindField) throw new Error("MIGRATION_REQUIRED: conditional publication requires reviewed field evolution.");
  if (draft.organisationId !== session.organisationId || draft.definition.organisationId !== session.organisationId
    || draft.definitionId !== draft.definition.id || draft.revision !== expectedRevision || draft.definition.kind !== compiled.plan.kind
    || draft.definition.latestVersion !== (draft.baseVersion?.version ?? 0)) conflict();
  for (const feature of studioRuntimeFeaturesForPayload(compiled.plan.kind, compiled.plan.payload)) assertStudioRuntimeFeatureEnabled(feature);
  const definitionId = draft.definitionId;
  const modules = [...new Set(compiled.plan.dependencies.map(d => d.ownerModuleId))];
  const available = await tx.moduleState.count({ where: { organisationId: session.organisationId, moduleId: { in: modules }, enabled: true, entitled: true } });
  if (available !== modules.length) throw new Error("DEPENDENCY_BROKEN: source module unavailable");
  // First publication has no binding yet. Use the server-compiled primary
  // entity before any definition/version/draft mutation; the binder re-enters
  // the same transaction lock without introducing a later lock order.
  if (compiled.plan.kind === "customField" || compiled.plan.kind === "entityProfile" || compiled.plan.kind === "recordType" || compiled.plan.kind === "page")
    await lockFieldEntitiesInTransaction(tx, session.organisationId, [compiled.plan.payload.entity.id]);
  if ("configurationDependencies" in compiled.plan)
    await inspectConfigurationGraph(session, tx, compiled.plan.configurationDependencies, definitionId);
  if (compiled.plan.kind === "page" && draft.definition.latestVersion > 0) {
    const origin = await tx.studioDefinitionVersion.findFirst({ where: { organisationId: session.organisationId,
      definitionId, version: 1, definition: { kind: "page", retiredAt: null } }, select: { payload: true } });
    if (!origin || pagePayloadSchema.parse(origin.payload).entity.id !== compiled.plan.payload.entity.id)
      throw new Error("A published screen keeps its original business area. Create a new screen for a different app.");
  }
  const changed = await tx.studioDefinition.updateMany({ where: { id: definitionId, organisationId: session.organisationId,
    revision: draft.definition.revision, latestVersion: draft.definition.latestVersion, retiredAt: null }, data: { latestVersion: { increment: 1 }, revision: { increment: 1 } } });
  if (changed.count !== 1) conflict();
  const number = draft.definition.latestVersion + 1;
  const version = await tx.studioDefinitionVersion.create({ data: { organisationId: session.organisationId, definitionId, version: number,
    semanticVersion: `1.0.${number - 1}`, schemaVersion: compiled.plan.schemaVersion, payload: compiled.payload, compiledPlan: compiled.plan, checksum: compiled.checksum,
    createdBy: session.userId, dependencies: { create: compiled.plan.dependencies.map(ref => ({ ownerModuleId: ref.ownerModuleId, contractId: ref.id,
      contractVersion: ref.version, schemaHash: ref.schemaHash, contractHash: ref.contractHash } satisfies Prisma.StudioDependencyCreateWithoutVersionInput)) },
    ...("configurationDependencies" in compiled.plan ? { configurationDependencies: { create: compiled.plan.configurationDependencies.map(pin => ({
      targetDefinitionId: pin.definitionId, targetVersionId: pin.versionId, targetKind: pin.kind,
      targetSchemaVersion: pin.schemaVersion, targetChecksum: pin.checksum } satisfies Prisma.StudioConfigurationDependencyUncheckedCreateWithoutVersionInput)) } } : {}) },
    select: { id: true, organisationId: true, definitionId: true, version: true, payload: true, compiledPlan: true, checksum: true } });
  if (compiled.plan.kind === "customField") {
    if (bindField) await bindField(tx, session, definitionId, draft.definition.key, version.id, compiled.plan.payload);
    else {
      if (compiled.plan.payload.schemaVersion !== 1) throw new Error("MIGRATION_REQUIRED: conditional publication requires reviewed field evolution.");
      await bindPublishedField(tx, session, definitionId, draft.definition.key, version.id, compiled.plan.payload);
    }
  }
  if (compiled.plan.kind === "entityProfile" || compiled.plan.kind === "recordType")
    await bindPublishedProfile(tx, session, definitionId, draft.definition.key, version.id, compiled as CompiledRecordProfile);
  const updated = await tx.studioDraft.updateMany({ where: { id: draft.id, organisationId: session.organisationId, revision: expectedRevision },
    data: { revision: { increment: 1 }, baseVersionId: version.id, validation: { checksum: compiled.checksum, warnings: compiled.warnings, validatedRevision: expectedRevision } } });
  if (updated.count !== 1) conflict();
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "studio.definition.published", entityType: "StudioDefinition",
    entityId: definitionId, after: { versionId: version.id, version: number, checksum: compiled.checksum, warnings: compiled.warnings } }, tx);
  return { version, versionNumber: number, draftRevision: expectedRevision + 1 };
}
