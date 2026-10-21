import type { PageComponent, PagePayload, PageSection } from '@/core/studio/pages/schema';

export type PageEditorSelection = { kind: 'section' | 'component'; id: string };
export type PageEditorField = Extract<PageComponent, { type: 'fields' }>['fields'][number];
export type PageEditorNode = PageSection | PageComponent;
export const pageFieldIdentity = (field: PageEditorField): string => field.source === 'native'
  ? `native:${field.fieldId}` : `extension:${field.reference.definitionId}:${field.reference.versionId}:${field.reference.schemaVersion}:${field.reference.checksum}`;

export function selectedPageNode(page: PagePayload, selection: PageEditorSelection | null): PageEditorNode | null {
  if (!selection) return null;
  if (selection.kind === 'section') return page.sections.find(section => section.id === selection.id) ?? null;
  return page.sections.flatMap(section => section.components).find(component => component.id === selection.id) ?? null;
}
export function changePageNode(page: PagePayload, selection: PageEditorSelection, change: (node: PageEditorNode) => PageEditorNode): PagePayload {
  return { ...page, sections: page.sections.map(section => selection.kind === 'section' && section.id === selection.id
    ? change(section) as PageSection : { ...section, components: section.components.map(component => selection.kind === 'component' && component.id === selection.id ? change(component) as PageComponent : component) }) };
}
function assertBudget(page: PagePayload) {
  if (page.sections.length > 20 || page.sections.some(section => section.components.length > 30) || page.sections.reduce((sum, section) => sum + section.components.length, 0) > 100)
    throw new Error('This screen is full. Remove an item before adding another.');
  const ids = page.sections.flatMap(section => [section.id, ...section.components.map(component => component.id)]);
  if (new Set(ids).size !== ids.length || ids.some(id => !/^[a-z][a-z0-9_]{0,39}$/.test(id))) throw new Error('The new item could not be added. Try again.');
}
export function addPageComponent(page: PagePayload, sectionId: string, component: PageComponent): PagePayload {
  if (!page.sections.some(section => section.id === sectionId)) throw new Error('Choose a section first.');
  const next = { ...page, sections: page.sections.map(section => section.id === sectionId ? { ...section, components: [...section.components, component] } : section) };
  assertBudget(next); return next;
}
export function addPageSection(page: PagePayload, section: PageSection): PagePayload {
  const next = { ...page, sections: [...page.sections, section] }; assertBudget(next); return next;
}
export function movePageNode(page: PagePayload, selection: PageEditorSelection, direction: -1 | 1): PagePayload {
  function move<T extends { id: string }>(rows: T[]) {
    const index = rows.findIndex(row => row.id === selection.id), target = index + direction;
    if (index < 0 || target < 0 || target >= rows.length) return rows;
    const next = [...rows]; [next[index], next[target]] = [next[target], next[index]]; return next;
  }
  return { ...page, sections: selection.kind === 'section' ? move(page.sections) : page.sections.map(section => ({ ...section, components: move(section.components) })) };
}
export function duplicatePageNode(page: PagePayload, selection: PageEditorSelection, createId: () => string): { page: PagePayload; selection: PageEditorSelection } {
  const node = selectedPageNode(page, selection);
  if (!node) throw new Error('Choose an item first.');
  const id = createId();
  const next = structuredClone(page);
  if (selection.kind === 'section') {
    const index = next.sections.findIndex(section => section.id === selection.id);
    const copy = structuredClone(next.sections[index]); copy.id = id; copy.label = `${copy.label.slice(0,93)} (copy)`;
    copy.components = copy.components.map(component => ({ ...component, id: createId() }));
    next.sections.splice(index + 1, 0, copy);
  } else {
    const section = next.sections.find(section => section.components.some(component => component.id === selection.id))!;
    const index = section.components.findIndex(component => component.id === selection.id);
    const copy = structuredClone(section.components[index]); copy.id = id;
    if (copy.label) copy.label = `${copy.label.slice(0,93)} (copy)`;
    section.components.splice(index + 1, 0, copy);
  }
  assertBudget(next); return { page: next, selection: { ...selection, id } };
}
export function removePageNode(page: PagePayload, selection: PageEditorSelection): PagePayload {
  const section = page.sections.find(section => selection.kind === 'section' ? section.id === selection.id : section.components.some(component => component.id === selection.id));
  if (!section) throw new Error('Choose an item first.');
  if (selection.kind === 'section' && page.sections.length === 1) throw new Error('Keep at least one section on your screen.');
  if (selection.kind === 'component' && section.components.length === 1) throw new Error('Keep at least one item in each section.');
  const removedIds = new Set(selection.kind === 'section' ? [section.id, ...section.components.map(component => component.id)] : [selection.id]);
  for (const variant of page.variants) for (const patch of variant.patches) {
    const targets = ['sectionId', 'componentId', 'afterSectionId', 'afterComponentId'] as const;
    if (targets.some(key => key in patch && removedIds.has((patch as unknown as Record<string, string>)[key])))
      throw new Error('Another layout uses this item. Update that layout before removing it.');
  }
  return { ...page, sections: selection.kind === 'section' ? page.sections.filter(row => row.id !== selection.id)
    : page.sections.map(row => ({ ...row, components: row.components.filter(component => component.id !== selection.id) })) };
}
export function applyPagePreset(page: PagePayload, sections: readonly PageSection[], createId: () => string): PagePayload {
  if (page.variants.length) throw new Error('This screen has other layouts. Keep them safe by editing its existing sections.');
  const next = { ...page, sections: sections.map(section => ({ ...structuredClone(section), id: createId(), components: section.components.map(component => ({ ...structuredClone(component), id: createId() })) })) };
  if (!next.sections.length || next.sections.some(section => !section.components.length)) throw new Error('Choose a layout with at least one useful section.');
  assertBudget(next); return next;
}
