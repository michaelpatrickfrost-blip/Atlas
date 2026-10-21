import { z } from "zod";
import { sessionAuthorityStamp } from "@/core/auth/session";
import type { Session } from "@/core/auth/session";
import type { Prisma, StudioDefinitionVersion } from "@/generated/prisma/client";
import { checksum } from "../registry/contracts";
import { entityDetailsSchema } from "../registry/entities";
import { referenceSchema } from "../compiler/kernel";
import { inspectSealedFieldVersion } from "./sealed-field";
import { fieldRuntimeAuthorityInTransaction } from "./runtime-authority";
import { createRequiredMetadataProvider, createInitialRequiredMetadataProvider, createNativeRequiredMetadataProvider } from "./required-source";
import { readVersionedFieldContextInTransaction, readInitialFieldContextInTransaction, readCandidateFieldContextInTransaction, readNativeFieldContextInTransaction } from "./runtime-read";
import type { FieldRuntimeAuthority } from "./runtime-authority";
import { evaluateConditionalInputsInTransaction, nativeRequiredResultSchema as nativeResult, readResultingFieldValue as resultingValue, preflightResultingFieldValue, preflightNativeConditionalInputsInTransaction } from "./required-inputs";
import { inspectRecordProfileInTransaction, preflightRecordProfileFields, resolveRecordProfileInTransaction, type ResolvedRecordProfile } from "../record-types/runtime-profile";
import { configurationReferenceSchema } from "../record-types/schema";
import type { RequiredFactMetadata } from "./required-compiler";
import type { RequiredFactSource } from "./required-contract";

import type { ContractReference } from "../registry/types";
import type { NativeFieldValidationAccess } from "./native-validation-access";

const recordId = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
const requestSchema = z.strictObject({ definitionId: z.uuid(), recordId, expectedRevision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER) });
const candidateRequestSchema = requestSchema.extend({ versionId: z.uuid() });
const recordRequest = requestSchema.omit({ definitionId: true }).extend({ entity: referenceSchema });
const sourceOf = (fact: RequiredFactMetadata): RequiredFactSource => fact.kind === "native" ? { kind: "native", fieldId: fact.fieldId }
  : { kind: "field", definitionId: fact.definitionId, versionId: fact.versionId, checksum: fact.checksum };
const meaning = (fact: RequiredFactMetadata) => fact.kind === "native" ? fact : { ...fact, dependencyClosure: [] };
function invalid(): never { throw new Error("FIELD_REQUIREMENT_INVALID: approved record facts changed or are unavailable."); }

/** Metadata preflight also applies to an empty canonical record set. Inspect
 * every declared dependency/closure without reading business values. */
export async function validateRequiredFieldMetadataInTransaction(authority: FieldRuntimeAuthority, definitionId: string, version: StudioDefinitionVersion, proof?: object, native?: NativeFieldValidationAccess) {
  const { session, transaction, registry } = authority;
  const plan = inspectSealedFieldVersion(registry, version, session.organisationId, definitionId);
  if (plan.schemaVersion === 2) {
    const provider = native ? await createNativeRequiredMetadataProvider(authority, definitionId, plan.payload.entity, native) : proof ? await createInitialRequiredMetadataProvider(session, transaction, definitionId, plan.payload.entity, proof)
      : await createRequiredMetadataProvider(session, transaction, definitionId, plan.payload.entity);
    for (const fact of plan.requiredIf.plan.facts) {
      const metadata = await provider.resolveMetadata(sourceOf(fact));
      if (checksum(meaning(metadata)) !== checksum(meaning(fact))) invalid();
    }
  }
  return plan;
}

/** Read actual transaction state through ordinary record access or the explicit
 * current owning creation proof. All input policies resolve before rule values
 * are read. No mutations, supplied facts, extra grants or publication. Returned
 * fingerprints remain internal. */
async function evaluateRequirement(authenticated: Session, transaction: Prisma.TransactionClient, input: unknown, proof?: object, candidateVersionId?: string, native?: NativeFieldValidationAccess) {
  const request = requestSchema.parse(input), authority = await fieldRuntimeAuthorityInTransaction(authenticated, transaction);
  const current = candidateVersionId ? await readCandidateFieldContextInTransaction(authority, request, candidateVersionId)
    : native ? await readNativeFieldContextInTransaction(authority, request, native) : proof ? await readInitialFieldContextInTransaction(authority, request, proof) : await readVersionedFieldContextInTransaction(authority, request), { session, registry } = authority;
  const plan = inspectSealedFieldVersion(registry, current.version, session.organisationId, request.definitionId);
  if (proof && plan.schemaVersion === 1) {
    const native = nativeResult.parse(await registry.invokeInitialRecordFacts({ session, transaction }, current.payload.entity, proof));
    if (native.organisationId !== session.organisationId || native.recordId !== request.recordId || native.revision !== request.expectedRevision) invalid();
  }
  let conditional = false, conditionFingerprint: string | null = null;
  if (plan.schemaVersion === 2) {
    await validateRequiredFieldMetadataInTransaction(authority, request.definitionId, current.version, proof, native);
    const evaluated = await evaluateConditionalInputsInTransaction(authority,
      { entity: current.payload.entity, extension: current.extension }, plan, request, proof, native);
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
  return validateResulting(await fieldRuntimeAuthorityInTransaction(authenticated, transaction), input, proof);
}

/** Candidate profile coverage only. Load the exact sealed server version and
 * substitute its additive requirements in the shared resulting-state validator.
 * No temporary active pointer, supplied plan, native writer or access grant. */
export async function validateCandidateRecordProfileRequirements(authenticated: Session, transaction: Prisma.TransactionClient,
  input: unknown, candidate: unknown) {
  const authority = await fieldRuntimeAuthorityInTransaction(authenticated, transaction), request = recordRequest.parse(input);
  const pin = configurationReferenceSchema.parse(candidate);
  const inspected = await inspectRecordProfileInTransaction(authority, pin);
  if (inspected.entity.id !== request.entity.id) invalid();
  await preflightRecordProfileFields(authority, inspected.profile, request.entity.id, { kind: "ordinary" });
  const profile: ResolvedRecordProfile = { baseProfile: inspected.baseProfile, recordType: pin.kind === "recordType" ? pin : null,
    profile: inspected.profile, assignmentId: null, fingerprint: checksum({ candidate: pin, profile: inspected.profile }) };
  return validateResulting(authority, request, undefined, undefined, profile);
}

/** Internal owning mutation only. A live native proof substitutes this record's
 * visibility, never field/native-fact/reference grants or creation authority. */
export async function validateNativeResultingFieldRequirements(authority: FieldRuntimeAuthority, input: { entity: ContractReference; recordId: string; expectedRevision: number }, operation: string, proof: object) {
  const stamp = sessionAuthorityStamp(authority.session);
  if (!stamp || stamp !== authority.stamp || stamp.userId !== authority.session.userId || stamp.organisationId !== authority.session.organisationId
    || stamp.membershipId !== authority.session.membershipId) throw new Error("FORBIDDEN: genuine current native validation authority is required.");
  const request = recordRequest.parse(input);
  const fresh = await fieldRuntimeAuthorityInTransaction(authority.session, authority.transaction);
  const access: NativeFieldValidationAccess = { kind: "native_validation", request: { recordId: request.recordId, expectedRevision: request.expectedRevision }, operation, proof };
  return validateResulting(fresh, request, undefined, access);
}

async function validateResulting(authority: FieldRuntimeAuthority, input: unknown, proof?: object, native?: NativeFieldValidationAccess,
  candidateProfile?: ResolvedRecordProfile) {
  const request = recordRequest.parse(input), { session, transaction, registry } = authority;
  const nativePolicy = native && await registry.resolveNativeValidationFieldPolicy({ session, transaction }, request.entity, native.request, native.operation, native.proof);
  const metadata = nativePolicy ? nativePolicy.source : proof ? (await registry.resolveCurrentFieldInitialisation(session, request.entity)).source : await registry.resolve(session, request.entity);
  const policy = metadata.kind === "entity" ? entityDetailsSchema.parse(metadata.details).record?.fieldPolicy : null;
  if (!policy) invalid();
  const context = { session, transaction };
  const anchor = nativePolicy ? nativePolicy.anchor : proof ? await registry.authoriseCurrentFieldInitialisation(context, request.entity, proof)
    : await registry.authoriseRecord(context, request.entity, { recordId: request.recordId, intent: "read", expectedRevision: request.expectedRevision });
  if (anchor.recordId !== request.recordId || anchor.organisationId !== session.organisationId || anchor.revision !== request.expectedRevision) invalid();
  if (proof) {
    const native = nativeResult.parse(await registry.invokeInitialRecordFacts(context, request.entity, proof));
    if (native.recordId !== request.recordId || native.organisationId !== session.organisationId || native.revision !== request.expectedRevision) invalid();
  }
  const profile = candidateProfile ?? await resolveRecordProfileInTransaction(authority, request, native ?? (proof ? { kind: "initial", proof } : { kind: "ordinary" }));
  const profileRequired = new Set(profile.profile?.requiredFields.map(pin => pin.definitionId) ?? []);
  const extension = await transaction.studioExtensionRecord.findFirst({ where: { organisationId: session.organisationId, entityId: request.entity.id, recordId: request.recordId }, select: { id: true, revision: true } });
  await transaction.$queryRaw`SELECT d.id FROM studio_definitions d JOIN studio_field_bindings b ON b."definitionId"=d.id AND b."organisationId"=d."organisationId"
    WHERE d."organisationId"=${session.organisationId} AND b."entityId"=${request.entity.id} AND d.kind='customField' AND d."retiredAt" IS NULL AND d."activeVersionId" IS NOT NULL
    ORDER BY d.id LIMIT ${policy.maxFields + 1} FOR SHARE OF d,b`;
  const fields = await transaction.studioDefinition.findMany({ where: { organisationId: session.organisationId, kind: "customField", retiredAt: null,
    activeVersionId: { not: null }, fieldBinding: { entityId: request.entity.id } }, include: { activeVersion: true }, orderBy: { id: "asc" }, take: policy.maxFields + 1 });
  if (fields.length > policy.maxFields) invalid();
  if ([...profileRequired].some(id => !fields.some(field => field.id === id))) invalid();
  // Complete metadata-only preflight before ANY native facts or typed columns.
  // False conditional targets have no written target read; their inputs do.
  if (native || profileRequired.size > 0) for (const field of fields) {
    if (!field.activeVersion || field.organisationId !== session.organisationId || field.activeVersionId !== field.activeVersion.id) invalid();
    const plan = inspectSealedFieldVersion(registry, field.activeVersion, session.organisationId, field.id);
    if (plan.payload.entity.id !== request.entity.id || field.key !== `${request.entity.id}.${plan.payload.field.key}`) invalid();
    if (plan.schemaVersion === 1 && !plan.payload.field.required && !profileRequired.has(field.id)) continue;
    const fieldRequest = { definitionId: field.id, recordId: request.recordId, expectedRevision: request.expectedRevision };
    const current = native ? await readNativeFieldContextInTransaction(authority, fieldRequest, native)
      : proof ? await readInitialFieldContextInTransaction(authority, fieldRequest, proof) : await readVersionedFieldContextInTransaction(authority, fieldRequest);
    if (current.version.id !== field.activeVersionId || (current.extension?.id ?? null) !== (extension?.id ?? null)
      || (current.extension?.revision ?? null) !== (extension?.revision ?? null)) invalid();
    await validateRequiredFieldMetadataInTransaction(authority, field.id, current.version, proof, native);
    if (native && plan.schemaVersion === 2) await preflightNativeConditionalInputsInTransaction(authority, { entity: current.payload.entity, extension: current.extension }, plan,
      { definitionId: field.id, recordId: request.recordId, expectedRevision: request.expectedRevision }, native);
    if (plan.payload.field.required || profileRequired.has(field.id)) await preflightResultingFieldValue(authority, current, proof, native);
  }
  const checked: { definitionId: string; fingerprint: string }[] = [];
  for (const field of fields) {
    if (!field.activeVersion || field.organisationId !== session.organisationId || field.activeVersionId !== field.activeVersion.id) invalid();
    const plan = inspectSealedFieldVersion(registry, field.activeVersion, session.organisationId, field.id);
    if (plan.payload.entity.id !== request.entity.id || field.key !== `${request.entity.id}.${plan.payload.field.key}`) invalid();
    // Optional unconditional fields cannot impose unrelated private value reads
    // on native operations. Their actual writes still validate type/access.
    if (plan.schemaVersion === 1 && !plan.payload.field.required && !profileRequired.has(field.id)) { checked.push({ definitionId: field.id, fingerprint: field.activeVersion.checksum }); continue; }
    const evaluated = await evaluateRequirement(session, transaction, { definitionId: field.id, recordId: request.recordId, expectedRevision: request.expectedRevision }, proof, undefined, native);
    if (evaluated.current.definition.activeVersionId !== field.activeVersionId) invalid();
    if ((evaluated.current.extension?.id ?? null) !== (extension?.id ?? null) || (evaluated.current.extension?.revision ?? null) !== (extension?.revision ?? null)) invalid();
    if (evaluated.result.required || profileRequired.has(field.id)) {
      const value = await resultingValue(evaluated.authority, evaluated.current, request.recordId, proof, native);
      if (value === null || (value.type === "multi_enum" && value.value.length === 0)) throw new Error(`${evaluated.current.payload.field.label} is required.`);
    }
    checked.push({ definitionId: field.id, fingerprint: evaluated.result.fingerprint });
  }
  return { recordRevision: anchor.revision, extensionRevision: extension?.revision ?? null, fieldsChecked: checked.length, fingerprint: checksum({ entity: request.entity,
    recordId: request.recordId, recordRevision: anchor.revision, extensionRevision: extension?.revision ?? null,
    ...(profile.profile || profile.assignmentId ? { profileFingerprint: profile.fingerprint } : {}), checked }) };
}
