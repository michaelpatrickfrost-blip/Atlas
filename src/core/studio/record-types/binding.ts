import type { Prisma } from "@/generated/prisma/client";
import type { Session } from "@/core/auth/session";
import { checksum } from "../registry/contracts";
import { lockFieldEntitiesInTransaction } from "../fields/entity-lock";
import type { CompiledRecordProfile } from "./compiler";

export const entityProfileDefinitionKey = (entityId: string) => `${entityId}.base_profile`;
function invalid(): never { throw new Error("DEPENDENCY_BROKEN: this record design has no matching permanent canonical owner."); }

/** Original publisher callback only. The caller supplies a freshly server-
 * compiled plan and inserted immutable version in the same transaction. Binding
 * grants no record access, assignment or activation. Shared entity lock preserves
 * the field/native lock order and serialises competing first base publications. */
export async function bindPublishedProfile(tx: Prisma.TransactionClient, session: Session, definitionId: string,
  definitionKey: string, versionId: string, compiled: CompiledRecordProfile) {
  const { kind, payload } = compiled.plan;
  if (checksum(compiled.plan) !== compiled.checksum || checksum(compiled.payload) !== checksum(payload)) invalid();
  if (kind === "entityProfile" && definitionKey !== entityProfileDefinitionKey(payload.entity.id)) invalid();
  await lockFieldEntitiesInTransaction(tx, session.organisationId, [payload.entity.id]);
  const version = await tx.studioDefinitionVersion.findFirst({ where: { id: versionId, definitionId, organisationId: session.organisationId },
    select: { id: true, schemaVersion: true, checksum: true, compiledPlan: true,
      definition: { select: { kind: true, key: true, retiredAt: true } } } });
  if (!version || version.schemaVersion !== 1 || version.checksum !== compiled.checksum || checksum(version.compiledPlan) !== compiled.checksum
    || version.definition.kind !== kind || version.definition.key !== definitionKey || version.definition.retiredAt !== null) invalid();
  const existing = await tx.studioProfileBinding.findFirst({ where: { definitionId, organisationId: session.organisationId } });
  if (existing) {
    if (existing.entityId !== payload.entity.id || existing.kind !== kind) invalid();
    return;
  }
  await tx.studioProfileBinding.create({ data: { definitionId, organisationId: session.organisationId, entityId: payload.entity.id,
    kind, originVersionId: versionId } });
}

export async function assertProfileBinding(tx: Prisma.TransactionClient, session: Session, definitionId: string, compiled: CompiledRecordProfile) {
  const binding = await tx.studioProfileBinding.findFirst({ where: { definitionId, organisationId: session.organisationId,
    entityId: compiled.plan.payload.entity.id, kind: compiled.plan.kind }, select: { originVersionId: true } });
  if (!binding) invalid();
  return binding;
}
