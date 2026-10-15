import { z } from "zod";
import { ATLAS_CAPABILITIES } from "@/core/admin/access";
import { assertCapability } from "@/core/permissions/check";
import { fieldRuntimeAuthorityInTransaction, type FieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { parseTemplateSave, type TemplateAuthoringContent, type TemplateAuthoringInput } from "./authoring-input";
import { mergeKeys } from "./domain";
import { templateDetailLabel, templateTableRows } from "./editor-model";
import type { TemplateChange, TemplateContextInspection, TemplateDetailInspection, TemplateDetailUse, TemplateDraftInspection } from "./inspection-contract";
import { TARGET_MODULES, type TemplateBlock } from "./types";

const sectionNames: Record<TemplateBlock["type"], string> = {
  heading: "Heading", text: "Paragraph", bullets: "Bullet list", table: "Table",
  signature: "Signature", divider: "Divider", pageBreak: "Page break",
};
const sourceDescriptions: Record<TemplateDetailInspection["source"]["kind"], Omit<TemplateDetailInspection["source"], "kind">> = {
  company: { label: "Company branding", description: "The company name comes from this business's document branding when a document is generated." },
  customer: { label: "Customer Master", description: "This detail comes from the customer attached to the chosen business record. Customer access is checked when a real preview or document is requested." },
  contact: { label: "Customer contact", description: "This detail comes from the contact attached to the chosen business record and its customer. Contact access is checked when a real preview or document is requested." },
  record: { label: "Chosen business record", description: "An approved source app supplies this detail for the record chosen when previewing or generating a document. Making a template available in an app does not select a record or grant access." },
  date: { label: "Document date", description: "Atlas supplies today's date in the business document's existing London date format when the document is generated." },
  custom: { label: "Detail entered for each document", description: "The person generating the document enters this named detail. It belongs to this template's wording; a matching name in another template is not a shared field." },
};

function detailSource(key: string): TemplateDetailInspection["source"] {
  const kind = key.split(".")[0] as TemplateDetailInspection["source"]["kind"];
  // Callers reach this only after the unchanged protected-field whitelist parses.
  return { kind, ...sourceDescriptions[kind] };
}
function inspectDetails(content: TemplateAuthoringContent): TemplateDetailInspection[] {
  const details = new Map<string, TemplateDetailInspection>();
  const include = (text: string, use: TemplateDetailUse) => {
    for (const key of mergeKeys(text)) {
      let detail = details.get(key);
      if (!detail) { detail = { key, label: templateDetailLabel(key), source: detailSource(key), uses: [] }; details.set(key, detail); }
      detail.uses.push(use);
    }
  };
  include(content.titleTemplate, { location: "title", label: "Document title" });
  content.blocks.forEach((block, index) => {
    const label = `Section ${index + 1} · ${sectionNames[block.type]}`;
    if (block.type === "table") templateTableRows(block.text).forEach((row, rowIndex) => row.forEach((cell, columnIndex) => include(cell, {
      location: "table_cell", label: `${label} · Row ${rowIndex + 1}, column ${columnIndex + 1}`,
      sectionId: block.id, row: rowIndex + 1, column: columnIndex + 1,
    })));
    else include(block.text, { location: "section", label, sectionId: block.id });
  });
  return [...details.values()];
}
function describeChanges(saved: TemplateAuthoringContent | undefined, local: TemplateAuthoringContent): TemplateChange[] {
  if (!saved) return [{ kind: "setting", label: "New template ready for its first save" }];
  const changes: TemplateChange[] = [];
  for (const [key, label] of [["name", "Template name"], ["titleTemplate", "Document title"], ["description", "Description"],
    ["category", "Category"], ["status", "Draft or published setting"]] as const)
    if (saved[key] !== local[key]) changes.push({ kind: "setting", label: `${label} changed` });
  if (JSON.stringify([...saved.targetModules].sort()) !== JSON.stringify([...local.targetModules].sort()))
    changes.push({ kind: "setting", label: "Apps where this template is available changed" });
  const before = new Map(saved.blocks.map(block => [block.id, block])), after = new Map(local.blocks.map(block => [block.id, block]));
  const beforeShared = saved.blocks.filter(block => after.has(block.id)).map(block => block.id);
  const afterShared = local.blocks.filter(block => before.has(block.id)).map(block => block.id);
  saved.blocks.forEach((block, index) => {
    if (!after.has(block.id)) changes.push({ kind: "section_removed", sectionId: block.id, label: `Section ${index + 1} · ${sectionNames[block.type]} removed` });
  });
  local.blocks.forEach((block, index) => {
    const previous = before.get(block.id), label = `Section ${index + 1} · ${sectionNames[block.type]}`;
    if (!previous) changes.push({ kind: "section_added", sectionId: block.id, label: `${label} added` });
    else {
      if (previous.type !== block.type || previous.text !== block.text) changes.push({ kind: "section_changed", sectionId: block.id, label: `${label} changed` });
      if (beforeShared.indexOf(block.id) !== afterShared.indexOf(block.id)) changes.push({ kind: "section_moved", sectionId: block.id, label: `${label} moved` });
    }
  });
  return changes;
}
async function inspectContexts(authority: FieldRuntimeAuthority, targetModules: string[]): Promise<TemplateContextInspection[]> {
  // Discovery enforces current owner availability, native capability and lifecycle.
  // Target apps describe availability, never an executable/record dependency.
  const catalogue = await authority.registry.discover(authority.session);
  return catalogue.flatMap(context => {
    if (context.kind !== "template" || !TARGET_MODULES.includes(context.ownerModuleId as typeof TARGET_MODULES[number])
      || !targetModules.includes(context.ownerModuleId) || !context.id.startsWith(`${context.ownerModuleId}.template.`)) return [];
    const references = z.array(z.string()).safeParse(context.details.references);
    if (!references.success || references.data.length !== 2 || !references.data.includes(`${context.id}.list`) || !references.data.includes(`${context.id}.get`)) return [];
    const query = (suffix: string) => catalogue.find(item => item.id === `${context.id}.${suffix}` && item.version === context.version && item.kind === "query"
      && item.ownerModuleId === context.ownerModuleId && item.capability === context.capability);
    const list = query("list"), get = query("get");
    if (!list || !get) return [];
    return [{ id: context.id, version: context.version, label: context.label, ownerModuleId: context.ownerModuleId,
      lifecycle: context.lifecycle, contractHash: context.contractHash,
      listQuery: { id: list.id, version: list.version }, getQuery: { id: get.id, version: get.version } }];
  });
}
function friendlyValidation(error: unknown): string {
  if (error instanceof z.ZodError) return "Check the document sections. Each section needs a supported layout and valid content.";
  if (!(error instanceof Error)) return "Check the template's name, title, sections and chosen apps.";
  if (error.message.startsWith("Unknown merge fields:") || error.message.startsWith("A merge field is incomplete"))
    return "A document detail is incomplete or unavailable. Add it again using the detail picker.";
  return error.message;
}

/** Read-only inspection of the original native Templates content. The adapter
 * must first enforce Studio authoring access; this independently refreshes genuine
 * selected-business identity and original native permissions in the same snapshot.
 * No provider, record, brand, PDF, generated document, Audit or write is invoked. */
export async function inspectTemplateDraftInTransaction(authority: FieldRuntimeAuthority, form: FormData): Promise<TemplateDraftInspection> {
  const current = await fieldRuntimeAuthorityInTransaction(authority.session, authority.transaction);
  assertCapability(current.session, "core.contract.manage");
  if (!current.session.capabilities.has(ATLAS_CAPABILITIES.staff) && !await current.transaction.moduleState.findFirst({ where: {
    organisationId: current.session.organisationId, moduleId: "templates", enabled: true, entitled: true }, select: { id: true } }))
    throw new Error("Templates is not enabled for this company.");
  const rawId = form.get("id");
  if (rawId !== null && typeof rawId !== "string") throw new Error("Choose a valid template.");
  const id = (rawId ?? "").trim();
  if (id.length > 100) throw new Error("Choose a valid template.");
  let saved: TemplateAuthoringInput | null = null;
  if (id) {
    const row = await current.transaction.documentTemplate.findFirst({ where: { id, organisationId: current.session.organisationId, status: { not: "ARCHIVED" } },
      select: { id: true, version: true, name: true, titleTemplate: true, description: true, category: true, blocks: true, targetModules: true, status: true } });
    if (!row) throw new Error("This template is unavailable or outside your access.");
    const savedForm = new FormData();
    for (const key of ["id", "name", "titleTemplate", "description", "category", "status"] as const) savedForm.set(key, row[key] ?? "");
    savedForm.set("version", String(row.version)); savedForm.set("blocks", JSON.stringify(row.blocks));
    row.targetModules.forEach(target => savedForm.append("targetModules", target));
    saved = parseTemplateSave(savedForm);
  }
  let local: TemplateAuthoringInput;
  try { local = parseTemplateSave(form); }
  catch (error) { return { valid: false, errors: [friendlyValidation(error)], local: null, saved, currentVersion: saved?.version ?? null,
    changedSinceOpened: saved !== null && String(saved.version) !== String(form.get("version")), changes: [], details: [], contexts: [] }; }
  return { valid: true, errors: [], local, saved, currentVersion: saved?.version ?? null,
    changedSinceOpened: saved !== null && saved.version !== local.version,
    changes: describeChanges(saved?.data, local.data), details: inspectDetails(local.data), contexts: await inspectContexts(current, local.data.targetModules) };
}
