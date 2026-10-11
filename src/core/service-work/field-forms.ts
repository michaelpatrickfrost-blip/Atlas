import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Session } from "@/core/auth/session";
import type { StudioDefinitionVersion } from "@/generated/prisma/client";
import { db } from "@/core/db/client";
import { assertCapability } from "@/core/permissions/check";
import { checksum } from "@/core/studio/registry/contracts";
import { entityDetailsSchema } from "@/core/studio/registry/entities";
import { compileCustomField, compileCustomFieldForInitialisation } from "@/core/studio/compiler/fields";
import { inspectSealedFieldVersion } from "@/core/studio/fields/sealed-field";
import { fieldDefinitionKey } from "@/core/studio/fields/binding";
import { readInitialFieldPlanInTransaction, readVersionedFieldPlanInTransaction, readVersionedFieldValueInTransaction } from "@/core/studio/fields/runtime-read";
import { fieldRuntimeAuthorityInTransaction, nativeFieldMutationSessionInTransaction, type FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { lockFieldEntitiesInTransaction } from "@/core/studio/fields/entity-lock";
import { initialiseFieldValueInTransaction, writeFieldValueInTransaction } from "@/core/studio/fields/runtime-write";
import { parseFieldFormPacketJson, type FieldFormPacket } from "@/core/studio/fields/form-packet";
import { ticketDefaultFieldEntries } from "./field-defaults";
import type { TicketFieldFormControl, TicketFieldFormManifest } from "./field-form-contract";
import { workScope } from "./access";
import { WORK_STATUSES } from "./config";

const nativeId = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
export const ticketFieldFormRequestSchema = z.discriminatedUnion("operation", [
  z.strictObject({ operation: z.literal("create") }),
  z.strictObject({ operation: z.literal("update"), recordId: nativeId }),
]);
export type TicketFieldFormRequest = z.infer<typeof ticketFieldFormRequestSchema>;
const slotMetadata = { id: true, organisationId: true, definitionId: true, generationId: true, extensionId: true, entityId: true,
  revision: true, activeValueId: true, activeValue: { select: { id: true, organisationId: true, definitionId: true, generationId: true,
    slotId: true, versionId: true, revision: true, schemaVersion: true } } } as const;
function conflict(): never { throw new Error("CONFLICT: the business form or record changed. Your entered values are retained; refresh before trying again."); }
function corrupt(): never { throw new Error("FIELD_STORAGE_INVALID: the configured business form is unavailable."); }
const basePolicy = (payload: ReturnType<typeof inspectSealedFieldVersion>["payload"]) =>
  ({ schemaVersion: 1 as const, entity: payload.entity, storageGeneration: payload.storageGeneration, field: payload.field });
function visible(session: Session, version: StudioDefinitionVersion, authority: FieldRuntimeAuthority) {
  const payload = inspectSealedFieldVersion(authority.registry, version, session.organisationId, version.definitionId).payload;
  return (!payload.field.readCapability || session.capabilities.has(payload.field.readCapability))
    && (!payload.field.writeCapability || session.capabilities.has(payload.field.writeCapability));
}

/** Server-owned current owner limit, never a client's requested entity/limit. */
export function ticketFieldFormLimit(authority: FieldRuntimeAuthority) {
  const entity = authority.registry.describe("tickets.ticket", 9), details = entityDetailsSchema.parse(entity.details);
  if (entity.kind !== "entity" || !details.extensionPolicy.customFields || !details.record?.fieldPolicy) corrupt();
  return details.record.fieldPolicy.maxFields;
}
export function parseTicketFieldFormPacket(authority: FieldRuntimeAuthority, input: unknown) {
  return parseFieldFormPacketJson(input, ticketFieldFormLimit(authority));
}

/** Current metadata and allowed values only. Create requires no native Read or
 * Manage and never invents an INSERT proof. Edit discovery allows a closed row
 * to supply values for an owning authorised reopen; actual Extend is enforced
 * by the shared writer after that transition, never waived by this manifest.
 * No condition graph, private facts, tenant or permission names reach the UI. */
export async function ticketFieldFormManifestInTransaction(authority: FieldRuntimeAuthority, input: TicketFieldFormRequest): Promise<TicketFieldFormManifest | null> {
  const request = ticketFieldFormRequestSchema.parse(input), { session, transaction: tx, registry } = authority;
  assertCapability(session, request.operation === "create" ? "tickets.ticket.create" : "tickets.ticket.manage");
  if (!await tx.moduleState.findFirst({ where: { organisationId: session.organisationId, moduleId: "tickets", enabled: true, entitled: true }, select: { id: true } }))
    throw new Error("DEPENDENCY_BROKEN: Tickets is unavailable.");
  await lockFieldEntitiesInTransaction(tx, session.organisationId, ["tickets.ticket"]);
  const maximum = ticketFieldFormLimit(authority), owner = registry.describe("tickets.ticket", 9);
  let recordRevision: number | null = null;
  if (request.operation === "update") {
    const anchor = await registry.authoriseRecord({ session, transaction: tx }, owner, { recordId: request.recordId, intent: "read" });
    const work = await tx.serviceWorkItem.findFirst({ where: { AND: [workScope(session), { id: request.recordId, kind: "TICKET", mergedIntoId: null }] },
      select: { id: true, version: true, queueId: true, queue: { select: { restricted: true } } } });
    if (!work || work.version !== anchor.revision) throw new Error("Ticket unavailable.");
    if (work.queue.restricted && !await tx.serviceQueueMember.findFirst({ where: { organisationId: session.organisationId,
      queueId: work.queueId, userId: session.userId }, select: { id: true } })) throw new Error("FORBIDDEN: current receiving-team access is required.");
    recordRevision = anchor.revision;
  } else await registry.resolveCurrentFieldInitialisation(session, owner);
  const bindings = await tx.studioFieldBinding.findMany({ where: { organisationId: session.organisationId, entityId: "tickets.ticket" },
    include: { definition: { include: { activeVersion: true } } }, orderBy: { definitionId: "asc" }, take: maximum + 1 });
  if (bindings.length > maximum) corrupt();
  const active = bindings.filter(binding => binding.definition.retiredAt === null && binding.definition.activeVersion !== null);
  const checked: { definition: typeof active[number]["definition"]; payload: ReturnType<typeof inspectSealedFieldVersion>["payload"] }[] = [];
  for (const binding of active) {
    const definition = binding.definition, version = definition.activeVersion!;
    if (binding.organisationId !== session.organisationId || definition.organisationId !== session.organisationId || definition.kind !== "customField"
      || definition.id !== binding.definitionId || version.id !== definition.activeVersionId || version.definitionId !== definition.id) corrupt();
    // A hidden field never exposes its label/value merely because another field
    // is editable. The final owner validator still enforces ALL active fields.
    if (!visible(session, version, authority)) continue;
    const payload = request.operation === "create" ? await readInitialFieldPlanInTransaction(authority, version, definition.id)
      : await readVersionedFieldPlanInTransaction(authority, version, definition.id);
    if (payload.entity.id !== "tickets.ticket" || payload.field.key !== binding.fieldKey || definition.key !== fieldDefinitionKey(payload)) corrupt();
    if (request.operation === "create") await compileCustomFieldForInitialisation(session, basePolicy(payload), registry, "write");
    else await compileCustomField(session, basePolicy(payload), registry);
    checked.push({ definition, payload });
  }
  const extension = request.operation === "update" ? await tx.studioExtensionRecord.findFirst({ where: { organisationId: session.organisationId,
    entityId: "tickets.ticket", recordId: request.recordId } }) : null;
  const slots = extension && checked.length ? await tx.studioFieldSlot.findMany({ where: { organisationId: session.organisationId,
    extensionId: extension.id, OR: checked.map(item => ({ definitionId: item.definition.id, generationId: item.payload.storageGeneration })) }, select: slotMetadata, take: maximum }) : [];
  const permitted: typeof checked = [];
  // Written access is checked using metadata before fetching ANY typed columns.
  for (const item of checked) {
    const slot = slots.find(slot => slot.definitionId === item.definition.id && slot.generationId === item.payload.storageGeneration);
    if (slot && (slot.entityId !== "tickets.ticket" || slot.extensionId !== extension!.id || slot.organisationId !== session.organisationId
      || !slot.activeValue || slot.activeValueId !== slot.activeValue.id || slot.activeValue.slotId !== slot.id
      || slot.activeValue.organisationId !== session.organisationId || slot.activeValue.definitionId !== item.definition.id
      || slot.activeValue.generationId !== slot.generationId || slot.activeValue.versionId !== slot.activeValue.schemaVersion.id
      || slot.revision !== slot.activeValue.revision)) corrupt();
    if (slot?.activeValue) {
      if (!visible(session, slot.activeValue.schemaVersion, authority)) continue;
      const written = await readVersionedFieldPlanInTransaction(authority, slot.activeValue.schemaVersion, item.definition.id);
      await compileCustomField(session, basePolicy(written), registry);
      if (written.entity.id !== item.payload.entity.id || written.field.key !== item.payload.field.key || written.storageGeneration !== slot.generationId) corrupt();
      await registry.authoriseRecord({ session, transaction: tx }, written.entity, { recordId: request.operation === "update" ? request.recordId : "", intent: "read" });
    }
    permitted.push(item);
  }
  const activeIds = permitted.flatMap(item => {
    const slot = slots.find(slot => slot.definitionId === item.definition.id && slot.generationId === item.payload.storageGeneration);
    return slot?.activeValueId ? [slot.activeValueId] : [];
  });
  const values = activeIds.length ? await tx.studioFieldValue.findMany({ where: { organisationId: session.organisationId, id: { in: activeIds } },
    include: { schemaVersion: true }, take: maximum }) : [];
  if (values.length !== activeIds.length) corrupt();
  const fields: TicketFieldFormControl[] = [];
  for (const { definition, payload } of permitted) {
    const slot = slots.find(slot => slot.definitionId === definition.id && slot.generationId === payload.storageGeneration);
    const value = slot?.activeValueId ? values.find(row => row.id === slot.activeValueId) : null;
    if (slot?.activeValueId && !value) corrupt();
    if (request.operation === "create" && payload.field.defaultValue?.type === "reference" && payload.field.storage.type === "reference")
      await registry.authoriseRecord({ session, transaction: tx }, payload.field.storage.entity, { recordId: payload.field.defaultValue.value, intent: "read" });
    fields.push({ operationId: randomUUID(), definitionId: definition.id, definitionRevision: definition.revision, versionId: definition.activeVersionId!,
      generationId: payload.storageGeneration, slotRevision: slot?.revision ?? null, valueRevision: value?.revision ?? null,
      label: payload.field.label, help: payload.field.help, storage: payload.field.storage, required: payload.field.required,
      conditionalRequired: payload.schemaVersion === 2,
      ...(request.operation === "create" && payload.field.defaultValue !== undefined ? { defaultValue: payload.field.defaultValue } : {}),
      value: value && request.operation === "update" ? await readVersionedFieldValueInTransaction(authority, payload, definition.id,
        payload.storageGeneration, slot!.id, request.recordId, value) : null });
  }
  if (!fields.length) return null;
  const manifestChecksum = checksum({ schemaVersion: 1, organisationId: session.organisationId, actorUserId: session.userId,
    recordId: request.operation === "update" ? request.recordId : null, operation: request.operation, recordRevision, extensionRevision: extension?.revision ?? null,
    owner: { id: owner.id, version: owner.version, schemaHash: owner.schemaHash, contractHash: owner.contractHash },
    // Opaque seal binds hidden active configuration too, without returning it.
    active: active.map(binding => ({ id: binding.definition.id, revision: binding.definition.revision,
      versionId: binding.definition.activeVersionId, checksum: binding.definition.activeVersion!.checksum })),
    fields: fields.map(field => ({ definitionId: field.definitionId, definitionRevision: field.definitionRevision,
      versionId: field.versionId, generationId: field.generationId, slotRevision: field.slotRevision, valueRevision: field.valueRevision,
      label: field.label, help: field.help, storage: field.storage, required: field.required, conditionalRequired: field.conditionalRequired,
      ...(field.defaultValue !== undefined ? { defaultValue: field.defaultValue } : {}) })) });
  return { schemaVersion: 1, operation: request.operation, operationId: randomUUID(), recordRevision,
    extensionRevision: extension?.revision ?? null, manifestChecksum, fields };
}

/** Genuine server bootstrap; internal Atlas/no-config work keeps its native form.
 * Current authentication is refreshed before inspecting workspace ownership. */
export async function ticketFieldFormManifest(authenticated: Session, input: TicketFieldFormRequest) {
  return db.$transaction(async tx => {
    const current = await nativeFieldMutationSessionInTransaction(authenticated, tx);
    const company = await tx.organisation.findFirst({ where: { id: current.session.organisationId }, select: { kind: true } });
    if (company?.kind === "INTERNAL") return null;
    return ticketFieldFormManifestInTransaction(await fieldRuntimeAuthorityInTransaction(current.session, tx), input);
  }, { isolationLevel: "Serializable" });
}

/** Owning form only. All fields stage in stable definition order, using the
 * existing writer, shared extension CAS and actual INSERT/reopen revision. The
 * caller must run its single complete native resulting validator before commit. */
export async function stageTicketFieldFormPacket(authority: FieldRuntimeAuthority, manifest: TicketFieldFormManifest | null,
  packet: FieldFormPacket, recordId: string, fieldRecordRevision: number, proof?: object) {
  if (!manifest || packet.manifestChecksum !== manifest.manifestChecksum || packet.extensionRevision !== manifest.extensionRevision) conflict();
  const defaults = proof ? ticketDefaultFieldEntries(manifest, packet) : [];
  let extensionRevision = packet.extensionRevision;
  for (const entry of [...packet.fields, ...defaults].sort((a, b) => a.definitionId.toLowerCase().localeCompare(b.definitionId.toLowerCase()))) {
    const current = manifest.fields.find(field => field.definitionId === entry.definitionId.toLowerCase());
    if (!current || current.definitionRevision !== entry.definitionRevision || current.versionId !== entry.versionId.toLowerCase()
      || current.generationId !== entry.generationId.toLowerCase() || current.slotRevision !== entry.slotRevision || current.valueRevision !== entry.valueRevision
      || (entry.value !== null && entry.value.type !== current.storage.type)) conflict();
    const input = { operationId: entry.operationId.toLowerCase(), definitionId: current.definitionId, definitionRevision: entry.definitionRevision,
      versionId: current.versionId, generationId: current.generationId, recordId, recordRevision: fieldRecordRevision,
      extensionRevision, slotRevision: entry.slotRevision, valueRevision: entry.valueRevision, value: entry.value?.value ?? null };
    const saved = proof ? await initialiseFieldValueInTransaction(authority, input, proof) : await writeFieldValueInTransaction(authority, input);
    if (saved.replayed) conflict(); // Whole-form replay happens before native effects.
    extensionRevision = saved.extensionRevision;
  }
  return defaults;
}

/** Hash precisely the bounded native inputs the owning form consumes. Database
 * derivatives (sequence, SLA clock, parent context) are never client authority or
 * retry identity. Omitted owner assignment differs from explicit unassignment. */
export function ticketNativeFormChecksum(form: FormData, operation: "create" | "update") {
  const text = (key: string, max = 4000) => z.string().max(max).parse(String(form.get(key) ?? "").trim());
  const required = (key: string, max = 4000) => z.string().min(1).max(max).parse(text(key, max));
  if (operation === "update") return checksum({ operation, recordId: nativeId.parse(required("workId", 100)),
    recordRevision: z.number().int().min(1).max(2147483646).parse(Number(form.get("version"))),
    status: z.enum(WORK_STATUSES).parse(required("status")),
    reason: text("reason", 10000), ownerIncluded: form.has("ownerUserId"), ownerUserId: text("ownerUserId", 100) || null });
  return checksum({ operation, kind: z.literal("TICKET").parse(required("kind")), queueId: required("queueId", 100),
    serviceId: text("serviceId", 60), answers: JSON.parse(text("answers", 100000) || "{}") as unknown,
    parentCaseId: text("parentCaseId", 100) || null, parentId: text("parentId", 100) || null,
    requestedForUserId: text("requestedForUserId", 100) || null, subject: required("subject", 250), description: required("description", 20000),
    type: text("type", 60) || "SERVICE_REQUEST", priority: text("priority") || "NORMAL", impact: text("impact") || "INDIVIDUAL",
    urgency: text("urgency") || "NORMAL", priorityReason: text("priorityReason"),
    context: Object.fromEntries(["asset", "service", "workaround", "problem", "rootCause", "risk", "implementationPlan", "rollbackPlan", "testingPlan", "schedule"].map(key => [key, text(key)])) });
}
