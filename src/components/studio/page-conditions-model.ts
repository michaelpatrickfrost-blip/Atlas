import { pagePayloadSchema, type PagePayload, type PageScalar, type VisibilityPredicate, type PagePatch } from '@/core/studio/pages/schema';
import { applyPagePatches } from '@/core/studio/pages/patches';
import { changePageNode, selectedPageNode, type PageEditorNode, type PageEditorSelection } from './page-editor-model';

export type PageEditorConditions = { variantsAllowed: boolean; facts: readonly { id: string; label: string; choices: readonly { label: string; value: PageScalar }[] }[] };
export type FactRule = Extract<VisibilityPredicate, { kind: 'fact' }>;
export function editableRules(condition: VisibilityPredicate | undefined, catalog: PageEditorConditions): { mode: 'all' | 'any'; rules: FactRule[] } | null {
  if (!condition) return { mode: 'all', rules: [] };
  const rules = condition.kind === 'all' || condition.kind === 'any' ? condition.predicates : [condition];
  if (!rules.every((rule): rule is FactRule => rule.kind === 'fact' && rule.operator === 'equals' && rule.values.length === 1 && catalog.facts.some(fact => fact.id === rule.factId && fact.choices.some(choice => choice.value === rule.values[0])))) return null;
  return { mode: condition.kind === 'any' ? 'any' : 'all', rules };
}
export function factRule(catalog: PageEditorConditions, factId?: string, choiceIndex = 0): FactRule {
  const fact = factId ? catalog.facts.find(value => value.id === factId) : catalog.facts.find(value => value.choices.length);
  const choice = fact?.choices[choiceIndex];
  if (!fact || !choice) throw new Error('Choose an approved business condition.');
  return { kind: 'fact', factId: fact.id, operator: 'equals', values: [choice.value] };
}
export function conditionFromRules(mode: 'all' | 'any', rules: FactRule[]): VisibilityPredicate | undefined {
  if (rules.length > 8) throw new Error('Use at most eight conditions.');
  return rules.length === 0 ? undefined : rules.length === 1 ? rules[0] : { kind: mode, predicates: rules };
}
export function presentationVariant(variant: PagePayload['variants'][number]): boolean {
  return variant.patches.every(patch => patch.operation === 'setSection' || patch.operation === 'setComponent');
}
export function variantDesignPage(page: PagePayload, id: string): PagePayload {
  const variant = page.variants.find(value => value.id === id);
  return variant ? { ...page, variants: [], sections: applyPagePatches(page.sections, variant.patches) } : page;
}
export function addConditionalVariant(page: PagePayload, catalog: PageEditorConditions, id: string): PagePayload {
  if (!catalog.variantsAllowed || page.variants.length >= 20 || page.variants.some(value => value.id === id)) throw new Error('Another layout cannot be added here.');
  const priorities = new Set(page.variants.map(value => value.priority));
  const priority = Array.from({ length: 1000 }, (_, index) => index + 1).find(value => !priorities.has(value));
  if (priority === undefined) throw new Error('Choose another layout priority.');
  return pagePayloadSchema.parse({ ...page, variants: [...page.variants, { id, label: 'Alternative layout', priority, when: factRule(catalog), patches: [{ operation: 'setSection', sectionId: page.sections[0].id, properties: { label: `${page.sections[0].label.slice(0, 76)} · Alternative layout` } }] }] });
}
export function patchVariantNode(page: PagePayload, id: string, selection: PageEditorSelection, change: (node: PageEditorNode) => PageEditorNode): PagePayload {
  const variant = page.variants.find(value => value.id === id);
  if (!variant || !presentationVariant(variant)) throw new Error('This layout has advanced changes. Its saved design is kept.');
  const design = variantDesignPage(page, id), previous = selectedPageNode(design, selection);
  if (!previous) throw new Error('Choose an item first.');
  const next = selectedPageNode(changePageNode(design, selection, change), selection)!;
  const allowed = selection.kind === 'section' ? ['label', 'help', 'columns', 'visibleWhen'] as const : ['label', 'help', 'formFactors', 'visibleWhen'] as const;
  const previousObject = previous as unknown as Record<string, unknown>, nextObject = next as unknown as Record<string, unknown>;
  if (Object.keys({ ...previousObject, ...nextObject }).some(key => !allowed.some(value => value === key) && JSON.stringify(previousObject[key]) !== JSON.stringify(nextObject[key]))) throw new Error('Edit the default layout to change this business component.');
  const copies = structuredClone(variant.patches), operation = selection.kind === 'section' ? 'setSection' : 'setComponent';
  const matches = (patch: PagePatch) => patch.operation === operation && (patch.operation === 'setSection' ? patch.sectionId : patch.operation === 'setComponent' ? patch.componentId : null) === selection.id;
  const properties: Record<string, unknown> = {};
  for (const patch of copies.filter(matches)) if (patch.operation === 'setSection' || patch.operation === 'setComponent') for (const [key, value] of Object.entries(patch.properties)) {
    if (key in properties) throw new Error('This layout has conflicting changes. Its saved design is kept.');
    properties[key] = value;
  }
  const patches = copies.filter(patch => !matches(patch));
  for (const key of allowed) if (JSON.stringify(previousObject[key]) !== JSON.stringify(nextObject[key])) {
    // Null explicitly removes a retained visibility condition. Optional label/help
    // removal is represented by an ordinary human label/blank description.
    properties[key] = key === 'visibleWhen' ? nextObject[key] ?? null : key === 'help' ? nextObject[key] ?? '' : key === 'label' ? nextObject[key] ?? previousObject[key] ?? 'Business detail' : nextObject[key];
  }
  if (!Object.keys(properties).length) return page;
  patches.push((selection.kind === 'section' ? { operation: 'setSection', sectionId: selection.id, properties } : { operation: 'setComponent', componentId: selection.id, properties }) as PagePatch);
  return pagePayloadSchema.parse({ ...page, variants: page.variants.map(value => value.id === id ? { ...value, patches } : value) });
}
export function moveConditionalVariant(page: PagePayload, id: string, direction: -1 | 1): PagePayload {
  const ordered = [...page.variants].sort((a, b) => b.priority - a.priority), index = ordered.findIndex(value => value.id === id), other = ordered[index + direction];
  if (index < 0 || !other) return page;
  const current = ordered[index];
  return { ...page, variants: page.variants.map(value => value.id === id ? { ...value, priority: other.priority } : value.id === other.id ? { ...value, priority: current.priority } : value) };
}
