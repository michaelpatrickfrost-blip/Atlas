import { z } from "zod";
import type { StudioDefinitionVersion } from "@/generated/prisma/client";
import { sessionAuthorityStamp } from "@/core/auth/session";
import { checksum } from "../registry/contracts";
import { entityDetailsSchema } from "../registry/entities";
import { referenceSchema } from "../compiler/reference";
import { loadSealedConfigurationVersion, inspectConfigurationPin, inspectRetainedConfigurationPin } from "../configuration/pins";
import { inspectSealedFieldVersion } from "../fields/sealed-field";
import { readVersionedFieldPlanInTransaction, readInitialFieldPlanInTransaction, readNativeFieldPlanInTransaction } from "../fields/runtime-read";
import type { FieldRuntimeAuthority } from "../fields/runtime-authority";
import type { NativeFieldValidationAccess } from "../fields/native-validation-access";
import { entityProfilePayloadSchema, recordTypePayloadSchema, configurationReferenceSchema,
  type ConfigurationReference, type EntityProfileReference, type EntityProfile, type EntityProfilePayload, type RecordTypePayload } from "./schema";
import { resolveEntityProfile, resolveRecordTypeProfile } from "./resolver";
import { recordTypeAssignmentProvenanceSchema } from "./assignment-contract";
import { authoredPageFieldPins } from "../pages/definition-compiler";
import { reconstructPageMetadataInTransaction } from "../pages/server-approvals";
import { compilePage } from "../pages/compiler";
import { pagePayloadSchema } from "../pages/schema";
import { pageApprovalsSchema } from "../pages/approvals";

const dependency = referenceSchema.extend({ ownerModuleId: z.string(), kind: z.enum(["entity", "query", "command", "event", "surface", "decisionFact", "template", "metric", "integration"]),
  classification: z.enum(["public_internal", "confidential", "restricted"]) });
const frame = z.strictObject({ kind: z.enum(["entityProfile", "recordType"]), schemaVersion: z.literal(1), payload: z.unknown(),
  resolvedProfile: entityProfilePayloadSchema.shape.profile, dependencies: z.array(dependency).max(100),
  configurationDependencies: z.array(configurationReferenceSchema).max(202) });
const requestSchema = z.strictObject({ entity: referenceSchema, recordId: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/),
  expectedRevision: z.number().int().positive().max(2147483647) });
export type RecordProfileAccess = { kind: "ordinary" } | { kind: "initial"; proof: object } | NativeFieldValidationAccess;
export type ResolvedRecordProfile = { baseProfile: EntityProfileReference | null; recordType: ConfigurationReference | null;
  profile: EntityProfile | null; fingerprint: string; assignmentId: string | null };
type InspectedRecordProfile = { payload: EntityProfilePayload | RecordTypePayload; profile: EntityProfile;
  entity: z.infer<typeof referenceSchema>; baseProfile: EntityProfileReference; reference: ConfigurationReference };
function invalid(): never { throw new Error("RECORD_PROFILE_INVALID: the current record design is unavailable or incompatible."); }
const meaning = (payload: ReturnType<typeof inspectSealedFieldVersion>["payload"]) => ({ ...payload, field: { ...payload.field, label: "", help: "" } });

/** Metadata-only reconstruction. No authoring compiler, field Write requirement,
 * value projection or record impersonation. The caller separately checks all
 * current/pinned policies through its real ordinary/INSERT/native access mode. */
export async function inspectRecordProfileInTransaction(authority: FieldRuntimeAuthority, pin: ConfigurationReference): Promise<InspectedRecordProfile> {
  const { session, transaction: tx, registry } = authority;
  if (pin.kind !== "entityProfile" && pin.kind !== "recordType") invalid();
  const version = await loadSealedConfigurationVersion(session, tx, pin), plan = frame.parse(version.compiledPlan);
  if (plan.kind !== pin.kind) invalid();
  const payload = plan.kind === "entityProfile" ? entityProfilePayloadSchema.parse(version.payload) : recordTypePayloadSchema.parse(version.payload);
  const binding = await tx.studioProfileBinding.findFirst({ where: { organisationId: session.organisationId, definitionId: pin.definitionId,
    entityId: payload.entity.id, kind: pin.kind }, select: { originVersionId: true } });
  if (!binding) invalid();
  const origin = await tx.studioDefinitionVersion.findFirst({ where: { id: binding.originVersionId, definitionId: pin.definitionId,
    organisationId: session.organisationId }, include: { definition: true, configurationDependencies: { take: 203 } } });
  if (!origin || origin.id !== binding.originVersionId) invalid();
  inspectRetainedConfigurationPin(session.organisationId, { ...pin, versionId: origin.id, schemaVersion: origin.schemaVersion, checksum: origin.checksum }, origin);
  const originPayload = z.object({ entity: referenceSchema }).safeParse(origin.payload);
  if (!originPayload.success || originPayload.data.entity.id !== payload.entity.id) invalid();
  let baseProfile: EntityProfileReference, resolved;
  if (plan.kind === "entityProfile") {
    baseProfile = { ...pin, kind: "entityProfile", schemaVersion: 1 };
    resolved = resolveEntityProfile(payload)!;
  } else {
    const type = recordTypePayloadSchema.parse(payload);
    const base = await inspectRecordProfileInTransaction(authority, type.baseProfile);
    baseProfile = type.baseProfile;
    resolved = resolveRecordTypeProfile({ reference: type.baseProfile, payload: base.payload }, type, pin.definitionId);
  }
  if (resolved.profile.allowedProcesses.length || resolved.profile.defaultDecisions.length)
    throw new Error("RECORD_PROFILE_INVALID: this record design needs a later Process or Decision runtime adapter.");
  if (checksum(plan.resolvedProfile) !== checksum(resolved.profile)
    || checksum(plan.configurationDependencies) !== checksum(resolved.configurationDependencies)) invalid();
  const expected = new Map<string, z.infer<typeof dependency>>();
  const add = (reference: z.infer<typeof referenceSchema>) => {
    const metadata = registry.describe(reference.id, reference.version);
    if (metadata.schemaHash !== reference.schemaHash || metadata.contractHash !== reference.contractHash
      || (metadata.lifecycle === "deprecated" && Date.parse(metadata.supportedUntil!) <= Date.now())) invalid();
    expected.set(`${reference.id}@${reference.version}`, { ...reference, ownerModuleId: metadata.ownerModuleId,
      kind: metadata.kind, classification: metadata.classification });
  };
  add(resolved.entity);
  const details = entityDetailsSchema.parse(registry.describe(resolved.entity.id, resolved.entity.version).details);
  if (pin.kind === "recordType" && !details.extensionPolicy.recordTypes) invalid();
  if (resolved.profile.page) {
    const pageVersion = await loadSealedConfigurationVersion(session, tx, resolved.profile.page);
    const page = pagePayloadSchema.parse(pageVersion.payload);
    const stored = z.object({ approvals: pageApprovalsSchema }).parse(pageVersion.compiledPlan);
    const { id, version, schemaHash, contractHash } = stored.approvals.sourcePage;
    const sourcePage = { id, version, schemaHash, contractHash };
    const approvals = await reconstructPageMetadataInTransaction(authority, { sourcePage, customFields: authoredPageFieldPins(page) });
    const compiledPage = compilePage(page, approvals);
    if (page.entity.id !== resolved.entity.id || checksum(compiledPage) !== pageVersion.checksum) invalid();
    for (const ref of compiledPage.dependencies) add(ref);
  }
  for (const fieldPin of resolved.profile.requiredFields) {
    const field = await loadSealedConfigurationVersion(session, tx, fieldPin);
    const sealed = inspectSealedFieldVersion(registry, field, session.organisationId, fieldPin.definitionId);
    if (sealed.payload.entity.id !== resolved.entity.id) invalid();
    for (const ref of sealed.dependencies) add(ref);
  }
  const dependencies = [...expected.values()].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : a.version - b.version);
  if (checksum(plan.dependencies) !== checksum(dependencies)) invalid();
  return { payload, profile: resolved.profile, entity: resolved.entity, baseProfile, reference: pin };
}

export async function preflightRecordProfileFields(authority: FieldRuntimeAuthority, profile: EntityProfile | null,
  entityId: string, access: RecordProfileAccess) {
  if (!profile) return;
  for (const pin of profile.requiredFields) {
    const sealed = await loadSealedConfigurationVersion(authority.session, authority.transaction, pin);
    const version = await authority.transaction.studioDefinitionVersion.findFirst({ where: { id: pin.versionId, definitionId: pin.definitionId,
      organisationId: authority.session.organisationId } });
    if (!version || version.checksum !== sealed.checksum) invalid();
    const current = await authority.transaction.studioDefinition.findFirst({ where: { id: pin.definitionId, organisationId: authority.session.organisationId,
      kind: "customField", retiredAt: null }, include: { activeVersion: true } });
    if (!current?.activeVersion || current.activeVersionId !== current.activeVersion.id) invalid();
    const read = (v: StudioDefinitionVersion) => access.kind === "initial" ? readInitialFieldPlanInTransaction(authority, v, pin.definitionId)
      : access.kind === "native_validation" ? readNativeFieldPlanInTransaction(authority, v, pin.definitionId, access)
        : readVersionedFieldPlanInTransaction(authority, v, pin.definitionId);
    const pinned = await read(version), active = await read(current.activeVersion);
    if (pinned.entity.id !== entityId || active.entity.id !== entityId || version.schemaVersion !== current.activeVersion.schemaVersion
      || current.key !== `${entityId}.${active.field.key}` || checksum(meaning(pinned)) !== checksum(meaning(active))) invalid();
  }
}

/** Canonical stable type resolves its CURRENT active version; the version's
 * explicit retained base pin is never silently rewritten to today's base. */
export async function resolveRecordProfileInTransaction(authority: FieldRuntimeAuthority, input: unknown,
  access: RecordProfileAccess = { kind: "ordinary" }): Promise<ResolvedRecordProfile> {
  const request = requestSchema.parse(input), { session, registry, transaction: tx } = authority;
  const stamp = sessionAuthorityStamp(session);
  if (!stamp || stamp !== authority.stamp) throw new Error("FORBIDDEN: genuine current record design authority is required.");
  const context = { session, transaction: tx };
  const metadata = access.kind === "initial" ? (await registry.resolveCurrentFieldInitialisation(session, request.entity)).source
    : access.kind === "native_validation" ? (await registry.resolveNativeValidationFieldPolicy(context, request.entity, access.request, access.operation, access.proof)).source
      : await registry.resolve(session, request.entity);
  if (metadata.kind !== "entity") invalid();
  const anchor = access.kind === "initial" ? await registry.authoriseCurrentFieldInitialisation(context, request.entity, access.proof)
    : access.kind === "native_validation" ? (await registry.resolveNativeValidationFieldPolicy(context, request.entity, access.request, access.operation, access.proof)).anchor
      : await registry.authoriseRecord(context, request.entity, { recordId: request.recordId, intent: "read", expectedRevision: request.expectedRevision });
  if (anchor.organisationId !== session.organisationId || anchor.recordId !== request.recordId || anchor.revision !== request.expectedRevision
    || (access.kind === "native_validation" && (access.request.recordId !== request.recordId || access.request.expectedRevision !== request.expectedRevision))) invalid();
  const extension = await tx.studioExtensionRecord.findFirst({ where: { organisationId: session.organisationId, entityId: request.entity.id, recordId: request.recordId },
    select: { id: true, revision: true, recordTypeAssignmentId: true, recordTypeAssignment: true } });
  let definitionId: string | null = null, assignmentId: string | null = null;
  if (extension?.recordTypeAssignmentId) {
    const assignment = extension.recordTypeAssignment;
    if (!assignment || assignment.id !== extension.recordTypeAssignmentId || assignment.extensionId !== extension.id
      || assignment.organisationId !== session.organisationId || assignment.entityId !== request.entity.id || assignment.recordId !== request.recordId
      || assignment.extensionRevision > extension.revision || checksum(assignment.provenance) !== assignment.checksum) invalid();
    const retained = recordTypeAssignmentProvenanceSchema.parse(assignment.provenance);
    if (retained.operationId !== assignment.id || retained.extensionId !== extension.id || retained.extensionRevision !== assignment.extensionRevision
      || retained.organisationId !== session.organisationId || retained.recordId !== request.recordId || retained.entity.id !== request.entity.id
      || retained.createdBy !== assignment.createdBy || retained.requestChecksum !== assignment.requestChecksum || retained.nativeRevision !== assignment.nativeRevision
      || retained.previousAssignmentId !== assignment.previousAssignmentId || (retained.recordType?.definitionId ?? null) !== assignment.recordTypeDefinitionId
      || (retained.recordType?.versionId ?? null) !== assignment.recordTypeVersionId || (retained.baseProfile?.definitionId ?? null) !== assignment.baseProfileDefinitionId
      || (retained.baseProfile?.versionId ?? null) !== assignment.baseProfileVersionId) invalid();
    if (retained.extensionRevision !== (retained.previousExtensionRevision ?? 0) + 1
      || retained.requestChecksum !== checksum({ operationId: retained.operationId, entity: retained.entity, recordId: retained.recordId,
        recordRevision: retained.nativeRevision, extensionRevision: retained.previousExtensionRevision, recordType: retained.recordType })) invalid();
    let historicalProfile: EntityProfile | null = null;
    for (const pin of [retained.recordType, retained.baseProfile]) if (pin) {
      const historical = await tx.studioDefinitionVersion.findFirst({ where: { id: pin.versionId, definitionId: pin.definitionId,
        organisationId: session.organisationId }, include: { definition: true, configurationDependencies: { take: 203 } } });
      if (!historical) invalid();
      inspectRetainedConfigurationPin(session.organisationId, pin, historical);
      const historicalPlan = frame.parse(historical.compiledPlan);
      if (historicalPlan.kind !== pin.kind) invalid();
      if (pin.kind === "recordType") {
        const payload = recordTypePayloadSchema.parse(historical.payload);
        if (payload.entity.id !== request.entity.id || checksum(payload.baseProfile) !== checksum(retained.baseProfile)) invalid();
        historicalProfile = historicalPlan.resolvedProfile;
      } else {
        if (entityProfilePayloadSchema.parse(historical.payload).entity.id !== request.entity.id) invalid();
        if (!retained.recordType) historicalProfile = historicalPlan.resolvedProfile;
      }
    }
    if ((historicalProfile ? checksum(historicalProfile) : null) !== retained.resolvedProfileChecksum) invalid();
    // A newer type/base cannot erase the policy of the profile that supplied
    // this association. Check retained field grants before even an empty current
    // profile/base return; the actual access mode remains ordinary/INSERT/native.
    await preflightRecordProfileFields(authority, historicalProfile, request.entity.id, access);
    definitionId = assignment.recordTypeDefinitionId; assignmentId = assignment.id;
  } else if (extension?.recordTypeAssignment) invalid();
  let kind: "entityProfile" | "recordType" = "recordType";
  if (!definitionId) {
    kind = "entityProfile";
    const bindings = await tx.studioProfileBinding.findMany({ where: { organisationId: session.organisationId, entityId: request.entity.id, kind },
      select: { definitionId: true }, take: 2 });
    if (bindings.length > 1) invalid();
    definitionId = bindings[0]?.definitionId ?? null;
  }
  if (!definitionId) return { baseProfile: null, recordType: null, profile: null, assignmentId, fingerprint: checksum({ entity: request.entity, assignmentId, profile: null }) };
  const current = await tx.studioDefinition.findFirst({ where: { id: definitionId, organisationId: session.organisationId, kind },
    include: { activeVersion: { include: { definition: true, configurationDependencies: { take: 203 } } } } });
  if (!current) invalid();
  if (kind === "entityProfile" && (current.retiredAt !== null || current.activeVersionId === null))
    return { baseProfile: null, recordType: null, profile: null, assignmentId, fingerprint: checksum({ entity: request.entity, assignmentId, profile: null }) };
  if (current.retiredAt !== null || !current.activeVersion || current.activeVersionId !== current.activeVersion.id) invalid();
  const pin = configurationReferenceSchema.parse({ kind, definitionId, versionId: current.activeVersion.id,
    schemaVersion: current.activeVersion.schemaVersion, checksum: current.activeVersion.checksum });
  inspectConfigurationPin(session.organisationId, pin, current.activeVersion);
  const inspected = await inspectRecordProfileInTransaction(authority, pin);
  if (inspected.entity.id !== request.entity.id) invalid();
  await preflightRecordProfileFields(authority, inspected.profile, request.entity.id, access);
  return { baseProfile: inspected.baseProfile, recordType: kind === "recordType" ? pin : null, profile: inspected.profile, assignmentId,
    fingerprint: checksum({ assignmentId, baseProfile: inspected.baseProfile, recordType: kind === "recordType" ? pin : null, profile: inspected.profile }) };
}
