import { z } from "zod";
import { pageMoneyFormatSchema } from "./owner-contract";
import { formFactorSchema, pageNodeIdSchema, pagePayloadSchema } from "./schema";
import type { PageDisplayComponent, PageDisplayModel } from "./render-model";

const label = z.string().trim().min(1).max(200), logicalId = z.string().regex(/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/);
const identity = { id: logicalId, version: z.number().int().positive(), label };
/** Labelled, permission-filtered server presentation catalogue. No live values,
 * capability/condition graph or executable callbacks are needed on the canvas. */
export const pagePresentationCatalogSchema = z.strictObject({
  nativeFields: z.array(z.strictObject({ id: pageNodeIdSchema, label })).max(100),
  customFields: z.array(z.strictObject({ definitionId: z.uuid(), label })).max(100),
  facts: z.array(z.strictObject({ id: pageNodeIdSchema, label })).max(50),
  queries: z.array(z.strictObject({ ...identity, columns: z.array(z.strictObject({ id: pageNodeIdSchema, label, format: pageMoneyFormatSchema.optional() })).max(50) })).max(100),
  actions: z.array(z.strictObject(identity)).max(50), metrics: z.array(z.strictObject(identity)).max(50), surfaces: z.array(z.strictObject(identity)).max(50),
});
export type PagePresentationCatalog = z.infer<typeof pagePresentationCatalogSchema>;
/** Immediate base-layout design canvas only. Visibility and variant selection
 * use genuine owning runtime for actual Preview; neutral labelled samples are
 * never represented as live records or as evidence of publication/access. */
export function createDesignPageDisplayModel(input: unknown, presentation: PagePresentationCatalog, form: PageDisplayModel["formFactor"]): PageDisplayModel {
  const page = pagePayloadSchema.parse(input), catalog = pagePresentationCatalogSchema.parse(presentation), formFactor = formFactorSchema.parse(form);
  const match = <T extends { id: string; version: number; label: string }>(list: readonly T[], reference: { id: string; version: number }) => list.find(value => value.id === reference.id && value.version === reference.version);
  const sample = (label: string) => ({ label, text: "Sample", unavailable: false });
  return { variantId: null, formFactor, sections: page.sections.filter(section => section.formFactors.includes(formFactor)).map(section => ({
    id: section.id, label: section.label, help: section.help, columns: section.columns[formFactor],
    components: section.components.filter(component => component.formFactors.includes(formFactor)).map((component): PageDisplayComponent => {
      const base = { id: component.id, label: component.label ?? "", help: component.help ?? "" };
      if (component.type === "fields") return { ...base, type: "fields", cells: component.fields.map(field => {
        const approved = field.source === "native" ? catalog.nativeFields.find(value => value.id === field.fieldId) : catalog.customFields.find(value => value.definitionId === field.reference.definitionId);
        return approved ? sample(field.label ?? approved.label) : { label: field.label ?? "Field", text: "Unavailable", unavailable: true };
      }) };
      if (component.type === "facts") return { ...base, type: "facts", cells: component.factIds.map(id => sample(catalog.facts.find(fact => fact.id === id)?.label ?? "Fact")) };
      if (component.type === "metric") return { ...base, type: "metric", label: component.label ?? match(catalog.metrics, component.metric)?.label ?? "Metric", cells: [sample("Sample")] };
      if (component.type === "queryList") { const query = match(catalog.queries, component.query);
        const columns = component.columns.map(id => query?.columns.find(column => column.id === id)?.label ?? "Column");
        return { ...base, type: "queryList", label: component.label ?? query?.label ?? "Records", columns,
          rows: [{ id: "studio_sample", cells: columns.map(sample) }], nextCursor: null }; }
      if (component.type === "instructions" || component.type === "callout") return { ...base, type: component.type, text: component.text, tone: component.type === "callout" ? component.tone : "info" };
      if (component.type === "action") return { ...base, type: "action", label: component.label ?? match(catalog.actions, component.command)?.label ?? "Action", command: component.command, confirm: component.confirm, preview: component.preview };
      if (component.type === "analyticsView") return { ...base, type: "analyticsView", label: component.label ?? "Analytics view", output: null };
      return { ...base, type: "surface", label: component.label ?? match(catalog.surfaces, component.surface)?.label ?? "App area", family: component.family, surface: component.surface, outputs: [] };
    }),
  })) };
}
