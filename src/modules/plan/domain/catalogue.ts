/** Governed planning language. Plans reference these definitions; they do not invent their own revenue. */

export const PLAN_TYPES = [
  ["company", "Company"],
  ["sales", "Sales"],
  ["marketing", "Marketing"],
  ["service", "Customer Service"],
  ["operations", "Operations"],
  ["manufacturing", "Manufacturing"],
  ["logistics", "Logistics"],
  ["stock", "Stock"],
  ["purchasing", "Purchasing"],
  ["people", "HR / People"],
  ["finance", "Finance"],
  ["projects", "Project portfolio"],
  ["safety", "Safety improvement"],
  ["growth", "Growth"],
  ["annual", "Annual operating"],
  ["quarterly", "Quarterly"],
  ["custom", "Blank"],
] as const;

export type PlanType = (typeof PLAN_TYPES)[number][0];

export type MetricUnit = "money" | "percent" | "count" | "hours" | "units";
export type Aggregation = "sum" | "average" | "weighted" | "none";
export type Direction = "higher" | "lower";

export type GovernedMetric = {
  key: string;
  name: string;
  definition: string;
  owner: string;
  /** Module that can supply actuals. `plan` means the figure is entered on the plan. */
  source: string;
  /** Capability required before Atlas reads live actuals. */
  readCapability?: string;
  unit: MetricUnit;
  aggregation: Aggregation;
  direction: Direction;
  dimensions: string[];
  sensitive?: boolean;
  version: number;
};

export const METRICS: GovernedMetric[] = [
  { key: "planned_hires", name: "Planned hires", definition: "New roles expected to start in each period, entered on this plan.", owner: "People", source: "plan", unit: "count", aggregation: "sum", direction: "higher", dimensions: ["Department", "Month"], version: 1 },
  { key: "training_hours", name: "Training hours", definition: "Hours planned for learning and development.", owner: "People", source: "plan", unit: "hours", aggregation: "sum", direction: "higher", dimensions: ["Department", "Month"], version: 1 },
  { key: "project_cost", name: "Project cost", definition: "Expected project costs entered as assumptions; this does not post costs to Finance.", owner: "Finance", source: "plan", unit: "money", aggregation: "sum", direction: "lower", dimensions: ["Project", "Month"], version: 1 },

  { key: "revenue", name: "Revenue", definition: "Confirmed and closed sales order value, excluding VAT.", owner: "Finance", source: "sales", readCapability: "sales.order.read", unit: "money", aggregation: "sum", direction: "higher", dimensions: ["Customer", "Product", "Month"], version: 1 },
  { key: "orders", name: "Orders", definition: "Count of confirmed and closed sales orders.", owner: "Sales", source: "sales", readCapability: "sales.order.read", unit: "count", aggregation: "sum", direction: "higher", dimensions: ["Customer", "Month"], version: 1 },
  { key: "pipeline", name: "Pipeline", definition: "Open opportunity value still in the pipeline.", owner: "Sales", source: "crm", readCapability: "sales.opportunity.read", unit: "money", aggregation: "sum", direction: "higher", dimensions: ["Territory", "Month"], version: 1 },
  { key: "win_rate", name: "Win rate", definition: "Won opportunities divided by won and lost opportunities in the period.", owner: "Sales", source: "crm", readCapability: "sales.opportunity.read", unit: "percent", aggregation: "none", direction: "higher", dimensions: ["Month"], version: 1 },
  { key: "sales_volume", name: "Sales volume", definition: "Units the sales plan expects to sell. Actuals use ordered quantity on confirmed orders.", owner: "Sales", source: "sales", readCapability: "sales.order.read", unit: "units", aggregation: "sum", direction: "higher", dimensions: ["Product", "Month"], version: 1 },
  { key: "customers_ordering", name: "Customers ordering", definition: "Distinct customers with a confirmed order in the period.", owner: "Sales", source: "sales", readCapability: "sales.order.read", unit: "count", aggregation: "none", direction: "higher", dimensions: ["Month"], version: 1 },
  { key: "quotes", name: "Quotations", definition: "Quotations raised in the period.", owner: "Sales", source: "sales", readCapability: "sales.quote.read", unit: "count", aggregation: "sum", direction: "higher", dimensions: ["Month"], version: 1 },
  { key: "quote_value", name: "Quotation value", definition: "Value of quotations raised in the period, excluding VAT.", owner: "Sales", source: "sales", readCapability: "sales.quote.read", unit: "money", aggregation: "sum", direction: "higher", dimensions: ["Month"], version: 1 },
  { key: "sales_activities", name: "Sales activities", definition: "Calls, meetings and tasks recorded in Sales during the period.", owner: "Sales", source: "sales", readCapability: "sales.opportunity.read", unit: "count", aggregation: "sum", direction: "higher", dimensions: ["Month"], version: 1 },
  { key: "production_demand", name: "Production demand", definition: "Units manufacturing is asked to make. Entered on the plan, or scaled only through a connection you keep.", owner: "Manufacturing", source: "plan", unit: "units", aggregation: "sum", direction: "higher", dimensions: ["Product", "Month"], version: 1 },
  { key: "production_capacity", name: "Production capacity", definition: "Units manufacturing can make in the period. Atlas does not turn a machine's hourly rate into a month without a calendar.", owner: "Manufacturing", source: "plan", unit: "units", aggregation: "sum", direction: "higher", dimensions: ["Work centre", "Month"], version: 1 },
  { key: "production_scheduled", name: "Scheduled output", definition: "Quantity on open manufacturing orders.", owner: "Manufacturing", source: "manufacturing", readCapability: "manufacturing.order.read", unit: "units", aggregation: "sum", direction: "higher", dimensions: ["Product", "Month"], version: 1 },
  { key: "production_completed", name: "Completed output", definition: "Quantity on completed or closed manufacturing orders.", owner: "Manufacturing", source: "manufacturing", readCapability: "manufacturing.order.read", unit: "units", aggregation: "sum", direction: "higher", dimensions: ["Product", "Month"], version: 1 },
  { key: "production_plan", name: "Production plan", definition: "Quantity saved on Production Planning for products in this period. Shown live until you take a snapshot.", owner: "Manufacturing", source: "planning", readCapability: "planning.demand.read", unit: "units", aggregation: "sum", direction: "higher", dimensions: ["Product", "Month"], version: 1 },
  { key: "otif", name: "OTIF", definition: "Share of delivered shipments that were on time and in full. Shipments with no result are left out.", owner: "Logistics", source: "logistics", readCapability: "logistics.shipment.read", unit: "percent", aggregation: "none", direction: "higher", dimensions: ["Month"], version: 1 },
  { key: "shipments", name: "Shipments", definition: "Shipments created in the period.", owner: "Logistics", source: "logistics", readCapability: "logistics.shipment.read", unit: "count", aggregation: "sum", direction: "higher", dimensions: ["Month"], version: 1 },
  { key: "warehouse_throughput", name: "Warehouse throughput", definition: "Shipment count used as a throughput signal. This is not a calculated warehouse-hours model.", owner: "Logistics", source: "logistics", readCapability: "logistics.shipment.read", unit: "count", aggregation: "sum", direction: "higher", dimensions: ["Month"], version: 1 },
  { key: "stock_on_hand", name: "Stock on hand", definition: "Available stock quantity now. This is a position, not a future stock plan.", owner: "Stock", source: "stock", readCapability: "stock.read", unit: "units", aggregation: "sum", direction: "higher", dimensions: ["Product"], version: 1 },
  { key: "tickets", name: "Tickets", definition: "Customer service tickets opened in the period.", owner: "Customer Service", source: "service", readCapability: "service.ticket.read", unit: "count", aggregation: "sum", direction: "lower", dimensions: ["Month"], version: 1 },
  { key: "complaints", name: "Complaints", definition: "Service cases whose type is a complaint.", owner: "Customer Service", source: "service", readCapability: "service.case.read", unit: "count", aggregation: "sum", direction: "lower", dimensions: ["Month"], version: 1 },
  { key: "first_response_hours", name: "First response", definition: "Average hours from case open to first response, where a response time is stored.", owner: "Customer Service", source: "service", readCapability: "service.case.read", unit: "hours", aggregation: "none", direction: "lower", dimensions: ["Month"], version: 1 },
  { key: "resolution_hours", name: "Resolution time", definition: "Average hours from case open to resolution, where a resolution time is stored.", owner: "Customer Service", source: "service", readCapability: "service.case.read", unit: "hours", aggregation: "none", direction: "lower", dimensions: ["Month"], version: 1 },
  { key: "csat", name: "CSAT", definition: "Customer satisfaction. Atlas has no satisfaction score on cases yet, so this stays a target until that source exists.", owner: "Customer Service", source: "plan", unit: "percent", aggregation: "none", direction: "higher", dimensions: ["Month"], version: 1 },
  { key: "headcount", name: "Headcount", definition: "Active employees.", owner: "People", source: "people", readCapability: "people.employee.read", unit: "count", aggregation: "none", direction: "higher", dimensions: ["Department"], version: 1 },
  { key: "labour_hours", name: "Available hours", definition: "Contracted weekly hours of active employees, summed. This is availability, not a roster.", owner: "People", source: "people", readCapability: "people.employee.read", unit: "hours", aggregation: "sum", direction: "higher", dimensions: ["Department"], version: 1 },
  { key: "labour_cost", name: "Labour cost", definition: "A planning figure for employment cost. Payroll amounts are not copied here.", owner: "People", source: "plan", unit: "money", aggregation: "sum", direction: "lower", dimensions: ["Department", "Month"], sensitive: true, version: 1 },
  { key: "material_requirement", name: "Material requirement", definition: "Purchasing requirement entered on the plan, or scaled through a connection you keep.", owner: "Purchasing", source: "plan", unit: "money", aggregation: "sum", direction: "higher", dimensions: ["Month"], version: 1 },
  { key: "working_capital", name: "Working capital", definition: "Cash tied up, entered on the plan. Finance journals are not re-posted here.", owner: "Finance", source: "plan", unit: "money", aggregation: "none", direction: "lower", dimensions: ["Month"], sensitive: true, version: 1 },
  { key: "cash", name: "Cash", definition: "Planned cash. A live finance balance is not used until a governed cash metric is connected.", owner: "Finance", source: "plan", unit: "money", aggregation: "none", direction: "higher", dimensions: ["Month"], sensitive: true, version: 1 },
  { key: "marketing_pipeline", name: "Marketing pipeline", definition: "Pipeline value you attribute to marketing on this plan. Campaign records are not guessed into revenue.", owner: "Marketing", source: "plan", unit: "money", aggregation: "sum", direction: "higher", dimensions: ["Channel", "Month"], version: 1 },
];

const GLUE = new Set(["a", "an", "the", "by", "of", "for", "and", "or", "in", "on", "to", "this", "last", "next", "per", "vs", "versus", "show", "me"]);
const TIME = new Set(["day", "week", "month", "monthly", "quarter", "year", "yearly", "today", "ytd"]);

export function metricByKey(key: string): GovernedMetric | undefined {
  return METRICS.find((metric) => metric.key === key);
}

export function metricsFor(enabledModules: Set<string>, allowSensitive: boolean): GovernedMetric[] {
  return METRICS.filter((metric) => {
    if (metric.sensitive && !allowSensitive) return false;
    if (metric.source === "plan" || metric.source === "crm") return true;
    return enabledModules.has(metric.source);
  });
}

/** Returns every catalogue metric the words could mean. Callers must ask the user to pick when there is more than one. */
export function resolveMetricSearch(query: string, metrics: GovernedMetric[] = METRICS): GovernedMetric[] {
  const terms = query.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term && !GLUE.has(term) && !TIME.has(term));
  if (!terms.length) return [];
  const exact = metrics.filter((metric) => metric.name.toLowerCase() === query.trim().toLowerCase() || metric.key === query.trim().toLowerCase().replace(/\s+/g, "_"));
  if (exact.length === 1) return exact;
  return metrics.filter((metric) => {
    const hay = [metric.name, metric.key.replaceAll("_", " "), metric.definition, metric.owner, metric.source, ...metric.dimensions].join(" ").toLowerCase();
    return terms.every((term) => hay.includes(term));
  });
}

export type PlanPhase = {
  title: string;
  detail: string;
  start: number;
  end: number;
  actions: Array<{ title: string; detail: string; start: number; end: number }>;
};

export type PlanTemplate = {
  type: PlanType;
  purpose: string;
  metricKeys: string[];
  assumptions: Array<{ name: string; note: string }>;
  goals: Array<{ title: string; targetText: string; metricKey?: string; qualitative?: boolean; detail?: string }>;
  links: Array<{ fromKey: string; toKey: string; passthrough: number; note: string }>;
  phases?: PlanPhase[];
  cadence: string;
  sensitive?: boolean;
};

export const TEMPLATES: PlanTemplate[] = [
  {
    type: "company",
    purpose: "One view of what the company intends, what it now expects, and where the gap needs a decision.",
    metricKeys: ["revenue", "sales_volume", "pipeline", "otif", "production_demand", "production_capacity", "headcount", "working_capital"],
    assumptions: [
      { name: "Price change", note: "Replace this with the change you are actually planning, and the date it starts." },
      { name: "Win rate", note: "Used by a driver when you add one. Not applied until you use the projection." },
    ],
    goals: [
      { title: "Hit the revenue target", targetText: "Set the target on the revenue row", metricKey: "revenue" },
      { title: "Keep service and delivery promises", targetText: "Set OTIF and response targets", metricKey: "otif" },
    ],
    links: [
      { fromKey: "sales_volume", toKey: "production_demand", passthrough: 0.8, note: "Suggested only. 10% more volume would raise demand by 8% if you keep this." },
      { fromKey: "production_demand", toKey: "material_requirement", passthrough: 1, note: "Suggested only. Material spend is not calculated unless you keep this and enter a starting figure." },
      { fromKey: "sales_volume", toKey: "working_capital", passthrough: 0.5, note: "Suggested only. Cash impact stays blank until a starting working-capital figure exists." },
    ],
    cadence: "Monthly business review",
  },
  {
    type: "sales",
    purpose: "The revenue this period has to make, who will buy it, at what price, and whether the pipeline covers what is still to win.",
    metricKeys: ["revenue", "orders", "pipeline", "win_rate", "sales_volume", "customers_ordering", "quotes", "quote_value", "sales_activities"],
    assumptions: [
      { name: "Average selling price", note: "Enter the price the plan should use. It is not taken from today's invoices." },
      { name: "Discount limit", note: "How far a deal can move off that price before it leaves this plan." },
    ],
    goals: [
      { title: "Make the revenue number", targetText: "Set the revenue target by month", metricKey: "revenue", detail: "The number the rest of the plan has to explain: territory, product, account and price." },
      { title: "Cover what is still to win", targetText: "Pipeline against the remaining revenue", metricKey: "pipeline", detail: "Open pipeline should cover the revenue that confirmed orders have not reached yet." },
    ],
    links: [],
    phases: [
      { title: "The number", detail: "Agree the revenue, orders and volume this plan is committing to.", start: 0, end: 0.12, actions: [
        { title: "Set the revenue target by month", detail: "Write the intended revenue, then the forecast you currently expect.", start: 0, end: 0.08 },
        { title: "Set volume by product", detail: "The units behind the revenue, so production can see the same plan.", start: 0.04, end: 0.12 },
      ] },
      { title: "Where it is sold", detail: "Territories, products and the mix.", start: 0.08, end: 0.25, actions: [
        { title: "Name each territory and its owner", detail: "Split the revenue target. Plan will not guess the split.", start: 0.08, end: 0.18 },
        { title: "Write the product mix", detail: "Which products carry the number.", start: 0.12, end: 0.22 },
      ] },
      { title: "Who buys", detail: "Existing customers, and the new business the number needs.", start: 0.15, end: 0.4, actions: [
        { title: "List the accounts that make the number", detail: "Name the customers and opportunities this plan depends on.", start: 0.15, end: 0.3 },
        { title: "Separate new business from customers who already buy", detail: "Say how much of the number is new.", start: 0.2, end: 0.35 },
      ] },
      { title: "Price", detail: "The price and the discount the plan allows.", start: 0.1, end: 0.22, actions: [
        { title: "Write the price and the discount limit", detail: "This is the assumption the revenue uses. It is not copied from invoices.", start: 0.1, end: 0.2 },
      ] },
      { title: "Coverage", detail: "Pipeline, quotations and activity against what is still to win.", start: 0.25, end: 1, actions: [
        { title: "Check pipeline coverage", detail: "Open pipeline divided by the revenue still needed.", start: 0.25, end: 0.4 },
        { title: "Keep quotations moving", detail: "The quotes that have to be out if the number is going to land.", start: 0.3, end: 0.85 },
        { title: "Review the gap", detail: "What changed in the forecast, and the next action.", start: 0.7, end: 1 },
      ] },
    ],
    cadence: "Weekly sales review",
  },
  {
    type: "service",
    purpose: "Response, resolution and the hours available to deliver them.",
    metricKeys: ["csat", "first_response_hours", "resolution_hours", "complaints", "tickets", "labour_hours"],
    assumptions: [{ name: "Hours per new advisor", note: "Enter contracted hours. Hiring does nothing to the plan until you apply it." }],
    goals: [
      { title: "First response within the promise", targetText: "Set the hour target", metricKey: "first_response_hours" },
      { title: "Complaints stay within the limit", targetText: "Set the complaint target", metricKey: "complaints" },
    ],
    links: [],
    cadence: "Weekly service review",
  },
  {
    type: "manufacturing",
    purpose: "Demand, capacity and scheduled output. This does not replace Production Planning or the shop floor.",
    metricKeys: ["sales_volume", "production_demand", "production_capacity", "production_plan", "production_scheduled", "production_completed"],
    assumptions: [{ name: "Extra shift capacity", note: "Enter the units an extra shift would add. It stays an assumption until a scenario uses it." }],
    goals: [{ title: "Cover demand with capacity", targetText: "Capacity at least meets demand", metricKey: "production_capacity" }],
    links: [{ fromKey: "sales_volume", toKey: "production_demand", passthrough: 1, note: "Suggested only. Keep it if one extra unit sold needs one extra unit made." }],
    cadence: "Weekly operations review",
  },
  {
    type: "marketing",
    purpose: "Who the work is for, the offer, the channels, the spend, and the actions that get it launched and reviewed.",
    metricKeys: ["marketing_pipeline", "pipeline", "revenue"],
    assumptions: [{ name: "Cost to acquire", note: "Enter your planning assumption. It is not calculated from campaign spend." }],
    goals: [{ title: "Pipeline from marketing", targetText: "Set the contribution target", metricKey: "marketing_pipeline", detail: "The pipeline this plan is willing to claim. Campaign records are not guessed into revenue." }],
    links: [],
    phases: [
      { title: "Brief", detail: "Who it is for, the offer, and what good looks like.", start: 0, end: 0.2, actions: [
        { title: "Write who this is for", detail: "The audience, in enough detail that someone else could brief the work.", start: 0, end: 0.1 },
        { title: "Write the offer and what good looks like", detail: "What you are asking people to do, and the result that means it worked.", start: 0.05, end: 0.18 },
      ] },
      { title: "Channels and spend", detail: "Where it runs, and what you intend to spend.", start: 0.15, end: 0.4, actions: [
        { title: "Choose the channels", detail: "Name where the work will actually run.", start: 0.15, end: 0.28 },
        { title: "Set the spend", detail: "What you intend to spend, and what has to come back. This does not post to Finance.", start: 0.2, end: 0.35 },
      ] },
      { title: "Make and launch", detail: "The work itself, then the date it goes out.", start: 0.35, end: 0.7, actions: [
        { title: "Build the work", detail: "What has to be made before it can launch.", start: 0.35, end: 0.55 },
        { title: "Launch", detail: "The date it goes live, and who confirms it.", start: 0.55, end: 0.7 },
      ] },
      { title: "Learn", detail: "What came back, and the next action.", start: 0.7, end: 1, actions: [
        { title: "Record what came back", detail: "Pipeline, response, or the reason it did not land. Do not invent a revenue figure.", start: 0.72, end: 0.88 },
        { title: "Decide the next action", detail: "Continue, change, or stop. Write the decision on the plan.", start: 0.88, end: 1 },
      ] },
    ],
    cadence: "Monthly marketing review",
  },
  {
    type: "people",
    purpose: "Headcount and hours the plan depends on.",
    metricKeys: ["headcount", "labour_hours"],
    assumptions: [{ name: "Time to full productivity", note: "Describe the ramp in the note. A driver can use the percentages you enter." }],
    goals: [{ title: "Staff the plan", targetText: "Set the headcount target", metricKey: "headcount" }],
    links: [],
    cadence: "Monthly people review",
    sensitive: false,
  },
  {
    type: "finance",
    purpose: "The commercial plan expressed as cash and cost. It does not post to the ledger.",
    metricKeys: ["revenue", "labour_cost", "material_requirement", "working_capital", "cash"],
    assumptions: [{ name: "Collection timing", note: "Describe when cash is expected to arrive." }],
    goals: [{ title: "Keep cash within the plan", targetText: "Set the cash target", metricKey: "cash" }],
    links: [],
    cadence: "Monthly finance review",
    sensitive: true,
  },
  {
    type: "logistics",
    purpose: "Delivery performance and the volume the warehouse is being asked to move.",
    metricKeys: ["otif", "shipments", "warehouse_throughput", "sales_volume"],
    assumptions: [],
    goals: [{ title: "OTIF at the promised level", targetText: "Set the OTIF target", metricKey: "otif" }],
    links: [],
    cadence: "Weekly logistics review",
  },
  {
    type: "operations",
    purpose: "Whether sales, production, stock and people can support the same period.",
    metricKeys: ["sales_volume", "production_demand", "production_capacity", "stock_on_hand", "otif", "labour_hours"],
    assumptions: [],
    goals: [],
    links: [],
    cadence: "Weekly operations review",
  },
  {
    type: "growth",
    purpose: "A larger sales plan and the capacity, people, stock and cash it would need.",
    metricKeys: ["revenue", "sales_volume", "production_demand", "production_capacity", "labour_hours", "stock_on_hand", "working_capital"],
    assumptions: [],
    goals: [{ title: "Grow without breaking delivery", targetText: "Name the revenue goal", metricKey: "revenue" }],
    links: [
      { fromKey: "sales_volume", toKey: "production_demand", passthrough: 0.8, note: "Suggested only." },
      { fromKey: "production_demand", toKey: "labour_hours", passthrough: 0.4, note: "Suggested only. Hours move by 40% of the demand change if you keep this." },
    ],
    cadence: "Monthly growth review",
  },
  { type: "stock", purpose: "Stock the plan needs, next to what is available now.", metricKeys: ["stock_on_hand", "sales_volume", "production_demand"], assumptions: [], goals: [], links: [], cadence: "Monthly stock review" },
  { type: "purchasing", purpose: "Material the plan would buy. Purchasing orders are not created from here.", metricKeys: ["material_requirement", "production_demand"], assumptions: [], goals: [], links: [], cadence: "Monthly purchasing review" },
  { type: "projects", purpose: "The initiatives that need a project, and the result the plan is waiting for.", metricKeys: ["revenue"], assumptions: [], goals: [], links: [], cadence: "Monthly portfolio review" },
  { type: "safety", purpose: "Improvement work. This is not the workplace safety record.", metricKeys: [], assumptions: [], goals: [{ title: "Name the improvement", targetText: "Describe done", qualitative: true }], links: [], cadence: "Monthly safety review" },
  { type: "annual", purpose: "The year, with room for each department plan to roll in later.", metricKeys: ["revenue", "otif", "headcount", "cash"], assumptions: [], goals: [], links: [], cadence: "Quarterly strategy review" },
  { type: "quarterly", purpose: "The next quarter's targets, forecast and reviews.", metricKeys: ["revenue", "orders", "otif", "production_demand"], assumptions: [], goals: [], links: [], cadence: "Weekly review through the quarter" },
  { type: "custom", purpose: "", metricKeys: [], assumptions: [], goals: [], links: [], cadence: "Review" },
];

export function templateFor(type: string): PlanTemplate {
  return TEMPLATES.find((template) => template.type === type) ?? TEMPLATES[TEMPLATES.length - 1];
}

export function planTypeLabel(type: string): string {
  return PLAN_TYPES.find(([key]) => key === type)?.[1] ?? "Plan";
}
