import { z } from "zod";
import { sessionAuthorityStamp } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { checksum } from "../registry/contracts";
import { entityDetailsSchema } from "../registry/entities";
import type { ContractMetadata, ContractReference } from "../registry/types";
import { referenceSchema } from "../compiler/reference";
import { compileCustomFieldForRead } from "../compiler/fields";
import { loadSealedConfigurationVersion } from "../configuration/pins";
import { customFieldReferenceSchema, normaliseConfigurationReferences } from "../record-types";
import { assertFieldBinding, fieldDefinitionKey } from "../fields/binding";
import { inspectSealedFieldVersion } from "../fields/sealed-field";
import type { FieldRuntimeAuthority } from "../fields/runtime-authority";
import { pageApprovalsSchema, pageRegistryApprovalSchema, type PageRegistryApproval, type ValidatedPageApprovals } from "./approvals";

const requestSchema = z.strictObject({ sourcePage: referenceSchema, customFields: z.array(customFieldReferenceSchema).max(100).default([]) });
type ApprovalRequest = z.input<typeof requestSchema>;
const refKey = (ref: { id: string; version: number }) => `${ref.id}@${ref.version}`;
const reference = ({ id, version, schemaHash, contractHash }: ContractMetadata): ContractReference => ({ id, version, schemaHash, contractHash });
const structural = (payload: ReturnType<typeof inspectSealedFieldVersion>["payload"]) => checksum({ ...payload, field: { ...payload.field, label: "", help: "" } });
function broken(): never { throw new Error("DEPENDENCY_BROKEN: a page field reference is unavailable or incompatible."); }

/** Server metadata reconstruction for both compilation and runtime. Values,
 * condition-input providers and canonical records are never read here. Missing
 * contribution grants are dealt with by staged runtime visibility, not by
 * replacing them with an author's grants stored in the compiled page. */
export async function reconstructPageApprovalsInTransaction(authority: FieldRuntimeAuthority, input: ApprovalRequest): Promise<ValidatedPageApprovals> {
  return reconstruct(authority, input, "ordinary_read");
}
/** Internal seal/compatibility metadata only for owning native validators. It
 * grants neither ordinary Read nor any query/value/record operation. */
export async function reconstructPageMetadataInTransaction(authority: FieldRuntimeAuthority, input: ApprovalRequest): Promise<ValidatedPageApprovals> {
  return reconstruct(authority, input, "metadata");
}
async function reconstruct(authority: FieldRuntimeAuthority, input: ApprovalRequest, mode: "ordinary_read" | "metadata"): Promise<ValidatedPageApprovals> {
  const request = requestSchema.parse(input), { session, transaction, registry } = authority;
  if (!sessionAuthorityStamp(session) || sessionAuthorityStamp(session) !== authority.stamp)
    throw new Error("Page approval requires genuine current authority.");
  const { metadata, source, policy } = await (mode === "metadata" ? registry.resolvePageSourceMetadata({ session, transaction }, request.sourcePage)
    : registry.resolvePageSourcePolicy({ session, transaction }, request.sourcePage));
  const refs = normaliseConfigurationReferences(request.customFields);
  if (refs.length !== request.customFields.length) throw new Error("Duplicate page field reference.");
  const approval = (ref: { id: string; version: number }, kind: PageRegistryApproval["kind"]) => {
    const contract = registry.describe(ref.id, ref.version);
    if (contract.kind !== kind || contract.ownerModuleId !== source.ownerModuleId) broken();
    return pageRegistryApprovalSchema.parse({ ...reference(contract), ownerModuleId: contract.ownerModuleId, kind: contract.kind,
      capability: contract.capability, classification: contract.classification });
  };
  const contracts = new Map<string, ReturnType<typeof pageRegistryApprovalSchema.parse>>();
  const addContract = (ref: { id: string; version: number }, kind: "entity" | "decisionFact") => {
    const value = approval(ref, kind);
    if (refKey(value) !== refKey(source)) contracts.set(refKey(value), value);
    return value;
  };
  const fields = entityDetailsSchema.parse(source.details).fields;
  const nativeFields = policy.nativeFields.map(native => {
    const field = fields.find(value => value.id === native.id); if (!field) broken();
    const column = policy.queries.find(query => refKey(query.query) === refKey(native.query))?.columns.find(column => column.id === native.columnId);
    return { id: field.id, classification: field.classification, ...(field.capability ? { capability: field.capability } : {}),
      ...(field.label ?? column?.label ? { label: field.label ?? column?.label } : {}), ...(column?.format ? { format: column.format } : {}),
      editable: false, query: reference(registry.describe(native.query.id, native.query.version)) };
  });
  const customFields: ValidatedPageApprovals["customFields"] = [];
  for (const pin of refs) {
    const version = await loadSealedConfigurationVersion(session, transaction, pin), sealed = inspectSealedFieldVersion(registry, version, session.organisationId, pin.definitionId), payload = sealed.payload;
    if (payload.entity.id !== source.id || !policy.fieldSourceVersions.includes(payload.entity.version)) broken();
    await assertFieldBinding(transaction, session, pin.definitionId, payload);
    const current = await transaction.studioDefinition.findFirst({ where: { id: pin.definitionId, organisationId: session.organisationId,
      kind: "customField", retiredAt: null }, select: { id: true, organisationId: true, key: true, activeVersionId: true, activeVersion: true } });
    if (!current?.activeVersion || current.id !== pin.definitionId || current.organisationId !== session.organisationId
      || current.activeVersionId !== current.activeVersion.id || current.key !== fieldDefinitionKey(payload)) broken();
    const active = inspectSealedFieldVersion(registry, current.activeVersion, session.organisationId, pin.definitionId);
    if (active.schemaVersion !== sealed.schemaVersion || structural(active.payload) !== structural(payload)) broken();
    await assertFieldBinding(transaction, session, pin.definitionId, active.payload);
    addContract(payload.entity, "entity");
    customFields.push({ reference: customFieldReferenceSchema.parse(pin), entity: payload.entity, classification: payload.field.classification,
      ...(payload.field.readCapability ? { readCapability: payload.field.readCapability } : {}),
      ...(payload.field.writeCapability ? { writeCapability: payload.field.writeCapability } : {}), editable: true, required: payload.field.required });
  }
  const facts = policy.facts.map(fact => {
    addContract(fact.contract, fact.contract.id === source.id ? "entity" : "decisionFact");
    return { id: fact.id, contract: reference(registry.describe(fact.contract.id, fact.contract.version)),
      query: reference(registry.describe(fact.query.id, fact.query.version)), sourceEntityId: source.id, valueType: fact.valueType,
      nullable: fact.nullable, classification: fact.classification, ...(fact.capability ? { capability: fact.capability } : {}), provenance: fact.provenance };
  });
  const result = {
    entity: approval(source, "entity"), sourcePage: approval(metadata, "surface"), variants: policy.variants, fieldSourceVersions: policy.fieldSourceVersions,
    ...(customFields.length && entityDetailsSchema.parse(source.details).record?.writeCapability
      ? { recordWriteCapability: entityDetailsSchema.parse(source.details).record!.writeCapability } : {}),
    nativeFields, customFields, facts, contracts: [...contracts.values()].sort((a, b) => refKey(a) < refKey(b) ? -1 : refKey(a) > refKey(b) ? 1 : 0),
    queries: policy.queries.map(query => { const metadata = registry.describe(query.query.id, query.query.version);
      return { ...approval(query.query, "query"), kind: "query" as const, sourceEntityId: source.id, purpose: query.purpose,
        pagination: metadata.details.pagination, maxCardinality: metadata.details.maxCardinality, costClass: metadata.details.costClass,
        columns: query.columns.map(({ id, classification, capability, label, format }) => ({ id, classification, ...(capability ? { capability } : {}),
          ...(label ? { label } : {}), ...(format ? { format } : {}) })) }; }),
    commands: policy.commands.map(command => ({ ...approval(command.command, "command"), kind: "command" as const, sourceEntityId: source.id,
      confirmation: command.confirmation, previewQuery: command.previewQuery ? reference(registry.describe(command.previewQuery.id, command.previewQuery.version)) : null, formFactors: command.formFactors })),
    metrics: policy.metrics.map(metric => ({ ...approval(metric.metric, "metric"), kind: "metric" as const, sourceEntityId: source.id,
      query: reference(registry.describe(metric.query.id, metric.query.version)), formFactors: metric.formFactors })),
    surfaces: policy.surfaces.map(surface => ({ ...approval(surface.surface, "surface"), kind: "surface" as const, sourceEntityId: source.id,
      family: surface.family, queries: surface.queries.map(ref => reference(registry.describe(ref.id, ref.version))), formFactors: surface.formFactors })),
    maxQueryCost: policy.maxQueryCost,
  };
  return pageApprovalsSchema.parse(result);
}

/** Authoring uses current grants; native values, references and conditional
 * inputs remain unread. The caller passes only the fields selected in its draft.
 * Runtime instead reconstructs then filters/schedules each visible contribution. */
export async function buildPageApprovalsInTransaction(authority: FieldRuntimeAuthority, input: ApprovalRequest) {
  const result = await reconstructPageApprovalsInTransaction(authority, input), { session, registry, transaction } = authority;
  for (const contract of [result.entity, result.sourcePage, ...result.contracts, ...result.queries, ...result.commands, ...result.metrics, ...result.surfaces])
    await registry.resolve(session, contract);
  for (const capability of [
    ...result.nativeFields.map(field => field.capability), ...result.facts.map(fact => fact.capability),
    ...result.queries.flatMap(query => query.columns.map(column => column.capability)),
  ]) if (capability) assertCapability(session, capability);
  for (const field of result.customFields) {
    const version = await loadSealedConfigurationVersion(session, transaction, field.reference);
    const payload = inspectSealedFieldVersion(registry, version, session.organisationId, field.reference.definitionId).payload;
    await compileCustomFieldForRead(session, { schemaVersion: 1, entity: payload.entity, storageGeneration: payload.storageGeneration, field: payload.field }, registry);
  }
  return result;
}
