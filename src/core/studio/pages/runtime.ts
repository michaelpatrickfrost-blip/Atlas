import { z } from "zod";
import { prepareVisibleEmbeddedViews, readPreparedEmbeddedViews } from "./embedded-views";
import type { Session } from "@/core/auth/session";
import { sessionAuthorityStamp } from "@/core/auth/session";
import { loadSealedConfigurationVersion } from "../configuration/pins";
import { resolveRecordProfileInTransaction } from "../record-types/runtime-profile";
import { pageReferenceSchema } from "../record-types/schema";
import { checksum } from "../registry/contracts";
import type { ContractReference } from "../registry/types";
import { entityDetailsSchema } from "../registry/entities";
import { withFieldRuntimeAuthority, type FieldRuntimeAuthority } from "../fields/runtime-authority";
import { readVersionedFieldContextInTransaction, readVersionedFieldPlanInTransaction, readVersionedFieldValueInTransaction } from "../fields/runtime-read";
import type { FieldValue } from "../fields/schema";
import { compileStructuredPage } from "./definition-compiler";
import { samePageReference, type CompiledPagePlan } from "./compiler";
import { getCompiledPage } from "./compiled-cache";
import { pageApprovalsSchema } from "./approvals";
import { formFactorSchema, pageNodeIdSchema, pageScalarSchema, pagePayloadSchema, type PageScalar } from "./schema";
import { pageReadRequestSchema, pageQueryRequestSchema, type PageQueryOutput } from "./owner-contract";
import { reconstructPageApprovalsInTransaction } from "./server-approvals";
import { pageVisibilityFactRequests, resolvePageVariant } from "./selection";
import { createPageDisplayModel, pageQueryKey } from "./render-model";

const requestSchema = z.strictObject({ page: pageReferenceSchema, request: pageReadRequestSchema, formFactor: formFactorSchema,
  cursors: z.record(pageNodeIdSchema, pageQueryRequestSchema.shape.cursor).refine(value => Object.keys(value).length <= 100, "Too many page cursors.").default({}) });
const draftRequestSchema = requestSchema.omit({ page: true }).extend({ payload: pagePayloadSchema });
const storedFrame = z.object({ kind: z.literal("page"), schemaVersion: z.literal(1), approvals: pageApprovalsSchema });
const exactRef = ({ id, version, schemaHash, contractHash }: ContractReference): ContractReference => ({ id, version, schemaHash, contractHash });
function broken(): never { throw new Error("DEPENDENCY_BROKEN: the published page is unavailable or incompatible."); }

/** Fresh ordinary customer runtime; no authoring grant, caller organisation,
 * record-type assertion, condition facts or command execution input. */
export async function readPublishedPage(authenticated: Session, input: unknown) {
  const request = requestSchema.parse(input);
  return withFieldRuntimeAuthority(authenticated, authority => readPublishedPageInTransaction(authority, request));
}

/** Internal same-authority entry for audited Studio previews. Its owning caller
 * supplies genuine refreshed target authority, never a copied Session DTO. */
export async function readPublishedPageInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  const request = requestSchema.parse(input), { session, transaction } = authority;
  if (!sessionAuthorityStamp(session) || sessionAuthorityStamp(session) !== authority.stamp) broken();
  const version = await loadSealedConfigurationVersion(session, transaction, request.page), stored = storedFrame.parse(version.compiledPlan);
  const approvals = await reconstructPageApprovalsInTransaction(authority, { sourcePage: exactRef(stored.approvals.sourcePage),
    customFields: stored.approvals.customFields.map(field => field.reference),
    ...(stored.approvals.embeddedViews ? { embeddedViews: stored.approvals.embeddedViews.map(view => view.reference) } : {}) });
  const plan = getCompiledPage({ organisationId: session.organisationId, versionId: version.id,
    checksum: version.checksum, payload: version.payload, approvals });
  return readPlanInTransaction(authority, plan, request);
}

/** Actual draft preview for a genuine audited authoring target authority. The
 * existing server compiler reconstructs its own approvals and used permissions;
 * raw client approval bodies cannot enter this gateway. No command is executed. */
export async function readDraftPageInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  const request = draftRequestSchema.parse(input);
  if (!sessionAuthorityStamp(authority.session) || sessionAuthorityStamp(authority.session) !== authority.stamp) broken();
  const compiled = await compileStructuredPage(authority, request.payload);
  return readPlanInTransaction(authority, compiled.plan, request);
}

async function readPlanInTransaction(authority: FieldRuntimeAuthority, plan: CompiledPagePlan,
  request: Pick<z.infer<typeof requestSchema>, "request" | "formFactor" | "cursors">) {
  const { session, transaction, registry } = authority;
  const source = await registry.authorisePageRead({ session, transaction }, plan.approvals.sourcePage, request.request);
  const details = entityDetailsSchema.parse(source.source.details);
  let recordTypeDefinitionId: string | null = null;
  if (details.extensionPolicy.recordTypes && source.anchor.kind === "record") {
    if (source.anchor.nativeRevision === undefined) broken();
    const resolved = await resolveRecordProfileInTransaction(authority, { entity: exactRef(source.source), recordId: source.anchor.recordId,
      expectedRevision: source.anchor.nativeRevision }, { kind: "ordinary" });
    recordTypeDefinitionId = resolved.recordType?.definitionId ?? null;
  }
  const facts = new Map<string, PageScalar>(), outputs = new Map<string, PageQueryOutput>(), attempted = new Set<string>();
  const context = { capabilities: session.capabilities, recordTypeDefinitionId, facts };
  let cost = 0, queryCount = 0;
  const load = async (query: CompiledPagePlan["approvals"]["queries"][number], pageSize: number, cursor: z.infer<typeof pageQueryRequestSchema>["cursor"]) => {
    const key = pageQueryKey(query), cacheKey = `${key}:${pageSize}:${JSON.stringify(cursor)}`;
    if (attempted.has(cacheKey)) return outputs.get(cacheKey);
    attempted.add(cacheKey);
    queryCount++;
    cost += ({ low: 1, medium: 3, high: 8 } as const)[query.costClass];
    if (cost > plan.approvals.maxQueryCost) throw new Error("Page read budget exceeded.");
    const result = await registry.invokePageRead({ session, transaction }, plan.approvals.sourcePage, request.request,
      { query: { id: query.id, version: query.version }, pageSize, cursor });
    if (checksum(result.anchor) !== checksum(source.anchor)) throw new Error("CONFLICT: the native page record changed. Refresh.");
    outputs.set(cacheKey, result.output); outputs.set(key, result.output);
    for (const fact of plan.approvals.facts.filter(fact => samePageReference(fact.query, query))) {
      const approved = source.policy.facts.find(value => value.id === fact.id); if (!approved) broken();
      const value = result.output.rows[0]?.values[approved.columnId];
      if (value !== undefined) facts.set(fact.id, pageScalarSchema.parse(value));
    }
    return result.output;
  };
  for (const stage of ["variants", "components"] as const) {
    for (let iteration = 0; iteration <= plan.approvals.facts.length; iteration++) {
      const pending = pageVisibilityFactRequests(plan, context, request.formFactor, stage);
      const newQueries = pending.queries.filter(query => !attempted.has(`${pageQueryKey(query)}:1:null`));
      if (!newQueries.length) break;
      for (const ref of newQueries) { const query = plan.approvals.queries.find(query => samePageReference(query, ref)); if (!query) broken(); await load(query, 1, null); }
    }
  }
  const layout = resolvePageVariant(plan, context, request.formFactor), componentOutputs = new Map<string, PageQueryOutput>();
  const visibleIds = new Set(layout.sections.flatMap(section => section.components.filter(component => component.type === "queryList").map(component => component.id)));
  if (Object.keys(request.cursors).some(id => !visibleIds.has(id))) throw new Error("Invalid page cursor target.");
  const embedded = await prepareVisibleEmbeddedViews(authority, layout.sections.flatMap(section => section.components), plan.approvals);
  // Reserve every actual visible nested request before any nested provider and
  // account for remaining Page queries (including differing list cursors).
  const pendingQueries = new Map<string, CompiledPagePlan["approvals"]["queries"][number]>();
  for (const read of layout.reads) {
    const component = layout.sections.flatMap(section => section.components).find(value => value.id === read.componentId)!;
    for (const ref of read.queries) {
      const query = plan.approvals.queries.find(value => samePageReference(value, ref)); if (!query) broken();
      const size = component.type === "queryList" ? component.pageSize : Math.min(query.maxCardinality, 50);
      const cursor = component.type === "queryList" ? request.cursors[component.id] ?? null : null;
      const key = `${pageQueryKey(query)}:${size}:${JSON.stringify(cursor)}`;
      if (!attempted.has(key)) pendingQueries.set(key, query);
    }
  }
  if (embedded.prepared.length && (queryCount + pendingQueries.size + embedded.queryCount > 32
    || cost + [...pendingQueries.values()].reduce((sum, query) => sum + ({ low: 1, medium: 3, high: 8 } as const)[query.costClass], 0) + embedded.queryCost > plan.approvals.maxQueryCost))
    throw new Error("Page read budget exceeded.");
  cost += embedded.queryCost; queryCount += embedded.queryCount;
  const embeddedOutputs = await readPreparedEmbeddedViews(authority, embedded.prepared);
  for (const read of layout.reads) {
    const component = layout.sections.flatMap(section => section.components).find(component => component.id === read.componentId)!;
    for (const ref of read.queries) { const query = plan.approvals.queries.find(query => samePageReference(query, ref)); if (!query) broken();
      const output = await load(query, component.type === "queryList" ? component.pageSize : Math.min(query.maxCardinality, 50), component.type === "queryList" ? request.cursors[component.id] ?? null : null);
      if (component.type === "queryList" && output) componentOutputs.set(component.id, output); }
  }
  const native = new Map<string, { value: PageScalar | undefined; values: Record<string, PageScalar> }>();
  for (const field of plan.approvals.nativeFields) {
    const approved = source.policy.nativeFields.find(value => value.id === field.id); if (!approved) broken();
    const row = outputs.get(pageQueryKey(field.query))?.rows[0]; if (row) native.set(field.id, { value: row.values[approved.columnId], values: row.values });
  }
  const fields = new Map<string, { label: string; value: FieldValue | null }>();
  for (const component of layout.sections.flatMap(section => section.components)) if (component.type === "fields") for (const field of component.fields) {
    if (field.source !== "extension" || fields.has(field.reference.definitionId)) continue;
    if (source.anchor.kind !== "record" || source.anchor.nativeRevision === undefined) broken();
    const current = await readVersionedFieldContextInTransaction(authority, { definitionId: field.reference.definitionId,
      recordId: source.anchor.recordId, expectedRevision: source.anchor.nativeRevision });
    const slot = current.extension && await transaction.studioFieldSlot.findFirst({ where: { organisationId: session.organisationId,
      extensionId: current.extension.id, definitionId: current.definition.id, generationId: current.payload.storageGeneration },
      select: { id: true, organisationId: true, extensionId: true, definitionId: true, generationId: true, activeValueId: true, activeValue: { select: { id: true, organisationId: true, definitionId: true, generationId: true,
        slotId: true, versionId: true, revision: true, valueType: true, schemaVersion: true } } } });
    if (slot && (slot.organisationId !== session.organisationId || slot.extensionId !== current.extension!.id || slot.definitionId !== current.definition.id
      || slot.generationId !== current.payload.storageGeneration || ((slot.activeValueId === null) !== (slot.activeValue === null)))) broken();
    let value: FieldValue | null = null;
    if (slot?.activeValue) {
      const written = slot.activeValue;
      if (written.id !== slot.activeValueId || written.organisationId !== session.organisationId || written.definitionId !== current.definition.id
        || written.generationId !== current.payload.storageGeneration || written.slotId !== slot.id || written.versionId !== written.schemaVersion.id
        || !Number.isSafeInteger(written.revision) || written.revision < 1) broken();
      const policy = await readVersionedFieldPlanInTransaction(authority, written.schemaVersion, current.definition.id);
      if (policy.entity.id !== current.payload.entity.id || policy.field.key !== current.payload.field.key || policy.storageGeneration !== current.payload.storageGeneration
        || policy.field.storage.type !== written.valueType) broken();
      await registry.authoriseRecord({ session, transaction }, policy.entity, { recordId: source.anchor.recordId, intent: "read" });
      // Current and written metadata/native/reference policies are preflighted
      // above, before fetching any typed value columns.
      const row = await transaction.studioFieldValue.findFirst({ where: { id: written.id, organisationId: session.organisationId,
        definitionId: written.definitionId, generationId: written.generationId, slotId: slot.id, versionId: written.versionId }, include: { schemaVersion: true } });
      if (!row) broken();
      value = await readVersionedFieldValueInTransaction(authority, current.payload, current.definition.id, current.payload.storageGeneration,
        slot.id, source.anchor.recordId, row);
    }
    fields.set(current.definition.id, { label: current.payload.field.label, value });
  }
  const model = createPageDisplayModel(plan, layout, request.formFactor, outputs, native, facts, fields, componentOutputs, embeddedOutputs);
  for (const section of model.sections) for (const component of section.components) if (component.type === "queryList") {
    const authored = layout.sections.flatMap(section => section.components).find(value => value.id === component.id);
    component.recordNavigation = authored?.type === "queryList" && source.policy.queries.some(query => query.scope === "list"
      && query.purpose === "list" && query.query.id === authored.query.id && query.query.version === authored.query.version);
  }
  return model;
}
