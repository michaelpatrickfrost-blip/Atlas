import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { assertCapability } from "@/core/permissions/check";
import { writeAudit } from "@/core/audit/log";
import { STUDIO_CAPABILITIES } from "../permissions";
import { assertFieldBinding } from "../fields/binding";
import { checksum } from "../registry/contracts";
import type { CompiledDefinition } from "./publication";

type ActivationVersion = Pick<Prisma.StudioDefinitionVersionGetPayload<object>,
  "id" | "organisationId" | "definitionId" | "version" | "compiledPlan" | "checksum">;

/** One platform activation transaction primitive. Caller loads the immutable
 * version and compiles it on the server, refreshes Studio/module/data authority
 * where needed and owns the transaction. No client hook or migration waiver.
 * Database guards independently require exact reviewed cutover lineage. */
export async function activateCompiledVersionInTransaction(tx: Prisma.TransactionClient, session: Session,
  definitionId: string, expectedRevision: number, version: ActivationVersion, compiled: CompiledDefinition, expectedActiveVersionId?: string) {
  assertCapability(session, STUDIO_CAPABILITIES.publish);
  if (version.organisationId !== session.organisationId || version.definitionId !== definitionId)
    throw new Error("FORBIDDEN: this Studio version is unavailable in the current company.");
  if (version.checksum !== checksum(version.compiledPlan) || version.checksum !== compiled.checksum)
    throw new Error("DEPENDENCY_BROKEN: published Studio plan changed or is incompatible");
  if (compiled.plan.kind === "customField") await assertFieldBinding(tx, session, definitionId, compiled.plan.payload);
  const modules = [...new Set(compiled.plan.dependencies.map(d => d.ownerModuleId))];
  if (await tx.moduleState.count({ where: { organisationId: session.organisationId, moduleId: { in: modules }, enabled: true, entitled: true } }) !== modules.length)
    throw new Error("DEPENDENCY_BROKEN: source module unavailable");
  const changed = await tx.studioDefinition.updateMany({ where: { id: definitionId, organisationId: session.organisationId, revision: expectedRevision,
    retiredAt: null, ...(expectedActiveVersionId !== undefined ? { activeVersionId: expectedActiveVersionId } : {}) },
    data: { activeVersionId: version.id, revision: { increment: 1 } } });
  if (changed.count !== 1) throw new Error("CONFLICT: another editor changed this definition. Reload and compare your draft before saving.");
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "studio.definition.activated",
    entityType: "StudioDefinition", entityId: definitionId, after: { versionId: version.id, version: version.version } }, tx);
  return { revision: expectedRevision + 1 };
}
