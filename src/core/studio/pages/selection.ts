import { type CompiledPagePlan, type PageReadRequest, type PageRegistryReference, samePageReference } from "./compiler";
import type { PageComponent, PageScalar, PageSection, VisibilityPredicate } from "./schema";

/** The server supplies current user grants, a same-entity canonical assignment,
 * and facts already read through their owner gateway. Preview may use labelled
 * synthetic context; this pure helper establishes no tenant or data authority. */
export type PageSelectionContext = {
  capabilities: ReadonlySet<string>; recordTypeDefinitionId: string | null;
  facts: ReadonlyMap<string, PageScalar>;
};
export type VisiblePageLayout = { variantId: string | null; sections: PageSection[]; reads: PageReadRequest[] };

const granted = (context: PageSelectionContext, capability?: string) => capability === undefined || context.capabilities.has(capability);
function readableFact(plan: CompiledPagePlan, id: string, context: PageSelectionContext) {
  const fact = plan.approvals.facts.find(value => value.id === id);
  if (!fact || !granted(context, fact.capability)) return null;
  const query = plan.approvals.queries.find(value => samePageReference(value, fact.query));
  const contract = [plan.approvals.entity, ...plan.approvals.contracts].find(value => samePageReference(value, fact.contract));
  return query && contract && granted(context, query.capability) && query.columns.every(column => granted(context, column.capability))
    && granted(context, contract.capability) ? fact : null;
}

export function evaluatePageVisibility(plan: CompiledPagePlan, predicate: VisibilityPredicate, context: PageSelectionContext): boolean {
  if (!granted(context, plan.approvals.entity.capability)) return false;
  if (predicate.kind === "capabilities") return predicate.mode === "all" ? predicate.capabilities.every(capability => granted(context, capability)) : predicate.capabilities.some(capability => granted(context, capability));
  if (predicate.kind === "recordType") return context.recordTypeDefinitionId?.toLowerCase() === predicate.definitionId;
  if (predicate.kind === "all") return predicate.predicates.every(value => evaluatePageVisibility(plan, value, context));
  if (predicate.kind === "any") return predicate.predicates.some(value => evaluatePageVisibility(plan, value, context));
  const approved = readableFact(plan, predicate.factId, context);
  if (!approved || !context.facts.has(predicate.factId)) return false;
  const value = context.facts.get(predicate.factId);
  if (value === null ? !approved.nullable : typeof value !== approved.valueType) return false;
  return predicate.values.some(expected => expected === value);
}

/** Variant selection is one explicit priority winner; no variant chains/merges.
 * Data scheduling includes only visible, permitted components. This does not
 * replace the owner's current native/current+written/reference access checks. */
export function resolvePageVariant(plan: CompiledPagePlan, context: PageSelectionContext, formFactor: "desktop" | "tablet" | "phone"): VisiblePageLayout {
  if (!plan.payload.formFactors.includes(formFactor) || !granted(context, plan.approvals.entity.capability)) return { variantId: null, sections: [], reads: [] };
  const variant = plan.variants.find(value => evaluatePageVisibility(plan, value.when, context));
  const layout = variant?.layout ?? plan.base;
  const sections: PageSection[] = [];
  const reads: PageReadRequest[] = [];
  const permittedQuery = (ref: PageRegistryReference) => {
    const approved = plan.approvals.queries.find(value => samePageReference(value, ref));
    return !!approved && granted(context, approved.capability) && approved.columns.every(column => granted(context, column.capability));
  };
  for (const source of layout.sections) {
    if (!source.formFactors.includes(formFactor) || (source.visibleWhen && !evaluatePageVisibility(plan, source.visibleWhen, context))) continue;
    const section = structuredClone(source), components: PageComponent[] = [];
    for (const component of section.components) {
      if (!component.formFactors.includes(formFactor) || (component.visibleWhen && !evaluatePageVisibility(plan, component.visibleWhen, context))) continue;
      const registered = layout.reads.find(value => value.componentId === component.id);
      if (!registered) continue;
      const schedule = structuredClone(registered);
      if (component.type === "fields") {
        component.fields = component.fields.filter(field => {
          if (field.source === "native") {
            const approved = plan.approvals.nativeFields.find(value => value.id === field.fieldId);
            if (field.mode === "edit" && (!approved?.editable || !plan.approvals.recordWriteCapability || !granted(context, plan.approvals.recordWriteCapability) || !granted(context, approved.writeCapability))) field.mode = "read";
            return !!approved && granted(context, approved.capability) && permittedQuery(approved.query);
          }
          const approved = plan.approvals.customFields.find(value => value.reference.definitionId === field.reference.definitionId);
          if (field.mode === "edit" && (!approved?.editable || !plan.approvals.recordWriteCapability || !granted(context, plan.approvals.recordWriteCapability) || !granted(context, approved.writeCapability))) field.mode = "read";
          return !!approved && granted(context, approved.readCapability);
        });
        if (!component.fields.length) continue;
        schedule.queries = [...new Map(component.fields.flatMap(field => {
          if (field.source !== "native") return [];
          const approved = plan.approvals.nativeFields.find(value => value.id === field.fieldId)!;
          return [[`${approved.query.id}@${approved.query.version}`, approved.query] as const];
        })).values()];
      } else if (component.type === "facts") {
        component.factIds = component.factIds.filter(id => readableFact(plan, id, context));
        if (!component.factIds.length) continue;
        schedule.queries = [...new Map(component.factIds.map(id => {
          const fact = readableFact(plan, id, context);
          if (!fact) throw new Error("Visible fact lost its approved metadata.");
          return [`${fact.query.id}@${fact.query.version}`, fact.query];
        })).values()];
      } else if (component.type === "queryList") {
        const approved = plan.approvals.queries.find(value => samePageReference(value, component.query));
        component.columns = component.columns.filter(id => {
          const column = approved?.columns.find(value => value.id === id);
          return !!column && granted(context, column.capability);
        });
        if (!component.columns.length) continue;
      } else if (component.type === "action") {
        const approved = plan.approvals.commands.find(value => samePageReference(value, component.command));
        if (!approved || !granted(context, approved.capability)) continue;
        if (component.preview && (!approved.previewQuery || !permittedQuery(approved.previewQuery))) continue;
      } else if (component.type === "metric") {
        const approved = plan.approvals.metrics.find(value => samePageReference(value, component.metric));
        if (!approved || !granted(context, approved.capability)) continue;
      } else if (component.type === "surface") {
        const approved = plan.approvals.surfaces.find(value => samePageReference(value, component.surface));
        if (!approved || !granted(context, approved.capability)) continue;
      }
      if (schedule.queries.some(ref => !permittedQuery(ref))) continue;
      components.push(component);
      reads.push(structuredClone(schedule));
    }
    if (components.length) { section.components = components; sections.push(section); }
  }
  return { variantId: variant?.id ?? null, sections, reads };
}

/** Staged metadata-only visibility scheduling. Resolve variant facts first, then
 * repeat component-stage scheduling as supplied facts become available. Cheap
 * capability/record-type failures and false sections schedule no protected reads.
 * The eventual runtime must fetch through each owner's genuine current gateway. */
export function pageVisibilityFactRequests(plan: CompiledPagePlan, context: PageSelectionContext,
  formFactor: "desktop" | "tablet" | "phone", stage: "variants" | "components") {
  const requested = new Set<string>();
  type Partial = { state: boolean | "unknown"; facts: string[] };
  const inspect = (condition: VisibilityPredicate): Partial => {
    if (condition.kind === "all" || condition.kind === "any") {
      const values = condition.predicates.map(inspect);
      if (condition.kind === "all" && values.some(value => value.state === false)) return { state: false, facts: [] };
      if (condition.kind === "any" && values.some(value => value.state === true)) return { state: true, facts: [] };
      const facts = values.flatMap(value => value.facts);
      return { state: values.some(value => value.state === "unknown") ? "unknown" : condition.kind === "all", facts };
    }
    if (condition.kind !== "fact" || context.facts.has(condition.factId) || !readableFact(plan, condition.factId, context))
      return { state: evaluatePageVisibility(plan, condition, context), facts: [] };
    return { state: "unknown", facts: [condition.factId] };
  };
  if (granted(context, plan.approvals.entity.capability) && plan.payload.formFactors.includes(formFactor)) {
    if (stage === "variants") {
      for (const variant of plan.variants) {
        const value = inspect(variant.when); value.facts.forEach(id => requested.add(id));
        if (value.state === true) break;
      }
    } else {
      const selected = plan.variants.find(variant => evaluatePageVisibility(plan, variant.when, context));
      for (const section of (selected?.layout ?? plan.base).sections) {
        if (!section.formFactors.includes(formFactor)) continue;
        const state = section.visibleWhen ? inspect(section.visibleWhen) : { state: true, facts: [] };
        state.facts.forEach(id => requested.add(id));
        if (state.state !== true) continue;
        for (const component of section.components)
          if (component.formFactors.includes(formFactor) && component.visibleWhen) inspect(component.visibleWhen).facts.forEach(id => requested.add(id));
      }
    }
  }
  const factIds = [...requested].sort();
  const queries = [...new Map(factIds.map(id => {
    const fact = readableFact(plan, id, context);
    if (!fact) throw new Error("Visibility fact lost its approved metadata.");
    return [`${fact.query.id}@${fact.query.version}`, fact.query];
  })).values()].sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : left.version - right.version);
  return { factIds, queries };
}
