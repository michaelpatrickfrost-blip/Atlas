import { createHash } from "node:crypto";
import { sessionAuthorityStamp } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { checksum } from "@/core/studio/registry/contracts";
import { fieldRuntimeAuthorityInTransaction, type FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { lockFieldEntitiesInTransaction } from "@/core/studio/fields/entity-lock";
import { inspectRecordProfileInTransaction, preflightRecordProfileCreationMetadata } from "@/core/studio/record-types/runtime-profile";
import { assignInitialRecordTypeInTransaction } from "@/core/studio/record-types/assignment";
import { recordTypeAssignmentProvenanceSchema } from "@/core/studio/record-types/assignment-contract";
import { configurationReferenceSchema, type ConfigurationReference } from "@/core/studio/record-types/schema";
import { isStudioRuntimeFeatureEnabled, assertStudioRuntimeFeatureEnabled, STUDIO_RECORD_TYPE_FORM_FEATURE } from "@/core/studio/runtime-features";
import type { FieldFormPacket } from "@/core/studio/fields/form-packet";
import { ticketCreationTypeSelectionSchema, ticketCreationTypeReceiptSchema, ticketCreationTypeSelectionChecksum,
  type TicketCreationTypeManifest, type TicketCreationTypeSelection, type TicketCreationTypeReceipt } from "./record-type-creation-contract";

function invalid(): never { throw new Error("RECORD_PROFILE_INVALID: the selected business type is unavailable or incompatible."); }
function conflict(): never { throw new Error("CONFLICT: the business setup or saved type changed. Your entered information is retained; refresh before trying again."); }
function entity(authority: FieldRuntimeAuthority) {
  const { id, version, schemaHash, contractHash } = authority.registry.describe("tickets.ticket", 9);
  return { id, version, schemaHash, contractHash };
}
async function genuine(supplied: FieldRuntimeAuthority) {
  if (!sessionAuthorityStamp(supplied.session) || sessionAuthorityStamp(supplied.session) !== supplied.stamp)
    throw new Error("FORBIDDEN: genuine current company authority is required.");
  const current = await fieldRuntimeAuthorityInTransaction(supplied.session, supplied.transaction);
  assertCapability(current.session, "tickets.ticket.create");
  await current.registry.resolveCurrentFieldInitialisation(current.session, entity(current));
  await lockFieldEntitiesInTransaction(current.transaction, current.session.organisationId, ["tickets.ticket"]);
  return current;
}
async function activePin(authority: FieldRuntimeAuthority, definitionId: string, kind: "recordType" | "entityProfile") {
  const definition = await authority.transaction.studioDefinition.findFirst({ where: { id: definitionId,
    organisationId: authority.session.organisationId, kind }, include: { activeVersion: true } });
  if (!definition) invalid();
  if (definition.retiredAt !== null || definition.activeVersionId === null) return null;
  const version = definition.activeVersion;
  if (!version || version.id !== definition.activeVersionId || version.definitionId !== definitionId
    || version.organisationId !== authority.session.organisationId || definition.id !== definitionId || definition.kind !== kind
    || definition.organisationId !== authority.session.organisationId) invalid();
  return configurationReferenceSchema.parse({ kind, definitionId, versionId: version.id, schemaVersion: version.schemaVersion, checksum: version.checksum });
}
async function profile(authority: FieldRuntimeAuthority, pin: ConfigurationReference) {
  const inspected = await inspectRecordProfileInTransaction(authority, pin);
  if (checksum(inspected.entity) !== checksum(entity(authority))) invalid();
  await preflightRecordProfileCreationMetadata(authority, inspected.profile, "tickets.ticket");
  return inspected;
}
async function catalogue(authority: FieldRuntimeAuthority) {
  const { transaction: tx, session } = authority;
  const bases = await tx.studioProfileBinding.findMany({ where: { organisationId: session.organisationId, entityId: "tickets.ticket", kind: "entityProfile" },
    select: { definitionId: true }, take: 2 });
  if (bases.length > 1) invalid();
  const base = bases.length ? await activePin(authority, bases[0].definitionId, "entityProfile") : null;
  if (base) await profile(authority, base);
  const bindings = await tx.studioProfileBinding.findMany({ where: { organisationId: session.organisationId, entityId: "tickets.ticket", kind: "recordType" },
    select: { definitionId: true, organisationId: true, entityId: true, kind: true }, orderBy: { definitionId: "asc" }, take: 101 });
  if (bindings.length > 100 || new Set(bindings.map(row => row.definitionId)).size !== bindings.length) invalid();
  const active: ConfigurationReference[] = [], choices: TicketCreationTypeManifest["choices"] = [];
  for (const binding of bindings) {
    if (binding.organisationId !== session.organisationId || binding.entityId !== "tickets.ticket" || binding.kind !== "recordType") invalid();
    const pin = await activePin(authority, binding.definitionId, "recordType");
    if (!pin) continue;
    active.push(pin);
    // A broken immutable dependency is never hidden as a permissions decision.
    const inspected = await inspectRecordProfileInTransaction(authority, pin);
    if (checksum(inspected.entity) !== checksum(entity(authority)) || !("label" in inspected.payload)) invalid();
    try { await preflightRecordProfileCreationMetadata(authority, inspected.profile, "tickets.ticket"); }
    catch (error) { if (error instanceof Error && error.message.startsWith("FORBIDDEN:")) continue; throw error; }
    const requiredFields: TicketCreationTypeManifest["choices"][number]["requiredFields"] = [];
    for (const field of inspected.profile.requiredFields) {
      const definition = await tx.studioDefinition.findFirst({ where: { id: field.definitionId, organisationId: session.organisationId,
        kind: "customField", retiredAt: null }, include: { activeVersion: true } });
      if (!definition?.activeVersion || definition.activeVersionId !== definition.activeVersion.id) invalid();
      // All sealed/current grants were preflighted above before this label leaves.
      const { inspectSealedFieldVersion } = await import("@/core/studio/fields/sealed-field");
      const payload = inspectSealedFieldVersion(authority.registry, definition.activeVersion, session.organisationId, field.definitionId).payload;
      requiredFields.push({ definitionId: field.definitionId, label: payload.field.label });
    }
    choices.push({ definitionId: pin.definitionId, label: inspected.payload.label, help: inspected.payload.help, requiredFields });
  }
  const manifestChecksum = checksum({ schemaVersion: 1, organisationId: session.organisationId, actorUserId: session.userId,
    entity: entity(authority), base, active, choices });
  return { base, active, manifest: { schemaVersion: 1 as const, manifestChecksum, choices } };
}
export async function ticketCreationTypeManifestInTransaction(supplied: FieldRuntimeAuthority): Promise<TicketCreationTypeManifest | null> {
  if (!isStudioRuntimeFeatureEnabled(STUDIO_RECORD_TYPE_FORM_FEATURE)) return null;
  const value = await catalogue(await genuine(supplied));
  return value.manifest.choices.length ? value.manifest : null;
}

/** Stable server effect identity, separate from the raw field packet checksum. */
export function ticketCreationTypeOperationId(wholeOperationId: string, pin: ConfigurationReference | null) {
  const hex = createHash("sha256").update(checksum({ purpose: "tickets.create.business_type.v1", wholeOperationId, pin })).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}
/** Only inside the real INSERT callback, after all supplied/default fields. */
export async function stageTicketCreationType(supplied: FieldRuntimeAuthority, input: TicketCreationTypeSelection,
  packet: FieldFormPacket, recordId: string, recordRevision: number, proof: object) {
  assertStudioRuntimeFeatureEnabled(STUDIO_RECORD_TYPE_FORM_FEATURE);
  const selection = ticketCreationTypeSelectionSchema.parse(input), authority = await genuine(supplied), current = await catalogue(authority);
  if (selection.manifestChecksum !== current.manifest.manifestChecksum) conflict();
  if (selection.definitionId && !current.manifest.choices.some(choice => choice.definitionId === selection.definitionId))
    throw new Error("FORBIDDEN: this business type is not available to you.");
  const pin = selection.definitionId ? current.active.find(pin => pin.definitionId === selection.definitionId) ?? null : current.base;
  if (selection.definitionId && !pin) conflict();
  const operationId = ticketCreationTypeOperationId(packet.operationId.toLowerCase(), pin);
  if (operationId === packet.operationId.toLowerCase() || packet.fields.some(field => field.operationId.toLowerCase() === operationId)) conflict();
  const extension = await authority.transaction.studioExtensionRecord.findFirst({ where: { organisationId: authority.session.organisationId,
    entityId: "tickets.ticket", recordId }, select: { revision: true } });
  const result = await assignInitialRecordTypeInTransaction(authority.session, authority.transaction, { operationId,
    entity: entity(authority), recordId, recordRevision, extensionRevision: extension?.revision ?? null,
    recordType: pin?.kind === "recordType" ? pin : null }, proof);
  if (result.replayed) conflict();
  return result.operationId;
}

/** INTERNAL whole receipt collaborator. The actual native creator is checked
 * again; metadata-only historical validation never remints an INSERT proof. */
export async function inspectTicketCreationTypeReceipt(supplied: FieldRuntimeAuthority,
  wholeOperationId: string, input: TicketCreationTypeSelection, recordId: string,
  expectedFieldCount: number, completed: boolean, retained?: TicketCreationTypeReceipt) {
  const authority = await genuine(supplied), { session, transaction: tx } = authority;
  const selection = ticketCreationTypeSelectionSchema.parse(input);
  const native = await tx.serviceWorkItem.findFirst({ where: { id: recordId, organisationId: session.organisationId,
    kind: "TICKET", requesterUserId: session.userId }, select: { id: true, organisationId: true, kind: true, requesterUserId: true, version: true } });
  if (!native || native.id !== recordId || native.organisationId !== session.organisationId || native.kind !== "TICKET"
    || native.requesterUserId !== session.userId || (completed ? native.version !== 1 : native.version < 1)) conflict();
  const extension = await tx.studioExtensionRecord.findFirst({ where: { organisationId: session.organisationId, entityId: "tickets.ticket", recordId } });
  const row = await tx.studioRecordTypeAssignment.findFirst({ where: { organisationId: session.organisationId,
    id: retained?.operationId ?? extension?.recordTypeAssignmentId ?? "", recordId, entityId: "tickets.ticket", createdBy: session.userId } });
  if (!row || !extension || row.organisationId !== session.organisationId || row.createdBy !== session.userId || row.recordId !== recordId
    || row.entityId !== "tickets.ticket" || row.extensionId !== extension.id || checksum(row.provenance) !== row.checksum) conflict();
  const origin = recordTypeAssignmentProvenanceSchema.parse(row.provenance);
  if (origin.operationId !== row.id || origin.organisationId !== session.organisationId || origin.createdBy !== session.userId
    || origin.recordId !== recordId || checksum(origin.entity) !== checksum(entity(authority)) || origin.nativeRevision !== 1 || row.nativeRevision !== 1
    || origin.extensionId !== row.extensionId || origin.extensionRevision !== row.extensionRevision
    || origin.previousAssignmentId !== null || row.previousAssignmentId !== null
    || origin.previousExtensionRevision !== (expectedFieldCount || null) || origin.extensionRevision !== expectedFieldCount + 1
    || origin.requestChecksum !== row.requestChecksum || origin.requestChecksum !== checksum({ operationId: row.id, entity: origin.entity,
      recordId, recordRevision: 1, extensionRevision: origin.previousExtensionRevision, recordType: origin.recordType })
    || (origin.recordType?.definitionId ?? null) !== selection.definitionId
    || (origin.recordType?.definitionId ?? null) !== row.recordTypeDefinitionId || (origin.recordType?.versionId ?? null) !== row.recordTypeVersionId
    || (origin.baseProfile?.definitionId ?? null) !== row.baseProfileDefinitionId || (origin.baseProfile?.versionId ?? null) !== row.baseProfileVersionId
    || row.id !== ticketCreationTypeOperationId(wholeOperationId.toLowerCase(), origin.recordType ?? origin.baseProfile)
    || extension.organisationId !== session.organisationId || extension.entityId !== "tickets.ticket" || extension.recordId !== recordId
    || (completed ? extension.revision !== row.extensionRevision || extension.recordTypeAssignmentId !== row.id : extension.revision < row.extensionRevision)) conflict();
  let historical = null;
  for (const pin of [origin.baseProfile, origin.recordType]) if (pin) historical = await profile(authority, pin);
  if ((historical ? checksum(historical.profile) : null) !== origin.resolvedProfileChecksum) conflict();
  // Current stable type/base policy is independently rechecked, but no current
  // rule/default is evaluated and no state or assignment is rewritten on replay.
  let currentPin: ConfigurationReference | null;
  if (selection.definitionId) currentPin = await activePin(authority, selection.definitionId, "recordType");
  else {
    // An originally unconfigured creation can acquire a canonical base later.
    // Current policy is discovered independently of the immutable original pin.
    const bindings = await tx.studioProfileBinding.findMany({ where: { organisationId: session.organisationId,
      entityId: "tickets.ticket", kind: "entityProfile" }, select: { definitionId: true, organisationId: true, entityId: true, kind: true }, take: 2 });
    if (bindings.length > 1 || bindings.some(binding => binding.organisationId !== session.organisationId
      || binding.entityId !== "tickets.ticket" || binding.kind !== "entityProfile")) invalid();
    currentPin = bindings.length ? await activePin(authority, bindings[0].definitionId, "entityProfile") : null;
  }
  if (selection.definitionId && !currentPin) conflict();
  if (currentPin) await profile(authority, currentPin);
  const anchor = ticketCreationTypeReceiptSchema.parse({ operationId: row.id, extensionId: row.extensionId,
    extensionRevision: row.extensionRevision, requestChecksum: row.requestChecksum, checksum: row.checksum,
    selectionChecksum: ticketCreationTypeSelectionChecksum(selection) });
  if (retained && checksum(anchor) !== checksum(retained)) conflict();
  return anchor;
}
