import { z } from "zod";
import { sessionAuthorityStamp } from "@/core/auth/session";
import type { StudioFieldMigrationPublication } from "@/generated/prisma/client";
import { ATLAS_CAPABILITIES } from "@/core/admin/access";
import { assertCapability } from "@/core/permissions/check";
import { writeAudit } from "@/core/audit/log";
import { checksum } from "../registry/contracts";
import { referenceSchema } from "../compiler/kernel";
import { entityDetailsSchema } from "../registry/entities";
import type { ContractReference } from "../registry/types";
import { fieldMigrationExecutionPinSchema } from "./migrations/execution-contract";
import { readStoredFieldMigrationIntent } from "./migrations/stored-protocol";
import { inspectFieldMigrationSettlementIdentity, inspectRequiredFieldMigrationSettlementIdentity, inspectFieldMigrationSettlementWindow } from "./migrations/settlement-inspection";
import { createFieldMigrationSettlementPin, fieldMigrationSettlementTransition } from "./migrations/settlement-contract";
import type { FieldMigrationPrincipal } from "./principal-contract";
import type { FieldRuntimeAuthority } from "./runtime-authority";
import type { FieldWriteRequest } from "./runtime-write-contract";

function unavailable(): never { throw new Error("FIELD_STORAGE_INVALID: the field migration window is unavailable."); }
function frozen(): never { throw new Error("FIELD_MIGRATION_IN_PROGRESS: this field is temporarily frozen while an approved change completes."); }
const supportedTicketVersions = new Set([2, 3, 4, 5, 6, 7, 8, 9]);
const causeSchema = z.strictObject({ entity: referenceSchema, operationId: z.uuid(),
  trigger: z.enum(["ordinary_field_save", "native_record_write", "native_record_creation", "record_type_assignment"]) });
export type FieldWindowMutationCause = z.infer<typeof causeSchema>;
const generationSchema = z.object({ id: z.uuid(), organisationId: z.string().min(1), definitionId: z.uuid(), entityId: z.string().min(1), valueType: z.string().min(1) });
const selectedWindowSchema = z.object({ ...fieldMigrationExecutionPinSchema.shape.publication.shape,
  state: z.enum(["PUBLISHED", "CUTOVER"]), revision: z.number().int().nonnegative().max(2147483646),
  sourceGeneration: generationSchema, targetGeneration: generationSchema });
const generationSelect = { id: true, organisationId: true, definitionId: true, entityId: true, valueType: true } as const;

/** Describe current canonical impact metadata only. Caller already owns actual
 * operation authority; native Read, another field and Studio are not resolved. */
function ticketImpactPolicy(authority: FieldRuntimeAuthority, reference: ContractReference) {
  const metadata = authority.registry.describe(reference.id, reference.version);
  if (reference.id !== "tickets.ticket" || !supportedTicketVersions.has(reference.version) || metadata.kind !== "entity"
    || metadata.ownerModuleId !== "tickets" || metadata.schemaHash !== reference.schemaHash || metadata.contractHash !== reference.contractHash
    || (metadata.lifecycle === "deprecated" && Date.parse(metadata.supportedUntil!) <= Date.now())) unavailable();
  const details = entityDetailsSchema.parse(metadata.details), policy = details.record?.fieldPolicy;
  if (!details.extensionPolicy.customFields || !policy) unavailable();
  return policy;
}

/** Internal only, AFTER ordinary owner/current/written/reference/CAS validation.
 * A valid target save ends the unchanged-data rollback window in the SAME atomic
 * value/Audit transaction. It grants no source read, activation or rollback right.
 * Unlike the administrator settlement operation, no whole-cohort data is read. */
export async function closeFieldWriteWindow(authority: FieldRuntimeAuthority, request: FieldWriteRequest) {
  const { session, transaction: tx } = authority;
  const publication = await tx.studioFieldMigrationPublication.findFirst({ where: { organisationId: session.organisationId, definitionId: request.definitionId,
    state: { in: ["PUBLISHED", "CUTOVER"] }, OR: [{ sourceGenerationId: request.generationId }, { targetGenerationId: request.generationId }] } });
  if (!publication) return;
  if (publication.organisationId !== session.organisationId || publication.definitionId !== request.definitionId) unavailable();
  if (publication.state === "PUBLISHED" || publication.targetGenerationId !== request.generationId) frozen();
  const inspected = await inspectWindow(authority, publication);
  if (inspected.target.id !== request.versionId || inspected.definition.revision !== request.definitionRevision || inspected.publication.targetGenerationId !== request.generationId)
    throw new Error("CONFLICT: the published field changed. Refresh before saving.");
  await finalizeWindow(authority, inspected, { operationId: request.operationId, trigger: "ordinary_field_save" });
}

async function inspectWindow(authority: FieldRuntimeAuthority, publication: StudioFieldMigrationPublication) {
  const { session, transaction: tx } = authority;
  const definitionId = publication.definitionId;
  if (publication.organisationId !== session.organisationId) unavailable();
  if (publication.state !== "CUTOVER") unavailable();
  const preparation = await tx.studioFieldMigrationPreparation.findFirst({ where: { id: publication.preparationId, organisationId: session.organisationId, definitionId } });
  if (!preparation || preparation.id !== publication.preparationId || preparation.definitionId !== definitionId) unavailable();
  const { intent } = readStoredFieldMigrationIntent(preparation, session.organisationId);
  if (intent.definitionId !== definitionId || intent.source.payload.storageGeneration !== publication.sourceGenerationId
    || intent.target.payload.storageGeneration !== publication.targetGenerationId) unavailable();
  const inspected = intent.schemaVersion === 2 ? await inspectRequiredFieldMigrationSettlementIdentity(tx, intent)
    : await inspectFieldMigrationSettlementIdentity(tx, intent);
  if (checksum(inspected.intent) !== checksum(intent) || checksum(inspected.publication) !== checksum(publication)
    || inspected.definition.id !== definitionId || inspected.definition.organisationId !== session.organisationId
    || inspected.receipt.preparationId !== publication.preparationId || inspected.receipt.organisationId !== session.organisationId
    || inspected.receipt.definitionId !== definitionId || inspected.source.id !== intent.source.versionId
    || inspected.source.organisationId !== session.organisationId || inspected.source.definitionId !== definitionId
    || inspected.target.organisationId !== session.organisationId || inspected.target.definitionId !== definitionId
    || inspected.source.checksum !== intent.source.versionChecksum || inspected.target.checksum !== intent.target.compiledChecksum
    || inspected.source.id !== inspected.receipt.sourceVersionId || inspected.target.id !== inspected.receipt.targetVersionId
    || inspected.target.id !== publication.targetVersionId) unavailable();
  await inspectFieldMigrationSettlementWindow(tx, inspected, "FINALIZED");
  return inspected;
}
type InspectedWindow = Awaited<ReturnType<typeof inspectWindow>>;

/** Only a previously inspected, locked window. All effects use the caller's
 * transaction and current identity; this never grants data or activation rights. */
async function finalizeWindow(authority: FieldRuntimeAuthority, inspected: InspectedWindow, cause: Pick<FieldWindowMutationCause, "operationId" | "trigger">) {
  const { session, stamp, transaction: tx } = authority, { publication } = inspected;
  let principal: FieldMigrationPrincipal;
  if (session.capabilities.has(ATLAS_CAPABILITIES.staff)) {
    assertCapability(session, ATLAS_CAPABILITIES.companies);
    // Existing purpose-bound support evidence, actual affiliated staff identity,
    // committed with the value. Never label staff as a customer or borrow a grant.
    const audit = await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId,
      action: "studio.field.migration.support_opened", entityType: "Membership", entityId: session.membershipId,
      before: { operationId: cause.operationId, purpose: cause.trigger }, after: { ...stamp, fromOrganisationId: session.organisationId } }, select: { id: true } });
    principal = { ...stamp, authority: "staff_support", auditId: audit.id };
  } else principal = { ...stamp, authority: "customer" };
  const packet = createFieldMigrationSettlementPin(inspected.retained, principal, "FINALIZED"), transition = fieldMigrationSettlementTransition(packet.pin);
  const scope = { preparationId: publication.preparationId, organisationId: session.organisationId, definitionId: publication.definitionId };
  if ((await tx.studioFieldMigrationCutover.updateMany({ where: { ...scope, state: "ACTIVATED", revision: 0 }, data: { ...transition.cutover,
    settlementPin: packet.pin, settlementChecksum: packet.checksum, settledBy: session.userId, settledAt: new Date() } })).count !== 1
    || (await tx.studioFieldMigrationPublication.updateMany({ where: { ...scope, state: "CUTOVER", revision: packet.pin.publicationRevision }, data: transition.publication })).count !== 1)
    throw new Error("CONFLICT: the field migration window changed. Refresh before saving.");
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "studio.field.migration.finalized",
    entityType: "StudioFieldMigrationCutover", entityId: publication.preparationId,
    after: { cutoverChecksum: packet.pin.cutoverChecksum, settlementChecksum: packet.checksum, disposition: "FINALIZED",
      sourceVersionId: packet.pin.sourceVersionId, targetVersionId: packet.pin.targetVersionId, definitionRevision: transition.definition.revision,
      publicationRevision: transition.publication.revision, operationId: cause.operationId, trigger: cause.trigger } }, tx);
}

/** Internal actual owning-mutation boundary, AFTER its native/private/field/CAS
 * checks and earlier entity coordination. Complete Tickets snapshots observe the
 * whole tenant cohort/global extension revision: unrelated field changes and new
 * Tickets affect every open window. The server cause grants no permission. */
export async function closeAffectedFieldWriteWindows(authority: FieldRuntimeAuthority, cause: FieldWindowMutationCause) {
  const { session, stamp, transaction: tx } = authority, genuine = sessionAuthorityStamp(session);
  if (!genuine || checksum(genuine) !== checksum(stamp) || session.userId !== stamp.userId
    || session.organisationId !== stamp.organisationId || session.membershipId !== stamp.membershipId)
    throw new Error("FORBIDDEN: current authenticated company access is required.");
  const mutation = causeSchema.parse(cause), policy = ticketImpactPolicy(authority, mutation.entity);
  const isolation = await tx.$queryRaw<Array<{ transaction_isolation: string }>>`SHOW transaction_isolation`;
  if (isolation.length !== 1 || isolation[0].transaction_isolation !== "serializable")
    throw new Error("Field runtime requires the owning serializable transaction.");
  const selected = await tx.studioFieldMigrationPublication.findMany({ where: { organisationId: session.organisationId,
    state: { in: ["PUBLISHED", "CUTOVER"] }, OR: [{ sourceGeneration: { entityId: mutation.entity.id } }, { targetGeneration: { entityId: mutation.entity.id } }] },
    orderBy: [{ definitionId: "asc" }, { preparationId: "asc" }], take: policy.maxFields + 1,
    include: { sourceGeneration: { select: generationSelect }, targetGeneration: { select: generationSelect } } });
  if (selected.length > policy.maxFields) unavailable();
  const definitions = new Set<string>(), preparations = new Set<string>();
  for (const row of selected) {
    if (!selectedWindowSchema.safeParse(row).success || row.organisationId !== session.organisationId
      || definitions.has(row.definitionId) || preparations.has(row.preparationId) || row.sourceGenerationId === row.targetGenerationId) unavailable();
    definitions.add(row.definitionId); preparations.add(row.preparationId);
    for (const [generation, id] of [[row.sourceGeneration, row.sourceGenerationId], [row.targetGeneration, row.targetGenerationId]] as const)
      if (generation.id !== id || generation.organisationId !== session.organisationId || generation.definitionId !== row.definitionId || generation.entityId !== mutation.entity.id) unavailable();
  }
  // Freeze preflight covers the complete bounded set, regardless of row order.
  // No CUTOVER receipt, support evidence or Audit is written before this passes.
  if (selected.some(row => row.state === "PUBLISHED")) frozen();
  selected.sort((a, b) => a.definitionId < b.definitionId ? -1 : a.definitionId > b.definitionId ? 1 : a.preparationId < b.preparationId ? -1 : a.preparationId > b.preparationId ? 1 : 0);
  const windows: InspectedWindow[] = [];
  for (const { sourceGeneration, targetGeneration, ...publication } of selected) {
    const inspected = await inspectWindow(authority, publication);
    const ref = inspected.intent.ownerQuery, snapshot = authority.registry.describe(ref.id, ref.version);
    // These four registered Ticket snapshot protocols have the complete-cohort
    // impact semantics above. A future partial cohort needs an explicit contract.
    if (ref.id !== "tickets.ticket.field_migration" || ![1, 2, 3, 4].includes(ref.version)
      || (inspected.intent.schemaVersion === 2 && ref.version !== 4) || snapshot.kind !== "query" || snapshot.ownerModuleId !== "tickets"
      || snapshot.schemaHash !== ref.schemaHash || snapshot.contractHash !== ref.contractHash || snapshot.details.transaction !== "required") unavailable();
    for (const [generation, payload] of [[sourceGeneration, inspected.intent.source.payload], [targetGeneration, inspected.intent.target.payload]] as const) {
      ticketImpactPolicy(authority, payload.entity);
      if (generation.id !== payload.storageGeneration || generation.entityId !== payload.entity.id || generation.valueType !== payload.field.storage.type) unavailable();
    }
    windows.push(inspected);
  }
  for (const inspected of windows) await finalizeWindow(authority, inspected, mutation);
}
