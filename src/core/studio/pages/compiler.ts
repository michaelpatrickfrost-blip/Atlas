import { checksum as checksumPin } from "../registry/contracts";
import { applyPagePatches } from "./patches";
import type { z } from "zod";
import { referenceSchema } from "../compiler/reference";
import { normaliseConfigurationDependencyReferences, type ConfigurationDependencyReference } from "../configuration/dependency-reference";
import { pageApprovalsSchema, type PageApprovals, type PageRegistryApproval, type PageRegistryDependency, type ValidatedPageApprovals } from "./approvals";
import { pagePayloadSchema, pageSectionSchema, type PagePayload, type PageSection, type VisibilityPredicate } from "./schema";

export type PageRegistryReference = z.infer<typeof referenceSchema>;
export type PageReadRequest = { componentId: string; queries: PageRegistryReference[] };
export type CompiledPageLayout = { sections: PageSection[]; reads: PageReadRequest[]; visibilityFacts: string[]; queryCost: number; queryCount?: number };
export type CompiledPagePlan = {
  kind: "page"; schemaVersion: 1; accessMode: "ordinary_read"; payload: PagePayload; base: CompiledPageLayout;
  variants: { id: string; priority: number; when: VisibilityPredicate; layout: CompiledPageLayout }[];
  dependencies: PageRegistryDependency[]; configurationDependencies: ConfigurationDependencyReference[];
  /** Metadata only: runtime checks current permissions before fetching these facts. */
  approvals: ValidatedPageApprovals;
  warnings: string[];
};
const compare = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;
export const samePageReference = (left: PageRegistryReference, right: PageRegistryReference) =>
  left.id === right.id && left.version === right.version && left.schemaHash === right.schemaHash && left.contractHash === right.contractHash;
const refKey = (ref: PageRegistryReference) => `${ref.id}@${ref.version}`;

function assertUnique(values: readonly string[], description: string) {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${description}.`);
}
function assertLayout(sections: readonly PageSection[], forms: PagePayload["formFactors"]) {
  if (sections.length < 1 || sections.length > 20 || sections.reduce((sum, section) => sum + section.components.length, 0) > 100)
    throw new Error("Page exceeds its section/component budget.");
  const ids: string[] = [];
  for (const section of sections) {
    pageSectionSchema.parse(section);
    ids.push(section.id, ...section.components.map(component => component.id));
    if (section.formFactors.some(form => !forms.includes(form))) throw new Error("Section form factor is not enabled on this page.");
    for (const component of section.components)
      if (component.formFactors.some(form => !section.formFactors.includes(form))) throw new Error("Component form factor is not enabled on its section.");
  }
  assertUnique(ids, "page node ID");
  for (const form of forms) {
    // An unconditional useful anchor protects against an entirely hidden page.
    if (!sections.some(section => section.formFactors.includes(form) && !section.visibleWhen &&
      section.components.some(component => component.formFactors.includes(form) && !component.visibleWhen && component.type !== "action")))
      throw new Error(`Page requires an unconditional usable ${form} representation.`);
  }
}



/** Pure compiler. Supplied approvals are trusted only as server-loaded metadata;
 * this function neither authenticates them nor queries/invokes their providers. */
export function compilePage(input: unknown, suppliedApprovals: PageApprovals): CompiledPagePlan {
  const payload = pagePayloadSchema.parse(input), approvals = pageApprovalsSchema.parse(suppliedApprovals);
  if (!samePageReference(payload.entity, approvals.entity)) throw new Error("Page requires the exact approved entity contract.");
  if (approvals.sourcePage.ownerModuleId !== approvals.entity.ownerModuleId || approvals.sourcePage.capability !== approvals.entity.capability)
    throw new Error("Page source must preserve its native read owner and capability.");
  if (payload.variants.length && !approvals.variants) throw new Error("Page variants are not approved by this owner.");
  if (!payload.formFactors.includes("phone")) throw new Error("Page requires a phone representation.");
  assertUnique(payload.variants.map(variant => variant.id), "page variant ID");
  assertUnique(payload.variants.map(variant => String(variant.priority)), "page variant priority");
  payload.variants.sort((left, right) => right.priority - left.priority);
  assertUnique(approvals.nativeFields.map(field => field.id), "approved native field");
  assertUnique(approvals.customFields.map(field => field.reference.definitionId), "approved extension field");
  assertUnique(approvals.facts.map(fact => fact.id), "approved fact");
  approvals.queries.forEach(query => assertUnique(query.columns.map(column => column.id), "approved query column"));
  const contracts = new Map<string, PageRegistryApproval>();
  for (const contract of [approvals.entity, approvals.sourcePage, ...approvals.contracts, ...approvals.queries, ...approvals.commands, ...approvals.metrics, ...approvals.surfaces]) {
    const previous = contracts.get(refKey(contract));
    if (previous) throw new Error("Duplicate approved registry contract.");
    contracts.set(refKey(contract), contract);
  }
  for (const values of [approvals.queries, approvals.commands, approvals.metrics, approvals.surfaces]) assertUnique(values.map(refKey), "typed contract approval");
  assertUnique((approvals.embeddedViews ?? []).map(value => value.reference.definitionId), "approved analytics view");
  const embeddedUsed = new Set<string>();
  const dependencies = new Map<string, PageRegistryDependency>(), fields: ConfigurationDependencyReference[] = [], warnings = new Set<string>();
  const nativeUsed = new Set<string>(), factsReferenced = new Set<string>();
  const resolve = (ref: PageRegistryReference, kinds: readonly PageRegistryApproval["kind"][]) => {
    const approved = contracts.get(refKey(ref));
    if (!approved || !samePageReference(ref, approved) || !kinds.includes(approved.kind)) throw new Error("Unsupported or incompatible page reference.");
    const { id, version, schemaHash, contractHash, ownerModuleId, kind, classification } = approved;
    const dependency = { id, version, schemaHash, contractHash, ownerModuleId, kind, classification };
    dependencies.set(refKey(ref), dependency);
    return approved;
  };
  resolve(payload.entity, ["entity"]);
  resolve(approvals.sourcePage, ["surface"]);
  const query = (ref: PageRegistryReference, purpose: ValidatedPageApprovals["queries"][number]["purpose"]) => {
    resolve(ref, ["query"]);
    const approved = approvals.queries.find(value => samePageReference(value, ref));
    if (!approved || approved.purpose !== purpose || approved.sourceEntityId !== payload.entity.id) throw new Error("Query is not approved for this page purpose/entity.");
    return approved;
  };
  const fact = (id: string) => {
    const approved = approvals.facts.find(value => value.id === id);
    if (!approved || approved.sourceEntityId !== payload.entity.id) throw new Error("Fact is not approved for this entity.");
    resolve(approved.contract, ["entity", "decisionFact"]);
    const read = query(approved.query, "fact");
    if (read.maxCardinality !== 1 || read.pagination !== "none") throw new Error("Page facts require a single owner projection.");
    factsReferenced.add(id);
    return approved;
  };
  const predicateFacts = (condition: VisibilityPredicate, target: Set<string>, nodes = { count: 0 }) => {
    if (++nodes.count > 64) throw new Error("Visibility predicate exceeds its node budget.");
    if (condition.kind === "all" || condition.kind === "any") condition.predicates.forEach(value => predicateFacts(value, target, nodes));
    else if (condition.kind === "fact") {
      const approved = fact(condition.factId); target.add(condition.factId);
      if (condition.values.some(value => value === null ? !approved.nullable : typeof value !== approved.valueType)) throw new Error("Fact comparison type does not match its approved scalar.");
    }
  };
  const cost = { low: 1, medium: 3, high: 8 } as const;
  const readCost = (ref: PageRegistryReference) => {
    const approved = approvals.queries.find(value => samePageReference(value, ref));
    if (!approved) throw new Error("Read schedule lost its approved query metadata.");
    return cost[approved.costClass];
  };
  const layout = (sections: PageSection[], variantFacts: Set<string>): CompiledPageLayout => {
    assertLayout(sections, payload.formFactors);
    const factsUsed = new Set(variantFacts), reads: PageReadRequest[] = [];
    let queryCost = 0, queryCount = 0, hasEmbeddedView = false;
    for (const section of sections) {
      if (section.visibleWhen) predicateFacts(section.visibleWhen, factsUsed);
      for (const component of section.components) {
        if (component.visibleWhen) predicateFacts(component.visibleWhen, factsUsed);
        const queries: PageRegistryReference[] = [];
        if (component.type === "fields") {
          assertUnique(component.fields.map(value => value.source === "native" ? `native:${value.fieldId}` : `extension:${value.reference.definitionId}`), "component field selection");
          for (const selected of component.fields) {
            const approved = selected.source === "native" ? approvals.nativeFields.find(value => value.id === selected.fieldId) : approvals.customFields.find(value =>
              value.reference.definitionId === selected.reference.definitionId && value.reference.versionId === selected.reference.versionId && value.reference.schemaVersion === selected.reference.schemaVersion && value.reference.checksum === selected.reference.checksum);
            if (!approved || (selected.mode === "edit" && (!approved.editable || !approvals.recordWriteCapability))) throw new Error("Field presentation is not approved by its owner.");
            if (selected.source === "native") {
              nativeUsed.add(selected.fieldId);
              const native = approvals.nativeFields.find(value => value.id === selected.fieldId)!;
              const projection = query(native.query, "fact");
              if (projection.maxCardinality !== 1 || projection.pagination !== "none") throw new Error("Native fields require a single owner projection.");
              queries.push(native.query);
            }
            if (selected.source === "extension") {
              const extension = approvals.customFields.find(value => value.reference.definitionId === selected.reference.definitionId);
              if (!extension || extension.entity.id !== payload.entity.id) throw new Error("Extension field belongs to a different entity contract.");
              if (!approvals.fieldSourceVersions.includes(extension.entity.version)) throw new Error("Extension field belongs to an unsupported entity contract.");
              resolve(extension.entity, ["entity"]);
              fields.push(selected.reference);
              if (extension.required && (section.visibleWhen || component.visibleWhen)) warnings.add("Hidden required fields still require a valid value through the owning form.");
            }
          }
        } else if (component.type === "facts") {
          assertUnique(component.factIds, "component fact selection"); component.factIds.forEach(id => queries.push(fact(id).query));
        } else if (component.type === "queryList") {
          const approved = query(component.query, "list");
          if (approved.pagination === "none" || component.pageSize > approved.maxCardinality) throw new Error("Related list requires bounded owner pagination.");
          assertUnique(component.columns, "related-list column");
          if (component.columns.some(id => !approved.columns.some(column => column.id === id))) throw new Error("Related-list column is not approved.");
          queries.push(component.query);
        } else if (component.type === "action") {
          resolve(component.command, ["command"]);
          const approved = approvals.commands.find(value => samePageReference(value, component.command));
          if (!approved || approved.sourceEntityId !== payload.entity.id || component.formFactors.some(form => !approved.formFactors.includes(form)) || (approved.confirmation === "required" && !component.confirm)) throw new Error("Action presentation is not approved by its owner.");
          if (component.preview) {
            if (!approved.previewQuery) throw new Error("Action has no owner-approved preview.");
            query(approved.previewQuery, "preview");
          }
        } else if (component.type === "metric") {
          resolve(component.metric, ["metric"]);
          const approved = approvals.metrics.find(value => samePageReference(value, component.metric));
          if (!approved || approved.sourceEntityId !== payload.entity.id || component.formFactors.some(form => !approved.formFactors.includes(form))) throw new Error("Metric presentation is not approved.");
          query(approved.query, "metric"); queries.push(approved.query);
        } else if (component.type === "analyticsView") {
          const view = approvals.embeddedViews?.find(value => checksumPin(value.reference) === checksumPin(component.view));
          if (!view) throw new Error("Embedded analytics view is not an exact owner-approved immutable pin.");
          const sourceDependency = view.dependencies.find(dep => samePageReference(dep, view.sourceView));
          if (!sourceDependency || sourceDependency.kind !== "surface" || sourceDependency.ownerModuleId !== view.sourceView.ownerModuleId
            || sourceDependency.classification !== view.sourceView.classification) throw new Error("Embedded view lost its approved owning source.");
          for (const dependency of view.dependencies) {
            const prior = dependencies.get(refKey(dependency));
            if (prior && checksumPin(prior) !== checksumPin(dependency)) throw new Error("Conflicting embedded view registry dependency.");
            dependencies.set(refKey(dependency), dependency);
          }
          fields.push(component.view); embeddedUsed.add(component.view.definitionId); hasEmbeddedView = true;
          queryCost += view.queryCost; queryCount += view.queryCount;
        } else if (component.type === "surface") {
          resolve(component.surface, ["surface"]);
          const approved = approvals.surfaces.find(value => samePageReference(value, component.surface));
          if (!approved || approved.sourceEntityId !== payload.entity.id || approved.family !== component.family || component.formFactors.some(form => !approved.formFactors.includes(form))) throw new Error("Surface family/form factor is not approved by its owner.");
          approved.queries.forEach(ref => { query(ref, "surface"); queries.push(ref); });
        }
        const unique = [...new Map(queries.map(ref => [refKey(ref), ref])).values()];
        queryCount += unique.length;
        queryCost += unique.reduce((sum, ref) => sum + readCost(ref), 0);
        reads.push({ componentId: component.id, queries: unique });
      }
    }
    const visibilityQueries = new Map([...factsUsed].map(id => { const approved = fact(id); return [refKey(approved.query), approved.query]; }));
    queryCost += [...visibilityQueries.values()].reduce((sum, ref) => sum + readCost(ref), 0);
    queryCount += visibilityQueries.size;
    if (hasEmbeddedView && queryCount > 32) throw new Error("Page exceeds its combined analytics request budget.");
    if (queryCost > approvals.maxQueryCost) throw new Error("Page exceeds its owner query-cost budget.");
    return { sections, reads, visibilityFacts: [...factsUsed].sort(compare), queryCost, ...(hasEmbeddedView ? { queryCount } : {}) };
  };
  // Selecting the winning variant can require facts from every higher-priority
  // candidate. Count that whole bounded selector set, not only the winning rule.
  const selectorFacts = new Set<string>();
  payload.variants.forEach(variant => predicateFacts(variant.when, selectorFacts));
  const base = layout(structuredClone(payload.sections), selectorFacts);
  const variants = payload.variants.map(variant => {
    return { id: variant.id, priority: variant.priority, when: variant.when, layout: layout(applyPagePatches(payload.sections, variant.patches), selectorFacts) };
  });
  const configurationDependencies = normaliseConfigurationDependencyReferences(fields);
  const used = <T extends PageRegistryApproval>(values: T[]) => values.filter(value => dependencies.has(refKey(value)))
    .sort((left, right) => compare(left.id, right.id) || left.version - right.version);
  const runtimeApprovals: ValidatedPageApprovals = {
    entity: approvals.entity,
    sourcePage: approvals.sourcePage, variants: approvals.variants, fieldSourceVersions: approvals.fieldSourceVersions,
    ...(approvals.recordWriteCapability ? { recordWriteCapability: approvals.recordWriteCapability } : {}),
    nativeFields: approvals.nativeFields.filter(value => nativeUsed.has(value.id)).sort((left, right) => compare(left.id, right.id)),
    customFields: approvals.customFields.filter(value => configurationDependencies.some(ref => ref.definitionId === value.reference.definitionId))
      .sort((left, right) => compare(left.reference.definitionId, right.reference.definitionId)),
    facts: approvals.facts.filter(value => factsReferenced.has(value.id)).sort((left, right) => compare(left.id, right.id)),
    contracts: used(approvals.contracts), queries: used(approvals.queries), commands: used(approvals.commands),
    ...(embeddedUsed.size ? { embeddedViews: approvals.embeddedViews!.filter(view => embeddedUsed.has(view.reference.definitionId))
      .sort((a, b) => compare(a.reference.definitionId, b.reference.definitionId)) } : {}),
    metrics: used(approvals.metrics), surfaces: used(approvals.surfaces), maxQueryCost: approvals.maxQueryCost,
  };
  if (dependencies.size > 100) throw new Error("Page exceeds its registry dependency budget.");
  return { kind: "page", schemaVersion: 1, accessMode: "ordinary_read", payload, base, variants,
    dependencies: [...dependencies.values()].sort((left, right) => compare(left.id, right.id) || left.version - right.version),
    configurationDependencies, approvals: runtimeApprovals, warnings: [...warnings].sort(compare) };
}
