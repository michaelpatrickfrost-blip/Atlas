import type { StudioWidget } from "./definition";

export type BoardPick = { metricId: string; visual: StudioWidget["visual"]; span: 4 | 6 | 8 | 12 };
export type BoardTemplate = { id: string; name: string; description: string; picks: BoardPick[] };

export const boardTemplates: BoardTemplate[] = [
  {
    id: "whole-business",
    name: "Whole business",
    description: "Customers, pipeline, orders, service, people and stock on one wall.",
    picks: [
      { metricId: "customers.lifecycle", visual: "donut", span: 4 },
      { metricId: "crm.pipeline.value", visual: "column", span: 4 },
      { metricId: "crm.winrate", visual: "gauge", span: 4 },
      { metricId: "sales.orders.trend", visual: "area", span: 8 },
      { metricId: "crm.pipeline.stages", visual: "funnel", span: 4 },
      { metricId: "service.case.status", visual: "bar", span: 6 },
      { metricId: "people.headcount", visual: "kpi", span: 6 },
      { metricId: "stock.positions", visual: "bar", span: 6 },
      { metricId: "projects.status", visual: "stacked", span: 6 },
    ],
  },
  {
    id: "commercial",
    name: "Commercial",
    description: "Pipeline value, win rate, orders, quotes, prospects and customers.",
    picks: [
      { metricId: "crm.winrate", visual: "gauge", span: 4 },
      { metricId: "crm.pipeline.value", visual: "column", span: 8 },
      { metricId: "sales.orders.trend", visual: "area", span: 12 },
      { metricId: "sales.orders", visual: "stacked", span: 6 },
      { metricId: "sales.quotes", visual: "donut", span: 6 },
      { metricId: "crm.prospects.trend", visual: "line", span: 8 },
      { metricId: "customers.territories", visual: "bar", span: 4 },
    ],
  },
  {
    id: "operations",
    name: "Operations",
    description: "Stock, shipments, fulfilment, service and production plans.",
    picks: [
      { metricId: "logistics.shipments", visual: "donut", span: 4 },
      { metricId: "logistics.fulfilment", visual: "funnel", span: 4 },
      { metricId: "service.case.status", visual: "bar", span: 4 },
      { metricId: "logistics.shipments.trend", visual: "area", span: 8 },
      { metricId: "stock.movements.trend", visual: "line", span: 4 },
      { metricId: "stock.positions", visual: "bar", span: 6 },
      { metricId: "planning.plans", visual: "column", span: 6 },
    ],
  },
  {
    id: "people",
    name: "People",
    description: "Headcount, time off, shifts, timesheets and reviews.",
    picks: [
      { metricId: "people.headcount", visual: "kpi", span: 4 },
      { metricId: "people.employment", visual: "donut", span: 4 },
      { metricId: "people.absence.status", visual: "column", span: 4 },
      { metricId: "scheduling.shifts", visual: "stacked", span: 6 },
      { metricId: "scheduling.timesheets", visual: "bar", span: 6 },
      { metricId: "people.appraisals", visual: "table", span: 6 },
      { metricId: "people.oneToOnes", visual: "column", span: 6 },
    ],
  },
];

export function widgetsFromTemplate(template: BoardTemplate, available: Set<string>): StudioWidget[] {
  return template.picks.filter((pick) => available.has(pick.metricId)).slice(0, 24).map((pick) => ({
    id: `${template.id}-${pick.metricId}`,
    metricId: pick.metricId,
    visual: pick.visual,
    wide: pick.span >= 6,
    span: pick.span,
  }));
}
