import type { FieldRuntimeAuthority } from "../fields/runtime-authority";
import { assertCapability } from "@/core/permissions/check";
import { checksum } from "../registry/contracts";
import { inspectSealedViewForReadInTransaction } from "../views/runtime";
import type { ViewVersionReference } from "../views/schema";
import type { ConfigurationReference } from "../record-types";
import { compilePage, type CompiledPagePlan } from "./compiler";
import { pagePayloadSchema, type PageComponent } from "./schema";
import { inspectConfigurationPin, type SealedConfigurationVersion } from "../configuration/pins";
import { pageApprovalsSchema } from "./approvals";
import { sessionAuthorityStamp } from "@/core/auth/session";
import { isStudioRuntimeFeatureEnabled, STUDIO_TICKET_PANEL_FEATURE, STUDIO_SALES_PAGE_METRIC_FEATURE, STUDIO_PAGE_EMBEDDED_VIEW_FEATURE } from "../runtime-features";
import type { ContractReference } from "../registry/types";
import { z } from "zod";
import { assertRecordTypeMetadataSelectorsInTransaction } from "../record-types/selection";
import type { VisibilityPredicate } from "./schema";
import { reconstructPageApprovalsInTransaction } from "./server-approvals";
import type { PageSourcePolicy } from "./owner-contract";

/** Gather only actual authored extension pins, including inserted variant nodes.
 * No browser-supplied approval catalogue or live field values enter publication. */
export function authoredPageFieldPins(input: unknown) {
  const page = pagePayloadSchema.parse(input), pins = new Map<string, Extract<ConfigurationReference, { kind: "customField" }>>();
  const component = (value: PageComponent) => {
    if (value.type !== "fields") return;
    for (const field of value.fields) if (field.source === "extension") {
      const previous = pins.get(field.reference.definitionId);
      if (previous && checksum(previous) !== checksum(field.reference)) throw new Error("A screen cannot use competing versions of the same additional field.");
      pins.set(field.reference.definitionId, field.reference);
    }
  };
  page.sections.forEach(section => section.components.forEach(component));
  for (const variant of page.variants) for (const patch of variant.patches) {
    if (patch.operation === "addSection") patch.section.components.forEach(component);
    if (patch.operation === "addComponent") component(patch.component);
  }
  return [...pins.values()].sort((left, right) => left.definitionId.localeCompare(right.definitionId));
}
/** Collect exact authored View pins, including inserted shallow variants. */
export function authoredPageViewPins(input: unknown): ViewVersionReference[] {
  const page = pagePayloadSchema.parse(input), pins = new Map<string, ViewVersionReference>();
  const add = (component: PageComponent) => {
    if (component.type !== "analyticsView") return;
    const prior = pins.get(component.view.definitionId);
    if (prior && checksum(prior) !== checksum(component.view)) throw new Error("A screen cannot use competing versions of the same analytics view.");
    pins.set(component.view.definitionId, component.view);
  };
  page.sections.forEach(section => section.components.forEach(add));
  for (const variant of page.variants) for (const patch of variant.patches) {
    if (patch.operation === "addSection") patch.section.components.forEach(add);
    if (patch.operation === "addComponent") add(patch.component);
  }
  if (pins.size > 4) throw new Error("A screen exceeds its embedded view bound.");
  return [...pins.values()].sort((a, b) => a.definitionId.localeCompare(b.definitionId));
}
export type CompiledPageDefinition = { payload: CompiledPagePlan["payload"]; plan: CompiledPagePlan; checksum: string; warnings: string[] };

/** Current adapters approve separate list and canonical-record read contexts.
 * Do not offer/save a page that needs both through a single owning anchor. */
export function pageReadScope(plan: Pick<CompiledPagePlan, "dependencies">, policy: Pick<PageSourcePolicy, "queries">): "list" | "record" {
  const scopes = new Set(policy.queries.filter(query => plan.dependencies.some(dependency => dependency.id === query.query.id
    && dependency.version === query.query.version)).map(query => query.scope));
  if (scopes.size > 1) throw new Error("Choose a list layout or a record layout. This app does not support mixing those details on one screen.");
  return scopes.has("list") ? "list" : "record";
}

/** The original publisher calls this in its genuine authoring transaction. Only
 * used contribution grants are required; unused palette entries grant nothing. */
export async function compileStructuredPage(authority: FieldRuntimeAuthority, input: unknown): Promise<CompiledPageDefinition> {
  const payload = pagePayloadSchema.parse(input);
  const source = resolveAuthoringPageSource(authority, payload.entity);
  await assertRecordTypeMetadataSelectorsInTransaction(authority, payload.entity, authoredPageRecordTypeSelectors(payload));
  return compileAgainstSource(authority, payload, source, true);
}

/** Authoring alone can select an independently approved retained source while
 * its exact additive family lacks paired-reader evidence. Stored @3 seals always
 * reconstruct @3 and never fall back to an older policy or an active View head. */
export function resolveAuthoringPageSource(authority: FieldRuntimeAuthority, entity: ContractReference) {
  const latest = authority.registry.describePageSourceForEntity(entity);
  const family = latest.metadata.id === "tickets.ticket.page" ? STUDIO_TICKET_PANEL_FEATURE
    : latest.metadata.id === "sales.order.page" ? STUDIO_SALES_PAGE_METRIC_FEATURE : null;
  if (!family) return latest;
  let version = latest.metadata.version;
  if (version === 3 && !isStudioRuntimeFeatureEnabled(STUDIO_PAGE_EMBEDDED_VIEW_FEATURE)) version = 2;
  if ((version === 2 || version === 3) && !isStudioRuntimeFeatureEnabled(family)) version = 1;
  if (version === latest.metadata.version) return latest;
  const retained = authority.registry.describe(latest.metadata.id, version);
  return authority.registry.describePageSource({ id: retained.id, version: retained.version, schemaHash: retained.schemaHash, contractHash: retained.contractHash });
}
const retainedFrame = z.object({ kind: z.literal("page"), schemaVersion: z.literal(1), approvals: pageApprovalsSchema });
/** Trusted server-loaded sealed version only. Reconstruct the EXACT stored Page
 * owner approval instead of recompiling against a newly registered source. Current
 * native/used field/query grants still apply; no client approval pin or queries. */
export async function compileRetainedStructuredPage(authority: FieldRuntimeAuthority, version: SealedConfigurationVersion): Promise<CompiledPageDefinition> {
  if (!sessionAuthorityStamp(authority.session) || sessionAuthorityStamp(authority.session) !== authority.stamp)
    throw new Error("FORBIDDEN: genuine retained Page authority is required.");
  inspectConfigurationPin(authority.session.organisationId, { kind: "page", definitionId: version.definitionId, versionId: version.id,
    schemaVersion: version.schemaVersion, checksum: version.checksum }, version);
  const stored = retainedFrame.parse(version.compiledPlan).approvals.sourcePage;
  const source = authority.registry.describePageSource({ id: stored.id, version: stored.version, schemaHash: stored.schemaHash, contractHash: stored.contractHash });
  const compiled = await compileAgainstSource(authority, pagePayloadSchema.parse(version.payload), source);
  if (compiled.checksum !== version.checksum) throw new Error("DEPENDENCY_BROKEN: the retained Page is incompatible.");
  return compiled;
}
async function compileAgainstSource(authority: FieldRuntimeAuthority, payload: ReturnType<typeof pagePayloadSchema.parse>,
  source: ReturnType<FieldRuntimeAuthority["registry"]["describePageSource"]>, newlyAuthored = false): Promise<CompiledPageDefinition> {
  const metadata = source.metadata;
  const sourcePage = { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash };
  const approvals = await reconstructPageApprovalsInTransaction(authority, { sourcePage, customFields: authoredPageFieldPins(payload), embeddedViews: authoredPageViewPins(payload) });
  const plan = compilePage(payload, approvals);
  const scope = pageReadScope(plan, source.policy);
  if (newlyAuthored && scope === "list" && authoredPageRecordTypeSelectors(payload).length)
    throw new Error("Business record-type conditions require a record screen.");
  for (const view of plan.approvals.embeddedViews ?? [])
    await inspectSealedViewForReadInTransaction(authority, view.reference, view.sourceView.id);
  for (const reference of plan.dependencies) await authority.registry.resolve(authority.session, reference);
  const usedFields = [plan.base, ...plan.variants.map(variant => variant.layout)].flatMap(layout => layout.sections).flatMap(section => section.components)
    .filter(component => component.type === "fields").flatMap(component => component.fields);
  // The pure compiler validates native/extension policies in every materialised
  // variant; current publication still checks each used projection capability.
  for (const query of approvals.queries.filter(query => plan.dependencies.some(dependency => dependency.id === query.id && dependency.version === query.version)))
    for (const column of query.columns) if (column.capability && !authority.session.capabilities.has(column.capability))
      throw new Error("FORBIDDEN: an authored screen projection is unavailable.");
  for (const field of usedFields) {
    if (field.source === "native") {
      const approval = approvals.nativeFields.find(value => value.id === field.fieldId);
      if (approval?.capability) assertCapability(authority.session, approval.capability);
      if (field.mode === "edit" && approval?.writeCapability) assertCapability(authority.session, approval.writeCapability);
    } else {
      const approval = approvals.customFields.find(value => value.reference.definitionId === field.reference.definitionId);
      if (approval?.readCapability) assertCapability(authority.session, approval.readCapability);
      if (field.mode === "edit" && approval?.writeCapability) assertCapability(authority.session, approval.writeCapability);
    }
  }
  return { payload: plan.payload, plan, checksum: checksum(plan), warnings: plan.warnings };
}


/** Stable logical selectors are not immutable version edges. Collect the full
 * authored envelope, including inserted/overridden variant visibility; no
 * client record-type hint is ever used by the live runtime. */
export function authoredPageRecordTypeSelectors(input: unknown) {
  const page = pagePayloadSchema.parse(input), ids = new Set<string>();
  const predicate = (value: VisibilityPredicate | null | undefined) => {
    if (!value) return;
    if (value.kind === "recordType") ids.add(value.definitionId);
    else if (value.kind === "all" || value.kind === "any") value.predicates.forEach(predicate);
  };
  const component = (value: PageComponent) => predicate(value.visibleWhen);
  const section = (value: typeof page.sections[number]) => { predicate(value.visibleWhen); value.components.forEach(component); };
  page.sections.forEach(section);
  for (const variant of page.variants) {
    predicate(variant.when);
    for (const patch of variant.patches) {
      if (patch.operation === "addSection") section(patch.section);
      else if (patch.operation === "addComponent") component(patch.component);
      else if (patch.operation === "setSection" || patch.operation === "setComponent") predicate(patch.properties.visibleWhen);
    }
  }
  if (ids.size > 100) throw new Error("A screen exceeds its approved business-type condition limit.");
  return [...ids].sort();
}
