/** Every recorded action belongs to one system. Unlisted prefixes stay visible
 *  under "Not yet classified" so a new trail cannot disappear from Audit. */
export type AuditSystem = {
  id: string;
  name: string;
  summary: string;
  prefixes: string[];
};

export const AUDIT_SYSTEMS: AuditSystem[] = [
  { id: "customers", name: "Customers", summary: "Accounts, contacts, addresses, credit, tax and bank changes.", prefixes: ["customer."] },
  { id: "sales", name: "Sales", summary: "Quotations, orders, call-offs, holds and approvals.", prefixes: ["order.", "quote."] },
  { id: "crm", name: "CRM", summary: "Prospects and opportunities.", prefixes: ["prospect.", "opportunity."] },
  { id: "pricing", name: "Pricing", summary: "Price lists and commercial agreements.", prefixes: ["pricelist.", "agreement."] },
  { id: "products", name: "Products", summary: "Catalogue and engineering changes.", prefixes: ["product."] },
  { id: "stock", name: "Inventory", summary: "Warehouses, balances and movements.", prefixes: ["stock.", "inventory."] },
  { id: "people", name: "HR", summary: "Employees, leave, policies, performance plans, disciplinary cases, appraisals, timesheets and expenses.", prefixes: ["employee.", "absence.", "leave_request.", "appraisal.", "one_to_one.", "expense_claim.", "payroll.", "rota.", "timesheet.", "policy.", "performance_plan.", "disciplinary."] },
  { id: "scheduling", name: "Scheduling", summary: "Hours and rota budgets.", prefixes: ["scheduling."] },
  { id: "planning", name: "Planning", summary: "Production plans and assigned work.", prefixes: ["planning."] },
  { id: "plan", name: "Plan", summary: "Business plans, forecasts, scenarios and decisions.", prefixes: ["plan."] },
  { id: "manufacturing", name: "Manufacturing", summary: "Production orders, work orders and scrap.", prefixes: ["manufacturing."] },
  { id: "logistics", name: "Logistics", summary: "Picking, packing, receipts, shipments and returns.", prefixes: ["logistics."] },
  { id: "finance", name: "Finance", summary: "Documents, journals, suppliers, periods and approvals.", prefixes: ["finance.", "approval."] },
  { id: "projects", name: "Projects", summary: "Projects, tasks and work records.", prefixes: ["project."] },
  { id: "service", name: "Customer service", summary: "Cases, tickets and queues.", prefixes: ["service."] },
  { id: "marketing", name: "Marketing", summary: "Campaigns, audiences and lead handoff.", prefixes: ["marketing."] },
  { id: "kpis", name: "Goals", summary: "KPI updates.", prefixes: ["kpi."] },
  { id: "chat", name: "Chat", summary: "Company and direct messages.", prefixes: ["chat."] },
  { id: "echo", name: "Echo", summary: "Notes and mentions left on a record.", prefixes: ["echo."] },
  { id: "company", name: "Company", summary: "People, roles, access and company settings.", prefixes: ["company.", "membership.", "account.", "role.", "user.", "management.", "module.", "atlas."] },
];

export const UNCLASSIFIED_SYSTEM: AuditSystem = {
  id: "other",
  name: "Not yet classified",
  summary: "Recorded changes whose action is not on the system map yet.",
  prefixes: [],
};

export function systemForAction(action: string): AuditSystem {
  let match: AuditSystem | undefined;
  let length = 0;
  for (const system of AUDIT_SYSTEMS) {
    for (const prefix of system.prefixes) {
      if (action.startsWith(prefix) && prefix.length > length) {
        match = system;
        length = prefix.length;
      }
    }
  }
  return match ?? UNCLASSIFIED_SYSTEM;
}

export function actionLabel(action: string): string {
  const words = action.split(/[._]/).filter(Boolean);
  if (!words.length) return "Recorded change";
  const [first, ...rest] = words;
  return [first.charAt(0).toUpperCase() + first.slice(1), ...rest].join(" ");
}

const HIDDEN_CHANGE = /password|token|secret|iban|account|sort|fingerprint|hash|credential/i;

/** A short, readable change line. Objects, lists and secret-looking fields stay out. */
export function publicChange(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const parts: string[] = [];
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (HIDDEN_CHANGE.test(key)) continue;
    if (typeof item !== "string" && typeof item !== "number" && typeof item !== "boolean") continue;
    const text = String(item).trim().slice(0, 80);
    if (!text) continue;
    parts.push(`${key.replaceAll("_", " ")} ${text}`);
    if (parts.length === 3) break;
  }
  return parts.join(" · ") || null;
}

export type EchoTarget = {
  type: string;
  capability: string;
  href: (id: string) => string;
};

export const ECHO_TARGETS: EchoTarget[] = [
  { type: "Party", capability: "customers.read", href: (id) => `/customers/${id}` },
  { type: "SalesOrder", capability: "sales.order.read", href: (id) => `/sales/orders/${id}` },
  { type: "Quote", capability: "sales.quote.read", href: (id) => `/sales/quotes/${id}` },
  { type: "SalesAgreement", capability: "sales.order.read", href: (id) => `/sales/agreements/${id}` },
];

export function echoTarget(entityType: string): EchoTarget | undefined {
  return ECHO_TARGETS.find((target) => target.type === entityType);
}

export function recordHref(entityType: string, entityId: string): string | null {
  const target = echoTarget(entityType);
  if (target) return `${target.href(entityId)}?echo=1`;
  const paths: Record<string, string> = {
    Opportunity: `/crm/opportunities/${entityId}`,
    Prospect: `/crm/prospect/${entityId}`,
    Employee: `/people/${entityId}`,
    PriceList: `/pricing/${entityId}`,
    CommercialAgreement: `/pricing/agreements/${entityId}`,
    Project: `/projects/${entityId}`,
    ManufacturingOrder: `/manufacturing/produce/${entityId}`,
    Shipment: `/logistics/shipments/${entityId}`,
    FinanceDocument: `/finance/documents/${entityId}`,
    FulfilmentRequirement: `/logistics/fulfil/${entityId}`,
  };
  return paths[entityType] ?? null;
}

/** Direct reports and members of teams this person manages, including themselves. */
export function collectTeamUserIds(input: {
  viewerUserId: string;
  directReportUserIds: Array<string | null>;
  managedTeamMemberUserIds: string[];
}): string[] {
  return [...new Set([
    input.viewerUserId,
    ...input.directReportUserIds.filter((id): id is string => Boolean(id)),
    ...input.managedTeamMemberUserIds,
  ])];
}
