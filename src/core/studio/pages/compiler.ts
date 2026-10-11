import type { z } from "zod";
import { referenceSchema } from "../compiler/reference";
import { normaliseConfigurationReferences, type ConfigurationReference } from "../record-types";
import { pageApprovalsSchema, type PageApprovals, type PageRegistryApproval, type PageRegistryDependency, type ValidatedPageApprovals } from "./approvals";
import { pagePayloadSchema, pageSectionSchema, type PagePatch, type PagePayload, type PageSection, type VisibilityPredicate } from "./schema";

export type PageRegistryReference = z.infer<typeof referenceSchema>;
export type PageReadRequest = { componentId: string; queries: PageRegistryReference[] };
export type CompiledPageLayout = { sections: PageSection[]; reads: PageReadRequest[]; visibilityFacts: string[]; queryCost: number };
export type CompiledPagePlan = {
  kind: "page"; schemaVersion: 1; accessMode: "ordinary_read"; payload: PagePayload; base: CompiledPageLayout;
  variants: { id: string; priority: number; when: VisibilityPredicate; layout: CompiledPageLayout }[];
  dependencies: PageRegistryDependency[]; configurationDependencies: ConfigurationReference[];
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

function locateComponent(sections: PageSection[], id: string) {
  for (const section of sections) {
    const index = section.components.findIndex(component => component.id === id);
    if (index !== -1) return { section, index, component: section.components[index] };
  }
  throw new Error("Patch component target is missing.");
}
function locateSection(sections: PageSection[], id: string) {
  const section = sections.find(value => value.id === id);
  if (!section) throw new Error("Patch section target is missing.");
  return section;
}

/** Patch array is an explicit editing sequence, not overlay merge precedence.
 * Each business property can be written only once. Multiple competing inserts or
 * moves at the same ordering anchor are rejected rather than silently reordered. */
function applyPatches(base: PageSection[], patches: PagePatch[]): PageSection[] {
  const sections = structuredClone(base), writes = new Map<string, Set<string>>(), anchors = new Set<string>();
  const claim = (id: string, properties: readonly string[]) => {
    const prior = writes.get(id) ?? new Set<string>();
    if ((prior.has("*") && properties.length) || (properties.includes("*") && prior.size) || properties.some(property => prior.has(property)))
      throw new Error("Conflicting page patches.");
    properties.forEach(property => prior.add(property)); writes.set(id, prior);
  };
  const ordering = (kind: string, parent: string, after: string | null) => {
    const anchor = `${kind}:${parent}:${after ?? "start"}`;
    if (anchors.has(anchor)) throw new Error("Ambiguous patch ordering anchor.");
    anchors.add(anchor);
  };
  for (const patch of patches) {
    if (patch.operation === "setSection" || patch.operation === "setComponent") {
      const id = patch.operation === "setSection" ? patch.sectionId : patch.componentId;
      claim(id, Object.keys(patch.properties));
      const target = patch.operation === "setSection" ? locateSection(sections, id) : locateComponent(sections, id).component;
      const { visibleWhen, ...properties } = patch.properties;
      Object.assign(target, properties);
      if (visibleWhen === null) delete target.visibleWhen;
      else if (visibleWhen !== undefined) target.visibleWhen = visibleWhen;
    } else if (patch.operation === "addSection") {
      claim(patch.section.id, ["*"]); ordering("section", "page", patch.afterSectionId);
      const index = patch.afterSectionId === null ? -1 : sections.indexOf(locateSection(sections, patch.afterSectionId));
      sections.splice(index + 1, 0, structuredClone(patch.section));
    } else if (patch.operation === "removeSection") {
      const section = locateSection(sections, patch.sectionId);
      claim(section.id, ["*"]); section.components.forEach(component => claim(component.id, ["*"]));
      sections.splice(sections.indexOf(section), 1);
    } else if (patch.operation === "moveSection") {
      if (patch.sectionId === patch.afterSectionId) throw new Error("Patch cannot move a section after itself.");
      claim(patch.sectionId, ["position"]); ordering("section", "page", patch.afterSectionId);
      const section = locateSection(sections, patch.sectionId);
      sections.splice(sections.indexOf(section), 1);
      const index = patch.afterSectionId === null ? -1 : sections.indexOf(locateSection(sections, patch.afterSectionId));
      sections.splice(index + 1, 0, section);
    } else if (patch.operation === "addComponent") {
      claim(patch.component.id, ["*"]); ordering("component", patch.sectionId, patch.afterComponentId);
      const section = locateSection(sections, patch.sectionId);
      const after = patch.afterComponentId === null ? -1 : section.components.findIndex(component => component.id === patch.afterComponentId);
      if (patch.afterComponentId !== null && after === -1) throw new Error("Patch component ordering anchor is missing.");
      section.components.splice(after + 1, 0, structuredClone(patch.component));
    } else if (patch.operation === "removeComponent") {
      claim(patch.componentId, ["*"]); const current = locateComponent(sections, patch.componentId);
      current.section.components.splice(current.index, 1);
    } else {
      if (patch.componentId === patch.afterComponentId) throw new Error("Patch cannot move a component after itself.");
      claim(patch.componentId, ["position"]); ordering("component", patch.sectionId, patch.afterComponentId);
      const current = locateComponent(sections, patch.componentId);
      current.section.components.splice(current.index, 1);
      const section = locateSection(sections, patch.sectionId);
      const after = patch.afterComponentId === null ? -1 : section.components.findIndex(component => component.id === patch.afterComponentId);
      if (patch.afterComponentId !== null && after === -1) throw new Error("Patch component ordering anchor is missing.");
      section.components.splice(after + 1, 0, current.component);
    }
  }
  return sections;
}

/** Pure compiler. Supplied approvals are trusted only as server-loaded metadata;
 * this function neither authenticates them nor queries/invokes their providers. */
export function compilePage(input: unknown, suppliedApprovals: PageApprovals): CompiledPagePlan {
  const payload = pagePayloadSchema.parse(input), approvals = pageApprovalsSchema.parse(suppliedApprovals);
  if (!samePageReference(payload.entity, approvals.entity)) throw new Error("Page requires the exact approved entity contract.");
  if (!payload.formFactors.includes("phone")) throw new Error("Page requires a phone representation.");
  assertUnique(payload.variants.map(variant => variant.id), "page variant ID");
  assertUnique(payload.variants.map(variant => String(variant.priority)), "page variant priority");
  payload.variants.sort((left, right) => right.priority - left.priority);
  assertUnique(approvals.nativeFields.map(field => field.id), "approved native field");
  assertUnique(approvals.customFields.map(field => field.reference.definitionId), "approved extension field");
  assertUnique(approvals.facts.map(fact => fact.id), "approved fact");
  approvals.queries.forEach(query => assertUnique(query.columns.map(column => column.id), "approved query column"));
  const contracts = new Map<string, PageRegistryApproval>();
  for (const contract of [approvals.entity, ...approvals.contracts, ...approvals.queries, ...approvals.commands, ...approvals.metrics, ...approvals.surfaces]) {
    const previous = contracts.get(refKey(contract));
    if (previous) throw new Error("Duplicate approved registry contract.");
    contracts.set(refKey(contract), contract);
  }
  for (const values of [approvals.queries, approvals.commands, approvals.metrics, approvals.surfaces]) assertUnique(values.map(refKey), "typed contract approval");
  const dependencies = new Map<string, PageRegistryDependency>(), fields: ConfigurationReference[] = [], warnings = new Set<string>();
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
    let queryCost = 0;
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
            if (selected.source === "native") nativeUsed.add(selected.fieldId);
            if (selected.source === "extension") {
              const extension = approvals.customFields.find(value => value.reference.definitionId === selected.reference.definitionId);
              if (!extension || !samePageReference(extension.entity, payload.entity)) throw new Error("Extension field belongs to a different entity contract.");
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
        } else if (component.type === "surface") {
          resolve(component.surface, ["surface"]);
          const approved = approvals.surfaces.find(value => samePageReference(value, component.surface));
          if (!approved || approved.sourceEntityId !== payload.entity.id || approved.family !== component.family || component.formFactors.some(form => !approved.formFactors.includes(form))) throw new Error("Surface family/form factor is not approved by its owner.");
          approved.queries.forEach(ref => { query(ref, "surface"); queries.push(ref); });
        }
        const unique = [...new Map(queries.map(ref => [refKey(ref), ref])).values()];
        queryCost += unique.reduce((sum, ref) => sum + readCost(ref), 0);
        reads.push({ componentId: component.id, queries: unique });
      }
    }
    const visibilityQueries = new Map([...factsUsed].map(id => { const approved = fact(id); return [refKey(approved.query), approved.query]; }));
    queryCost += [...visibilityQueries.values()].reduce((sum, ref) => sum + readCost(ref), 0);
    if (queryCost > approvals.maxQueryCost) throw new Error("Page exceeds its owner query-cost budget.");
    return { sections, reads, visibilityFacts: [...factsUsed].sort(compare), queryCost };
  };
  // Selecting the winning variant can require facts from every higher-priority
  // candidate. Count that whole bounded selector set, not only the winning rule.
  const selectorFacts = new Set<string>();
  payload.variants.forEach(variant => predicateFacts(variant.when, selectorFacts));
  const base = layout(structuredClone(payload.sections), selectorFacts);
  const variants = payload.variants.map(variant => {
    return { id: variant.id, priority: variant.priority, when: variant.when, layout: layout(applyPatches(payload.sections, variant.patches), selectorFacts) };
  });
  const configurationDependencies = normaliseConfigurationReferences(fields);
  const used = <T extends PageRegistryApproval>(values: T[]) => values.filter(value => dependencies.has(refKey(value)))
    .sort((left, right) => compare(left.id, right.id) || left.version - right.version);
  const runtimeApprovals: ValidatedPageApprovals = {
    entity: approvals.entity,
    ...(approvals.recordWriteCapability ? { recordWriteCapability: approvals.recordWriteCapability } : {}),
    nativeFields: approvals.nativeFields.filter(value => nativeUsed.has(value.id)).sort((left, right) => compare(left.id, right.id)),
    customFields: approvals.customFields.filter(value => configurationDependencies.some(ref => ref.definitionId === value.reference.definitionId))
      .sort((left, right) => compare(left.reference.definitionId, right.reference.definitionId)),
    facts: approvals.facts.filter(value => factsReferenced.has(value.id)).sort((left, right) => compare(left.id, right.id)),
    contracts: used(approvals.contracts), queries: used(approvals.queries), commands: used(approvals.commands),
    metrics: used(approvals.metrics), surfaces: used(approvals.surfaces), maxQueryCost: approvals.maxQueryCost,
  };
  if (dependencies.size > 100) throw new Error("Page exceeds its registry dependency budget.");
  return { kind: "page", schemaVersion: 1, accessMode: "ordinary_read", payload, base, variants,
    dependencies: [...dependencies.values()].sort((left, right) => compare(left.id, right.id) || left.version - right.version),
    configurationDependencies, approvals: runtimeApprovals, warnings: [...warnings].sort(compare) };
}
