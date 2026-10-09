import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { checksum } from "../registry/contracts";
import { studioRegistry } from "../registry/runtime";
import { entityDetailsSchema } from "../registry/entities";
import { customFieldPayloadSchema, type CustomFieldPayload } from "./schema";

export function fieldDefinitionKey(payload: CustomFieldPayload) {
  return `${payload.entity.id}.${payload.field.key}`;
}

/** Publication owns the permanent identity; neither drafts nor client plans do. */
export async function bindPublishedField(tx: Prisma.TransactionClient, session: Session, definitionId: string, definitionKey: string, versionId: string, payload: CustomFieldPayload) {
  if (definitionKey !== fieldDefinitionKey(payload)) throw new Error("Field definition key must match its permanent entity and field key.");
  // Serialize first publications per tenant/entity, including different definition
  // keys, so the owner's field limit cannot be raced. No business rows are locked.
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${JSON.stringify([session.organisationId, payload.entity.id])}, 0))::text`;
  const binding = await tx.studioFieldBinding.findFirst({ where: { definitionId, organisationId: session.organisationId } });
  if (binding) {
    await assertFieldBinding(tx, session, definitionId, payload);
    const previous = await tx.studioDefinitionVersion.findFirst({ where: { definitionId, organisationId: session.organisationId, id: { not: versionId } }, orderBy: { version: "desc" }, select: { payload: true } });
    if (!previous) throw new Error("Field binding has no published history.");
    assertCosmeticFieldEvolution(customFieldPayloadSchema.parse(previous.payload), payload);
    return;
  }
  const entity = studioRegistry().describe(payload.entity.id, payload.entity.version);
  const policy = entityDetailsSchema.parse(entity.details).record?.fieldPolicy;
  if (!policy) throw new Error("The owner has not approved typed additional fields.");
  const count = await tx.studioFieldBinding.count({ where: { organisationId: session.organisationId, entityId: payload.entity.id } });
  if (count >= policy.maxFields) throw new Error("This entity has reached its owner-approved field limit, including retained retired fields.");
  await tx.studioFieldBinding.create({ data: { definitionId, organisationId: session.organisationId, entityId: payload.entity.id, fieldKey: payload.field.key, originVersionId: versionId, initialGenerationId: payload.storageGeneration } });
  await tx.studioFieldGeneration.create({ data: { id: payload.storageGeneration, definitionId, organisationId: session.organisationId, entityId: payload.entity.id, valueType: payload.field.storage.type, originVersionId: versionId } });
}

/** Until 2B3's reviewed migration path exists, only cosmetic revisions may publish. */
export function assertCosmeticFieldEvolution(previous: CustomFieldPayload, next: CustomFieldPayload) {
  const structural = (payload: CustomFieldPayload) => ({ ...payload, field: { ...payload.field, label: "", help: "" } });
  if (checksum(structural(previous)) !== checksum(structural(next))) throw new Error("MIGRATION_REQUIRED: changing published field storage, constraints or access needs a reviewed evolution plan.");
}

export async function assertFieldBinding(tx: Prisma.TransactionClient, session: Session, definitionId: string, payload: CustomFieldPayload) {
  const generation = await tx.studioFieldGeneration.findFirst({ where: { id: payload.storageGeneration, definitionId, organisationId: session.organisationId, entityId: payload.entity.id, valueType: payload.field.storage.type,
    binding: { entityId: payload.entity.id, fieldKey: payload.field.key, organisationId: session.organisationId } }, select: { id: true } });
  if (!generation) throw new Error("DEPENDENCY_BROKEN: field schema has no matching tenant-owned storage generation.");
}
