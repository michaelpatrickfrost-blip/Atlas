/** Company restrictions override all role grants. Audit recording is unaffected. */
export const COMPANY_ACCESS_AREAS = [
  { id: "customers", label: "Customers", prefixes: ["customers."] },
  { id: "products", label: "Product catalogue", prefixes: ["core.products."] },
  { id: "pricing", label: "Pricing", prefixes: ["core.pricing."] },
  { id: "crm", label: "CRM", prefixes: ["sales.prospect.", "sales.opportunity.", "sales.pipeline.", "sales.activity.", "sales.forecast."] },
  { id: "sales", label: "Sales documents", prefixes: ["sales.order.", "sales.quote.", "sales.report."] },
  { id: "stock", label: "Inventory", prefixes: ["stock."] },
  { id: "planning", label: "Planning", prefixes: ["planning."] },
  { id: "manufacturing", label: "Manufacturing", prefixes: ["manufacturing."] },
  { id: "safety", label: "Safety", prefixes: ["safety."] },
  { id: "plan", label: "Plan", prefixes: ["plan."] },
  { id: "logistics", label: "Logistics", prefixes: ["logistics."] },
  { id: "people", label: "People", prefixes: ["people."] },
  { id: "scheduling", label: "Scheduling", prefixes: ["scheduling."] },
  { id: "teams", label: "Team planner", prefixes: ["teams."] },
  { id: "service", label: "Customer service", prefixes: ["service."] },
  { id: "marketing", label: "Marketing", prefixes: ["marketing."] },
  { id: "finance", label: "Finance", prefixes: ["finance."] },
  { id: "projects", label: "Projects", prefixes: ["projects."] },
  { id: "kpis", label: "Goals & KPIs", prefixes: ["kpis."] },
  { id: "analytics", label: "Dashboards", prefixes: ["analytics."] },
  { id: "audit", label: "Audit history", prefixes: ["core.audit.", "audit.", "echo."] },
] as const;

export function applyCompanyAccessRestrictions(capabilities: Set<string>, restricted: string[] = []) {
  const blocked = COMPANY_ACCESS_AREAS.filter((area) => restricted.includes(area.id)).flatMap((area) => [...area.prefixes]);
  return new Set([...capabilities].filter((capability) => !blocked.some((prefix) => capability.startsWith(prefix))));
}

export function hasCompanyAreaAccess(capabilities: Set<string>, area: { prefixes: readonly string[] }) {
  return [...capabilities].some((capability) => area.prefixes.some((prefix) => capability.startsWith(prefix)));
}
