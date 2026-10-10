import { z } from "zod";
import type { Session } from "@/core/auth/session";
import type { Prisma, StudioDefinitionVersion } from "@/generated/prisma/client";
import { checksum } from "../registry/contracts";
import { entityDetailsSchema } from "../registry/entities";
import { referenceSchema } from "../compiler/kernel";
import { inspectSealedFieldVersion } from "./sealed-field";
import { fieldRuntimeAuthorityInTransaction } from "./runtime-authority";
import { createRequiredMetadataProvider, createInitialRequiredMetadataProvider } from "./required-source";
import { readVersionedFieldContextInTransaction, readVersionedFieldPlanInTransaction, readVersionedFieldValueInTransaction,
  readInitialFieldContextInTransaction, readInitialFieldPlanInTransaction, readInitialFieldValueInTransaction, readCandidateFieldContextInTransaction } from "./runtime-read";
import type { FieldRuntimeAuthority } from "./runtime-authority";
import { evaluateRequiredCondition } from "./required-evaluator";
import type { RequiredFactMetadata } from "./required-compiler";
import type { RequiredFactSource } from "./required-contract";
import { fieldKeySchema } from "./schema";

const recordId = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
const requestSchema = z.strictObject({ definitionId: z.uuid(), recordId, expectedRevision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER) });
const candidateRequestSchema = requestSchema.extend({ versionId: z.uuid() });
const nativeResult = z.strictObject({ recordId, organisationId: z.string().min(1), revision: z.number().int().positive(), fields: z.record(fieldKeySchema, z.unknown()) });
const recordRequest = requestSchema.omit({ definitionId: true }).extend({ entity: referenceSchema });
const sourceOf = (fact: RequiredFactMetadata): RequiredFactSource => fact.kind === "native" ? { kind: "native", fieldId: fact.fieldId }
  : { kind: "field", definitionId: fact.definitionId, versionId: fact.versionId, checksum: fact.checksum };
const meaning = (fact: RequiredFactMetadata) => fact.kind === "native" ? fact : { ...fact, dependencyClosure: [] };
function invalid(): never { throw new Error("FIELD_REQUIREMENT_INVALID: approved record facts changed or are unavailable."); }
type FieldContext = Awaited<ReturnType<typeof readVersionedFieldContextInTransaction>>;

/** Metadata preflight also applies to an empty canonical record set. Inspect
 * every declared dependency/closure without reading business values. */
export async function validateRequiredFieldMetadataInTransaction(authority: FieldRuntimeAuthority, definitionId: string, version: StudioDefinitionVersion, proof?: object) {
  const { session, transaction, registry } = authority;
  const plan = inspectSealedFieldVersion(registry, version, session.organisationId, definitionId);
  if (plan.schemaVersion === 2) {
    const provider = proof ? await createInitialRequiredMetadataProvider(session, transaction, definitionId, plan.payload.entity, proof)
      : await createRequiredMetadataProvider(session, transaction, definitionId, plan.payload.entity);
    for (const fact of plan.requiredIf.plan.facts) {
      const metadata = await provider.resolveMetadata(sourceOf(fact));
      if (checksum(meaning(metadata)) !== checksum(meaning(fact))) invalid();
    }
  }
  return plan;
}

async function resultingValue(authority: FieldRuntimeAuthority, field: FieldContext, recordId: string, proof?: object) {
  const { session, transaction } = authority;
  const slot = field.extension && await transaction.studioFieldSlot.findFirst({ where: { organisationId: session.organisationId, extensionId: field.extension.id,
    definitionId: field.definition.id, generationId: field.payload.storageGeneration }, include: { activeValue: { include: { schemaVersion: true } } } });
  if (slot && ((slot.activeValueId === null) !== (slot.activeValue === null))) invalid();
  if (slot?.activeValue && (slot.activeValueId !== slot.activeValue.id || slot.revision !== slot.activeValue.revision)) invalid();
  if (!slot?.activeValue) return null;
  return proof ? readInitialFieldValueInTransaction(authority, field.payload, field.definition.id, field.payload.storageGeneration, slot.id, recordId, slot.activeValue, proof)
    : readVersionedFieldValueInTransaction(authority, field.payload, field.definition.id, field.payload.storageGeneration, slot.id, recordId, slot.activeValue);
}

/** Read actual transaction state through ordinary record access or the explicit
 * current owning creation proof. All input policies resolve before rule values
 * are read. No mutations, supplied facts, extra grants or publication. Returned
 * fingerprints remain internal. */
async function evaluateRequirement(authenticated: Session, transaction: Prisma.TransactionClient, input: unknown, proof?: object, candidateVersionId?: string) {
  const request = requestSchema.parse(input), authority = await fieldRuntimeAuthorityInTransaction(authenticated, transaction);
  const current = candidateVersionId ? await readCandidateFieldContextInTransaction(authority, request, candidateVersionId)
    : proof ? await readInitialFieldContextInTransaction(authority, request, proof) : await readVersionedFieldContextInTransaction(authority, request), { session, registry } = authority;
  const plan = inspectSealedFieldVersion(registry, current.version, session.organisationId, request.definitionId);
  let native: z.infer<typeof nativeResult> | undefined;
  if (proof) {
    native = nativeResult.parse(await registry.invokeInitialRecordFacts({ session, transaction }, current.payload.entity, proof));
    if (native.organisationId !== session.organisationId || native.recordId !== request.recordId || native.revision !== request.expectedRevision) invalid();
  }
  let conditional = false, conditionFingerprint: string | null = null;
  if (plan.schemaVersion === 2) {
    await validateRequiredFieldMetadataInTransaction(authority, request.definitionId, current.version, proof);
    const evaluated = await evaluateRequiredCondition(plan.requiredIf, async (source, metadata) => {
      if (source.kind === "native") {
        if (metadata.kind !== "native") invalid();
        if (!native) {
          const owner = registry.describe(current.payload.entity.id, current.payload.entity.version), policy = entityDetailsSchema.parse(owner.details).record?.requiredFacts;
          if (!policy) invalid();
          const query = registry.describe(policy.query.id, policy.query.version), reference = { id: query.id, version: query.version, schemaHash: query.schemaHash, contractHash: query.contractHash };
          native = nativeResult.parse(await registry.invokeQueryInTransaction({ session, transaction }, reference, { recordId: request.recordId, expectedRevision: request.expectedRevision }));
          if (native.organisationId !== session.organisationId || native.recordId !== request.recordId || native.revision !== request.expectedRevision) invalid();
        }
        if (!Object.hasOwn(native.fields, source.fieldId) || native.fields[source.fieldId] === undefined) invalid();
        const value = native.fields[source.fieldId];
        return value === null ? null : { type: metadata.storage.type, value };
      }
      if (metadata.kind !== "field") invalid();
      const sourceRequest = { definitionId: source.definitionId, recordId: request.recordId, expectedRevision: request.expectedRevision };
      const field = proof ? await readInitialFieldContextInTransaction(authority, sourceRequest, proof) : await readVersionedFieldContextInTransaction(authority, sourceRequest);
      if (field.payload.entity.id !== current.payload.entity.id || field.payload.storageGeneration !== metadata.generationId
        || (field.extension?.id ?? null) !== (current.extension?.id ?? null) || (field.extension?.revision ?? null) !== (current.extension?.revision ?? null)) invalid();
      const version = await transaction.studioDefinitionVersion.findFirst({ where: { id: source.versionId, definitionId: source.definitionId, organisationId: session.organisationId } });
      if (!version || version.checksum !== source.checksum) invalid();
      const pinned = proof ? await readInitialFieldPlanInTransaction(authority, version, source.definitionId) : await readVersionedFieldPlanInTransaction(authority, version, source.definitionId);
      const anchor = proof ? await registry.authoriseCurrentFieldInitialisation({ session, transaction }, pinned.entity, proof)
        : await registry.authoriseRecord({ session, transaction }, pinned.entity, { recordId: request.recordId, intent: "read" });
      if (anchor.recordId !== request.recordId || anchor.revision !== request.expectedRevision) invalid();
      const value = await resultingValue(authority, field, request.recordId, proof);
      if (value?.type === "reference" && pinned.field.storage.type === "reference") await registry.authoriseRecord({ session, transaction }, pinned.field.storage.entity, { recordId: value.value, intent: "read" });
      return value;
    });
    conditional = evaluated.required; conditionFingerprint = evaluated.fingerprint;
  }
  return { authority, current, result: { definitionId: request.definitionId, versionId: current.version.id, recordRevision: current.anchor.revision,
    extensionRevision: current.extension?.revision ?? null, required: current.payload.field.required || conditional,
    fingerprint: checksum({ versionChecksum: current.version.checksum, recordId: request.recordId, recordRevision: current.anchor.revision,
      extensionRevision: current.extension?.revision ?? null, conditionFingerprint }) } };
}
export const evaluateExistingFieldRequirement = async (authenticated: Session, transaction: Prisma.TransactionClient, input: unknown) => (await evaluateRequirement(authenticated, transaction, input)).result;
export const evaluateInitialFieldRequirement = async (authenticated: Session, transaction: Prisma.TransactionClient, input: unknown, proof: object) => (await evaluateRequirement(authenticated, transaction, input, proof)).result;

/** Candidate coverage only: server-load an immutable tenant version and inspect
 * actual values under genuine ordinary record authority. No activation pointer
 * change, client plan, creation proof, publication grant or temporary schema. */
export async function validateCandidateFieldRequirement(authenticated: Session, transaction: Prisma.TransactionClient, input: unknown) {
  const { versionId, ...request } = candidateRequestSchema.parse(input);
  const evaluated = await evaluateRequirement(authenticated, transaction, request, undefined, versionId);
  if (evaluated.result.required) {
    const value = await resultingValue(evaluated.authority, evaluated.current, request.recordId);
    if (value === null || (value.type === "multi_enum" && value.value.length === 0)) throw new Error(`${evaluated.current.payload.field.label} is required.`);
  }
  return evaluated.result;
}

/** Validate actual uncommitted native/typed state after the owning operation's
 * writes. Any error must roll back that whole transaction, including Audit/outbox.
 * This does not grant writes, open a transaction, persist values or enable hooks.
 * Mutating integration must acquire the shared native/config lock order first. */
export async function validateResultingFieldRequirements(authenticated: Session, transaction: Prisma.TransactionClient, input: unknown, proof?: object) {
  const request = recordRequest.parse(input), authority = await fieldRuntimeAuthorityInTransaction(authenticated, transaction), { session, registry } = authority;
  const metadata = proof ? (await registry.resolveCurrentFieldInitialisation(session, request.entity)).source : await registry.resolve(session, request.entity);
  const policy = metadata.kind === "entity" ? entityDetailsSchema.parse(metadata.details).record?.fieldPolicy : null;
  if (!policy) invalid();
  const context = { session, transaction };
  const anchor = proof ? await registry.authoriseCurrentFieldInitialisation(context, request.entity, proof)
    : await registry.authoriseRecord(context, request.entity, { recordId: request.recordId, intent: "read", expectedRevision: request.expectedRevision });
  if (anchor.recordId !== request.recordId || anchor.organisationId !== session.organisationId || anchor.revision !== request.expectedRevision) invalid();
  if (proof) {
    const native = nativeResult.parse(await registry.invokeInitialRecordFacts(context, request.entity, proof));
    if (native.recordId !== request.recordId || native.organisationId !== session.organisationId || native.revision !== request.expectedRevision) invalid();
  }
  const extension = await transaction.studioExtensionRecord.findFirst({ where: { organisationId: session.organisationId, entityId: request.entity.id, recordId: request.recordId }, select: { id: true, revision: true } });
  await transaction.$queryRaw`SELECT d.id FROM studio_definitions d JOIN studio_field_bindings b ON b."definitionId"=d.id AND b."organisationId"=d."organisationId"
    WHERE d."organisationId"=${session.organisationId} AND b."entityId"=${request.entity.id} AND d.kind='customField' AND d."retiredAt" IS NULL AND d."activeVersionId" IS NOT NULL
    ORDER BY d.id LIMIT ${policy.maxFields + 1} FOR SHARE OF d,b`;
  const fields = await transaction.studioDefinition.findMany({ where: { organisationId: session.organisationId, kind: "customField", retiredAt: null,
    activeVersionId: { not: null }, fieldBinding: { entityId: request.entity.id } }, include: { activeVersion: true }, orderBy: { id: "asc" }, take: policy.maxFields + 1 });
  if (fields.length > policy.maxFields) invalid();
  const checked: { definitionId: string; fingerprint: string }[] = [];
  for (const field of fields) {
    if (!field.activeVersion || field.organisationId !== session.organisationId || field.activeVersionId !== field.activeVersion.id) invalid();
    const plan = inspectSealedFieldVersion(registry, field.activeVersion, session.organisationId, field.id);
    if (plan.payload.entity.id !== request.entity.id || field.key !== `${request.entity.id}.${plan.payload.field.key}`) invalid();
    // Optional unconditional fields cannot impose unrelated private value reads
    // on native operations. Their actual writes still validate type/access.
    if (plan.schemaVersion === 1 && !plan.payload.field.required) { checked.push({ definitionId: field.id, fingerprint: field.activeVersion.checksum }); continue; }
    const evaluated = await evaluateRequirement(session, transaction, { definitionId: field.id, recordId: request.recordId, expectedRevision: request.expectedRevision }, proof);
    if (evaluated.current.definition.activeVersionId !== field.activeVersionId) invalid();
    if ((evaluated.current.extension?.id ?? null) !== (extension?.id ?? null) || (evaluated.current.extension?.revision ?? null) !== (extension?.revision ?? null)) invalid();
    if (evaluated.result.required) {
      const value = await resultingValue(evaluated.authority, evaluated.current, request.recordId, proof);
      if (value === null || (value.type === "multi_enum" && value.value.length === 0)) throw new Error(`${evaluated.current.payload.field.label} is required.`);
    }
    checked.push({ definitionId: field.id, fingerprint: evaluated.result.fingerprint });
  }
  return { recordRevision: anchor.revision, extensionRevision: extension?.revision ?? null, fieldsChecked: checked.length, fingerprint: checksum({ entity: request.entity,
    recordId: request.recordId, recordRevision: anchor.revision, extensionRevision: extension?.revision ?? null, checked }) };
}
