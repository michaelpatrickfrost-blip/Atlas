import type { FieldRuntimeAuthority } from "../fields/runtime-authority";
import { assertCapability } from "@/core/permissions/check";
import { checksum } from "../registry/contracts";
import type { ConfigurationReference } from "../record-types";
import { compilePage, type CompiledPagePlan } from "./compiler";
import { pagePayloadSchema, type PageComponent } from "./schema";
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
  const source = authority.registry.describePageSourceForEntity(payload.entity);
  const metadata = source.metadata;
  const sourcePage = { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash };
  const approvals = await reconstructPageApprovalsInTransaction(authority, { sourcePage, customFields: authoredPageFieldPins(payload) });
  const plan = compilePage(payload, approvals);
  pageReadScope(plan, source.policy);
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
