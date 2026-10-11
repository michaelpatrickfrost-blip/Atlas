import type { PageSection, PagePatch } from "./schema";

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
export function applyPagePatches(base: PageSection[], patches: PagePatch[]): PageSection[] {
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
