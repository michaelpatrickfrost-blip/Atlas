import type { Prisma } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { writeAudit } from "@/core/audit/log";
import { STUDIO_CAPABILITIES } from "../permissions";
import type { compileDefinition } from "../compiler";
import { bindPublishedField } from "../fields/binding";

export type PublicationDraft = Prisma.StudioDraftGetPayload<{ include: { definition: true; baseVersion: { select: { version: true } } } }>;
export type CompiledDefinition = Awaited<ReturnType<typeof compileDefinition>>;
function conflict(): never { throw new Error("CONFLICT: another editor changed this definition. Reload and compare your draft before saving."); }

/** Internal single publisher transaction. The caller supplies a server-loaded
 * scoped draft and freshly compiled plan, enforces module/current authority, and
 * owns the transaction. A reviewed field binder is a trusted Core callback only;
 * never a client/persisted hook. Ordinary callers retain the original binder.
 */
export async function publishCompiledDefinitionInTransaction(tx: Prisma.TransactionClient, session: Session,
  draft: PublicationDraft, expectedRevision: number, compiled: CompiledDefinition, bindField: typeof bindPublishedField = bindPublishedField) {
  assertCapability(session, STUDIO_CAPABILITIES.publish);
  if (draft.organisationId !== session.organisationId || draft.definition.organisationId !== session.organisationId
    || draft.definitionId !== draft.definition.id || draft.revision !== expectedRevision || draft.definition.kind !== compiled.plan.kind
    || draft.definition.latestVersion !== (draft.baseVersion?.version ?? 0)) conflict();
  const definitionId = draft.definitionId;
  const modules = [...new Set(compiled.plan.dependencies.map(d => d.ownerModuleId))];
  const available = await tx.moduleState.count({ where: { organisationId: session.organisationId, moduleId: { in: modules }, enabled: true, entitled: true } });
  if (available !== modules.length) throw new Error("DEPENDENCY_BROKEN: source module unavailable");
  const changed = await tx.studioDefinition.updateMany({ where: { id: definitionId, organisationId: session.organisationId,
    revision: draft.definition.revision, latestVersion: draft.definition.latestVersion, retiredAt: null }, data: { latestVersion: { increment: 1 }, revision: { increment: 1 } } });
  if (changed.count !== 1) conflict();
  const number = draft.definition.latestVersion + 1;
  const version = await tx.studioDefinitionVersion.create({ data: { organisationId: session.organisationId, definitionId, version: number,
    semanticVersion: `1.0.${number - 1}`, schemaVersion: 1, payload: compiled.payload, compiledPlan: compiled.plan, checksum: compiled.checksum,
    createdBy: session.userId, dependencies: { create: compiled.plan.dependencies.map(ref => ({ ownerModuleId: ref.ownerModuleId, contractId: ref.id,
      contractVersion: ref.version, schemaHash: ref.schemaHash, contractHash: ref.contractHash } satisfies Prisma.StudioDependencyCreateWithoutVersionInput)) } },
    select: { id: true, organisationId: true, definitionId: true, version: true, payload: true, compiledPlan: true, checksum: true } });
  if (compiled.plan.kind === "customField") await bindField(tx, session, definitionId, draft.definition.key, version.id, compiled.plan.payload);
  const updated = await tx.studioDraft.updateMany({ where: { id: draft.id, organisationId: session.organisationId, revision: expectedRevision },
    data: { revision: { increment: 1 }, baseVersionId: version.id, validation: { checksum: compiled.checksum, warnings: compiled.warnings, validatedRevision: expectedRevision } } });
  if (updated.count !== 1) conflict();
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "studio.definition.published", entityType: "StudioDefinition",
    entityId: definitionId, after: { versionId: version.id, version: number, checksum: compiled.checksum, warnings: compiled.warnings } }, tx);
  return { version, versionNumber: number, draftRevision: expectedRevision + 1 };
}
