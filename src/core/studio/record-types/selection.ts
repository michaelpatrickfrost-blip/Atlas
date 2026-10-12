import { randomUUID } from "node:crypto";
import { sessionAuthorityStamp, type Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import type { ContractReference } from "../registry/types";
import { checksum } from "../registry/contracts";
import { entityDetailsSchema } from "../registry/entities";
import { fieldRuntimeAuthorityInTransaction, type FieldRuntimeAuthority } from "../fields/runtime-authority";
import { lockFieldEntitiesInTransaction } from "../fields/entity-lock";
import { inspectRecordProfileInTransaction, preflightRecordProfileFields, resolveRecordProfileInTransaction } from "./runtime-profile";
import { recordTypePayloadSchema, recordTypeReferenceSchema } from "./schema";
import { assignRecordTypeInTransaction } from "./assignment";
import { recordTypeSelectionRequestSchema, recordTypeReassignmentSchema, type RecordTypeSelection } from "./selection-contract";

const maximum = 100;
function invalid(): never { throw new Error("RECORD_PROFILE_INVALID: the available business types are incompatible. Contact your administrator."); }
function conflict(): never { throw new Error("CONFLICT: the ticket or its business type changed. Refresh before saving."); }
async function context(authenticated: Session, tx: Prisma.TransactionClient, entity: ContractReference, input: unknown) {
  const request = recordTypeSelectionRequestSchema.parse(input);
  const authority = await fieldRuntimeAuthorityInTransaction(authenticated, tx);
  const source = await authority.registry.resolve(authority.session, entity);
  const details = source.kind === "entity" ? entityDetailsSchema.parse(source.details) : null;
  if (!details?.extensionPolicy.recordTypes || !details.record?.fieldPolicy) invalid();
  await lockFieldEntitiesInTransaction(tx, authority.session.organisationId, [entity.id]);
  const anchor = await authority.registry.authoriseRecord({ session: authority.session, transaction: tx }, entity,
    { recordId: request.recordId, intent: "extend", expectedRevision: request.recordRevision });
  if (anchor.organisationId !== authority.session.organisationId || anchor.recordId !== request.recordId || anchor.revision !== request.recordRevision) conflict();
  // Current and retained policy checks are mandatory even if all choices disappear.
  const current = await resolveRecordProfileInTransaction(authority,
    { entity, recordId: request.recordId, expectedRevision: request.recordRevision });
  const extension = await tx.studioExtensionRecord.findFirst({ where: { organisationId: authority.session.organisationId,
    entityId: entity.id, recordId: request.recordId }, select: { id: true, organisationId: true, entityId: true, recordId: true,
      revision: true, recordTypeAssignmentId: true } });
  if (extension && (extension.organisationId !== authority.session.organisationId || extension.entityId !== entity.id
    || extension.recordId !== request.recordId || !Number.isInteger(extension.revision) || extension.revision < 0
    || extension.revision >= 2147483647 || extension.recordTypeAssignmentId !== current.assignmentId)) invalid();
  if (!extension && current.assignmentId) invalid();
  return { authority, request, current, extension };
}
async function choice(authority: FieldRuntimeAuthority, entity: ContractReference, definitionId: string, omitDenied = false) {
  const definition = await authority.transaction.studioDefinition.findFirst({ where: { id: definitionId,
    organisationId: authority.session.organisationId, kind: "recordType", retiredAt: null }, include: { activeVersion: true } });
  if (!definition || definition.activeVersionId === null) return null;
  const version = definition.activeVersion;
  if (!version || definition.id !== definitionId || definition.organisationId !== authority.session.organisationId
    || definition.kind !== "recordType" || definition.retiredAt !== null || definition.activeVersionId !== version.id
    || version.definitionId !== definitionId || version.organisationId !== authority.session.organisationId) invalid();
  const pin = recordTypeReferenceSchema.parse({ kind: "recordType", definitionId, versionId: version.id,
    schemaVersion: version.schemaVersion, checksum: version.checksum });
  // Invalid seals/dependencies always propagate; only independently denied field
  // grants below may omit a choice, before its label/help crosses the boundary.
  const inspected = await inspectRecordProfileInTransaction(authority, pin);
  if (checksum(inspected.entity) !== checksum(entity)) invalid();
  const payload = recordTypePayloadSchema.parse(inspected.payload);
  try {
    await preflightRecordProfileFields(authority, inspected.profile, entity.id, { kind: "ordinary" });
  } catch (error) {
    if (omitDenied && error instanceof Error && error.message.startsWith("FORBIDDEN:")) return null;
    throw error;
  }
  return { pin, label: payload.label, help: payload.help };
}

/** Owner supplies the canonical entity; client requests never select an owner,
 * tenant, immutable version, profile or privilege. No value projection. */
export async function readRecordTypeSelectionInTransaction(authenticated: Session, tx: Prisma.TransactionClient,
  entity: ContractReference, input: unknown): Promise<RecordTypeSelection> {
  const { authority, request, current, extension } = await context(authenticated, tx, entity, input);
  const bindings = await tx.studioProfileBinding.findMany({ where: { organisationId: authority.session.organisationId,
    entityId: entity.id, kind: "recordType" }, select: { organisationId: true, entityId: true, kind: true, definitionId: true },
    orderBy: { definitionId: "asc" }, take: maximum + 1 });
  if (bindings.length > maximum || new Set(bindings.map(row => row.definitionId)).size !== bindings.length) invalid();
  const choices: RecordTypeSelection["choices"] = [];
  for (const binding of bindings) {
    if (binding.organisationId !== authority.session.organisationId || binding.entityId !== entity.id || binding.kind !== "recordType") invalid();
    const approved = await choice(authority, entity, binding.definitionId, true);
    if (approved) choices.push({ definitionId: binding.definitionId, label: approved.label, help: approved.help });
  }
  if (current.recordType && !choices.some(item => item.definitionId === current.recordType!.definitionId)) invalid();
  return { operationId: randomUUID(), ...request, extensionRevision: extension?.revision ?? null,
    currentDefinitionId: current.recordType?.definitionId ?? null, choices };
}

export async function reassignRecordTypeInTransaction(authenticated: Session, tx: Prisma.TransactionClient,
  entity: ContractReference, input: unknown) {
  const request = recordTypeReassignmentSchema.parse(input);
  const { authority } = await context(authenticated, tx, entity,
    { recordId: request.recordId, recordRevision: request.recordRevision });
  const selected = request.definitionId ? await choice(authority, entity, request.definitionId) : null;
  if (request.definitionId && !selected) conflict();
  // Existing service owns extension CAS, exact replay, final resulting values,
  // all-window closure and paired Audit; this is not a second assignment engine.
  return assignRecordTypeInTransaction(authority.session, tx, { operationId: request.operationId, entity,
    recordId: request.recordId, recordRevision: request.recordRevision,
    extensionRevision: request.extensionRevision, recordType: selected?.pin ?? null });
}


/** Metadata-only choices for a genuine current owning Read catalogue. This
 * reuses the original immutable choice/current-field policy path but supplies
 * no record visibility, Extend grant, value projection or assignment proof. */
export async function readRecordTypeMetadataChoicesInTransaction(authority: FieldRuntimeAuthority, entity: ContractReference) {
  await metadataOwner(authority, entity);
  const bindings = await authority.transaction.studioProfileBinding.findMany({ where: {
    organisationId: authority.session.organisationId, entityId: entity.id, kind: "recordType" },
    select: { organisationId: true, entityId: true, kind: true, definitionId: true },
    orderBy: { definitionId: "asc" }, take: maximum + 1 });
  if (bindings.length > maximum || new Set(bindings.map(row => row.definitionId)).size !== bindings.length) invalid();
  const result: { id: string; label: string }[] = [];
  for (const binding of bindings) {
    if (binding.organisationId !== authority.session.organisationId || binding.entityId !== entity.id || binding.kind !== "recordType") invalid();
    const approved = await choice(authority, entity, binding.definitionId, true);
    if (approved) result.push({ id: binding.definitionId, label: approved.label });
  }
  return result;
}

/** New authored stable selectors must name approved active types. Retained Page
 * seals deliberately do not call this: their equality predicate never pinned a
 * type version, and retirement cannot rewrite a sealed historical Page. */
export async function assertRecordTypeMetadataSelectorsInTransaction(authority: FieldRuntimeAuthority,
  entity: ContractReference, definitionIds: readonly string[]) {
  if (!definitionIds.length) return;
  if (definitionIds.length > maximum || new Set(definitionIds).size !== definitionIds.length) invalid();
  await metadataOwner(authority, entity);
  for (const id of definitionIds) {
    const definitionId = recordTypeReferenceSchema.shape.definitionId.parse(id);
    const binding = await authority.transaction.studioProfileBinding.findFirst({ where: {
      organisationId: authority.session.organisationId, entityId: entity.id, kind: "recordType", definitionId },
      select: { organisationId: true, entityId: true, kind: true, definitionId: true } });
    if (!binding || binding.organisationId !== authority.session.organisationId || binding.entityId !== entity.id
      || binding.kind !== "recordType" || binding.definitionId !== definitionId || !await choice(authority, entity, definitionId)) invalid();
  }
}
async function metadataOwner(authority: FieldRuntimeAuthority, entity: ContractReference) {
  const stamp = sessionAuthorityStamp(authority.session);
  if (!stamp || stamp !== authority.stamp || stamp.organisationId !== authority.session.organisationId
    || stamp.userId !== authority.session.userId || stamp.membershipId !== authority.session.membershipId)
    throw new Error("FORBIDDEN: genuine current business-type metadata authority is required.");
  const source = await authority.registry.resolve(authority.session, entity);
  const details = source.kind === "entity" ? entityDetailsSchema.parse(source.details) : null;
  if (!details?.extensionPolicy.recordTypes || !details.record?.fieldPolicy) invalid();
}
