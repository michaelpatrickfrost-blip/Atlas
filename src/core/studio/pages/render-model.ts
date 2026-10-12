import type { EmbeddedViewOutput } from "./embedded-views";
import { formatMoney } from "@/core/shared/money";
import type { ContractReference } from "../registry/types";
import type { FieldValue } from "../fields/schema";
import type { CompiledPagePlan } from "./compiler";
import { samePageReference } from "./compiler";
import type { PageQueryOutput } from "./owner-contract";
import type { VisiblePageLayout } from "./selection";
import type { PageScalar } from "./schema";

export type PageDisplayCell = { label: string; text: string; unavailable: boolean };
export type PageDisplayComponent = { id: string; label: string; help: string } & (
  | { type: "fields" | "facts" | "metric"; cells: PageDisplayCell[] }
  | { type: "queryList"; columns: string[]; rows: { id: string; cells: PageDisplayCell[] }[]; nextCursor: PageQueryOutput["nextCursor"]; recordNavigation?: boolean }
  | { type: "instructions" | "callout"; text: string; tone: "info" | "success" | "warning" }
  | { type: "action"; command: ContractReference; confirm: boolean; preview: boolean }
  | { type: "analyticsView"; output: EmbeddedViewOutput | null }
  | { type: "surface"; family: string; surface?: ContractReference; outputs: PageQueryOutput[] }
);
export type PageDisplayModel = { variantId: string | null; formFactor: "desktop" | "tablet" | "phone"; sections: {
  id: string; label: string; help: string; columns: number; components: PageDisplayComponent[] }[] };
export const pageQueryKey = (query: Pick<ContractReference, "id" | "version">) => `${query.id}@${query.version}`;
const friendly = (id: string) => id.replace(/_/g, " ").replace(/^./, char => char.toUpperCase());
function scalar(value: PageScalar | undefined): string { return value === undefined || value === null ? "—" : typeof value === "boolean" ? value ? "Yes" : "No" : String(value); }
function cell(label: string, value: PageScalar | undefined, format?: { kind: "money_minor"; currencyColumnId: string }, values?: Record<string, PageScalar>): PageDisplayCell {
  if (!format || value === undefined || value === null) return { label, text: scalar(value), unavailable: false };
  const currency = values?.[format.currencyColumnId];
  if (typeof value !== "number" || !Number.isSafeInteger(value) || typeof currency !== "string") return { label, text: "Unavailable", unavailable: true };
  try { return { label, text: formatMoney(value, currency), unavailable: false }; }
  catch { return { label, text: "Unavailable", unavailable: true }; }
}
function fieldText(value: FieldValue | null | undefined): string {
  if (!value) return "—";
  if (value.type === "money") return `${value.value.amount} ${value.value.currency}`;
  if (value.type === "address") return [value.value.line1, value.value.line2, value.value.city, value.value.region, value.value.postalCode, value.value.country].filter(Boolean).join(", ");
  if (value.type === "multi_enum") return value.value.join(", ");
  return scalar(value.value);
}
/** Browser-safe display transform shared by labelled sample preview and live
 * owning reads. No conditions, approval graph, private facts or executors leave
 * this function. Money predicates retain their original numeric meaning. */
export function createPageDisplayModel(plan: CompiledPagePlan, layout: VisiblePageLayout, formFactor: PageDisplayModel["formFactor"],
  outputs: ReadonlyMap<string, PageQueryOutput>, nativeValues: ReadonlyMap<string, { value: PageScalar | undefined; values: Record<string, PageScalar> }> = new Map(), facts: ReadonlyMap<string, PageScalar> = new Map(), fieldValues: ReadonlyMap<string, { label: string; value: FieldValue | null }> = new Map(), componentOutputs: ReadonlyMap<string, PageQueryOutput> = new Map(), embeddedOutputs: ReadonlyMap<string, EmbeddedViewOutput> = new Map()): PageDisplayModel {
  return { variantId: layout.variantId, formFactor, sections: layout.sections.map(section => ({ id: section.id, label: section.label, help: section.help,
    columns: section.columns[formFactor], components: section.components.map(component => {
      const base = { id: component.id, label: component.label ?? "", help: component.help ?? "" };
      if (component.type === "fields") return { ...base, type: "fields", cells: component.fields.map(field => {
        if (field.source === "extension") { const value = fieldValues.get(field.reference.definitionId); return { label: field.label ?? value?.label ?? "Custom field", text: fieldText(value?.value), unavailable: !value }; }
        const approval = plan.approvals.nativeFields.find(value => value.id === field.fieldId)!;
        const row = nativeValues.get(field.fieldId);
        return cell(field.label ?? approval.label ?? friendly(field.fieldId), row?.value, approval.format, row?.values);
      }) };
      if (component.type === "facts") return { ...base, type: "facts", cells: component.factIds.map(id => {
        return cell(friendly(id), facts.get(id));
      }) };
      if (component.type === "queryList") {
        const approval = plan.approvals.queries.find(value => samePageReference(value, component.query))!, output = componentOutputs.get(component.id) ?? outputs.get(pageQueryKey(component.query));
        return { ...base, type: "queryList", columns: component.columns.map(id => approval.columns.find(value => value.id === id)?.label ?? friendly(id)),
          rows: (output?.rows ?? []).map(row => ({ id: row.id, cells: component.columns.map(id => { const column = approval.columns.find(value => value.id === id)!; return cell(column.label ?? friendly(id), row.values[id], column.format, row.values); }) })), nextCursor: output?.nextCursor ?? null };
      }
      if (component.type === "metric") { const metric = plan.approvals.metrics.find(value => samePageReference(value, component.metric))!, output = outputs.get(pageQueryKey(metric.query));
        const query = plan.approvals.queries.find(value => samePageReference(value, metric.query))!;
        return { ...base, type: "metric", cells: query.columns.map(column => cell(column.label ?? friendly(column.id), output?.rows[0]?.values[column.id], column.format, output?.rows[0]?.values)) }; }
      if (component.type === "instructions" || component.type === "callout") return { ...base, type: component.type, text: component.text, tone: component.type === "callout" ? component.tone : "info" };
      if (component.type === "action") return { ...base, type: "action", command: component.command, confirm: component.confirm, preview: component.preview };
      if (component.type === "analyticsView") return { ...base, type: "analyticsView", output: embeddedOutputs.get(component.id) ?? null };
      const surface = plan.approvals.surfaces.find(value => samePageReference(value, component.surface))!;
      return { ...base, type: "surface", family: component.family, surface: component.surface, outputs: surface.queries.flatMap(query => { const output = outputs.get(pageQueryKey(query)); return output ? [output] : []; }) };
    }) })) };
}
