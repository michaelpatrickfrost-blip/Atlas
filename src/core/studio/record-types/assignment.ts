import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { writeAudit } from "@/core/audit/log";
import { checksum } from "../registry/contracts";
import { entityDetailsSchema } from "../registry/entities";
import { lockFieldEntitiesInTransaction } from "../fields/entity-lock";
import { fieldRuntimeAuthorityInTransaction, type FieldRuntimeAuthority } from "../fields/runtime-authority";
import { closeAffectedFieldWriteWindows } from "../fields/runtime-write-window";
import { validateResultingFieldRequirements } from "../fields/required-runtime";
import { configurationReferenceSchema } from "./schema";
import { inspectRecordProfileInTransaction, preflightRecordProfileFields, type RecordProfileAccess } from "./runtime-profile";
import { recordTypeAssignmentRequestSchema, recordTypeAssignmentProvenanceSchema,
  RECORD_TYPE_ASSIGNMENT_ACTION, RECORD_TYPE_ASSIGNMENT_ENTITY } from "./assignment-contract";

function conflict(): never { throw new Error("CONFLICT: the record or its business design changed. Refresh before assigning a record type."); }
function invalid(): never { throw new Error("RECORD_PROFILE_INVALID: this record type is unavailable or incompatible."); }

/** Internal existing-record boundary only; no endpoint or Studio publication
 * grant. The owner still supplies native/private Extend permission and revision. */
export async function assignRecordTypeInTransaction(authenticated: Session, transaction: Prisma.TransactionClient, input: unknown) {
  return assign(await fieldRuntimeAuthorityInTransaction(authenticated, transaction), input, { kind: "ordinary" });
}

/** Actual owner-issued INSERT proof only. This never borrows Read/Manage or
 * mints a proof from a supplied record ID. Stage initial values before calling. */
export async function assignInitialRecordTypeInTransaction(authenticated: Session, transaction: Prisma.TransactionClient, input: unknown, proof: object) {
  return assign(await fieldRuntimeAuthorityInTransaction(authenticated, transaction), input, { kind: "initial", proof });
}

async function assign(authority: FieldRuntimeAuthority, input: unknown, access: Exclude<RecordProfileAccess, { kind: "native_validation" }>) {
  const request = recordTypeAssignmentRequestSchema.parse(input), { session, transaction: tx, registry } = authority;
  const context = { session, transaction: tx };
  const metadata = access.kind === "initial" ? (await registry.resolveCurrentFieldInitialisation(session, request.entity)).source : await registry.resolve(session, request.entity);
  const details = metadata.kind === "entity" ? entityDetailsSchema.parse(metadata.details) : null;
  if (!details?.extensionPolicy.recordTypes || !details.record?.fieldPolicy) invalid();
  await lockFieldEntitiesInTransaction(tx, session.organisationId, [request.entity.id]);
  const anchor = access.kind === "initial" ? await registry.authoriseCurrentFieldInitialisation(context, request.entity, access.proof)
    : await registry.authoriseRecord(context, request.entity, { recordId: request.recordId, intent: "extend", expectedRevision: request.recordRevision });
  if (anchor.organisationId !== session.organisationId || anchor.recordId !== request.recordId || anchor.revision !== request.recordRevision) conflict();
  const extension = await tx.studioExtensionRecord.findFirst({ where: { organisationId: session.organisationId, entityId: request.entity.id, recordId: request.recordId } });
  const requestChecksum = checksum(request);
  const previous = await tx.studioRecordTypeAssignment.findFirst({ where: { id: request.operationId, organisationId: session.organisationId }, select: { id: true, organisationId: true,
    entityId: true, recordId: true, extensionId: true, extensionRevision: true, requestChecksum: true, createdBy: true, provenance: true, checksum: true } });
  if (previous) {
    if (previous.organisationId !== session.organisationId || previous.entityId !== request.entity.id || previous.recordId !== request.recordId
      || previous.createdBy !== session.userId || previous.requestChecksum !== requestChecksum || checksum(previous.provenance) !== previous.checksum
      || extension?.id !== previous.extensionId || extension.recordTypeAssignmentId !== previous.id || extension.revision !== previous.extensionRevision) conflict();
    const retained = recordTypeAssignmentProvenanceSchema.parse(previous.provenance);
    if (retained.operationId !== previous.id || retained.organisationId !== session.organisationId || retained.createdBy !== session.userId
      || retained.extensionId !== previous.extensionId || retained.extensionRevision !== previous.extensionRevision
      || retained.extensionRevision !== (retained.previousExtensionRevision ?? 0) + 1 || retained.requestChecksum !== requestChecksum
      || checksum({ operationId: retained.operationId, entity: retained.entity, recordId: retained.recordId,
        recordRevision: retained.nativeRevision, extensionRevision: retained.previousExtensionRevision, recordType: retained.recordType }) !== requestChecksum) conflict();
    // Exact fresh retry only; no native writes, windows, final validation or Audit.
    // Re-check selection metadata/field policies before returning retained IDs.
    await selection(authority, request, access);
    return { operationId: previous.id, extensionId: previous.extensionId, extensionRevision: previous.extensionRevision, replayed: true };
  }
  if ((extension?.revision ?? null) !== request.extensionRevision || (extension && extension.revision >= 2147483647)) conflict();
  const selected = await selection(authority, request, access);
  // Whole canonical Ticket impact: a type association changes the shared
  // extension envelope just like a legitimate field save. Never only one field.
  await closeAffectedFieldWriteWindows(authority, { entity: request.entity, operationId: request.operationId, trigger: "record_type_assignment" });
  const head = extension ?? await tx.studioExtensionRecord.create({ data: { organisationId: session.organisationId,
    entityId: request.entity.id, recordId: request.recordId } });
  const extensionRevision = head.revision + 1;
  const provenance = recordTypeAssignmentProvenanceSchema.parse({ schemaVersion: 1, operationId: request.operationId,
    organisationId: session.organisationId, entity: request.entity, recordId: request.recordId, nativeRevision: request.recordRevision,
    extensionId: head.id, extensionRevision, previousExtensionRevision: request.extensionRevision, previousAssignmentId: head.recordTypeAssignmentId,
    recordType: selected?.reference.kind === "recordType" ? selected.reference : null,
    baseProfile: selected?.baseProfile ?? null, resolvedProfileChecksum: selected ? checksum(selected.profile) : null,
    requestChecksum, createdBy: session.userId });
  await tx.studioRecordTypeAssignment.create({ data: { id: request.operationId, organisationId: session.organisationId,
    entityId: request.entity.id, recordId: request.recordId, extensionId: head.id, extensionRevision, nativeRevision: request.recordRevision,
    previousAssignmentId: head.recordTypeAssignmentId, createdBy: session.userId, requestChecksum, provenance, checksum: checksum(provenance),
    recordTypeDefinitionId: provenance.recordType?.definitionId ?? null, recordTypeVersionId: provenance.recordType?.versionId ?? null,
    baseProfileDefinitionId: provenance.baseProfile?.definitionId ?? null, baseProfileVersionId: provenance.baseProfile?.versionId ?? null } });
  if ((await tx.studioExtensionRecord.updateMany({ where: { id: head.id, organisationId: session.organisationId, entityId: request.entity.id,
    revision: head.revision, recordTypeAssignmentId: head.recordTypeAssignmentId }, data: { revision: extensionRevision,
    recordTypeAssignmentId: request.operationId } })).count !== 1) conflict();
  // Existing final validator reads actual staged values under the SAME access
  // mode; any error aborts assignment, pointer, window effects and all Audits.
  await validateResultingFieldRequirements(session, tx, { entity: request.entity, recordId: request.recordId,
    expectedRevision: request.recordRevision }, access.kind === "initial" ? access.proof : undefined);
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: RECORD_TYPE_ASSIGNMENT_ACTION,
    entityType: RECORD_TYPE_ASSIGNMENT_ENTITY, entityId: request.operationId,
    before: { extensionRevision: head.revision, assignmentId: head.recordTypeAssignmentId }, after: { ...provenance, checksum: checksum(provenance) } }, tx);
  return { operationId: request.operationId, extensionId: head.id, extensionRevision, replayed: false };
}

async function selection(authority: FieldRuntimeAuthority, request: ReturnType<typeof recordTypeAssignmentRequestSchema.parse>, access: RecordProfileAccess) {
  const { session, transaction: tx } = authority;
  const pin = request.recordType;
  if (!pin) {
    const bases = await tx.studioProfileBinding.findMany({ where: { organisationId: session.organisationId, entityId: request.entity.id, kind: "entityProfile" },
      select: { definitionId: true }, take: 2 });
    if (bases.length > 1) invalid();
    if (!bases.length) return null;
    const base = await tx.studioDefinition.findFirst({ where: { id: bases[0].definitionId, organisationId: session.organisationId,
      kind: "entityProfile" }, include: { activeVersion: true } });
    if (!base) invalid();
    if (base.retiredAt !== null || base.activeVersionId === null) return null;
    if (!base.activeVersion || base.activeVersionId !== base.activeVersion.id) invalid();
    const reference = configurationReferenceSchema.parse({ kind: "entityProfile", definitionId: base.id, versionId: base.activeVersion.id,
      schemaVersion: base.activeVersion.schemaVersion, checksum: base.activeVersion.checksum });
    const inspected = await inspectRecordProfileInTransaction(authority, reference);
    if (inspected.entity.id !== request.entity.id) invalid();
    await preflightRecordProfileFields(authority, inspected.profile, request.entity.id, access);
    return inspected;
  }
  const definition = await tx.studioDefinition.findFirst({ where: { id: pin.definitionId, organisationId: session.organisationId,
    kind: "recordType", retiredAt: null }, select: { activeVersionId: true } });
  if (!definition || definition.activeVersionId !== pin.versionId) conflict();
  const inspected = await inspectRecordProfileInTransaction(authority, pin);
  if (inspected.entity.id !== request.entity.id) invalid();
  await preflightRecordProfileFields(authority, inspected.profile, request.entity.id, access);
  return inspected;
}
