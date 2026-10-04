import { logisticsManifest } from "@/modules/logistics/manifest";
import { financeManifest } from "@/modules/finance/manifest";
import { marketingManifest } from "@/modules/marketing/manifest";
import { serviceManifest } from "@/modules/service/manifest";
import { schedulingManifest } from "@/modules/scheduling/manifest";
import { teamsManifest } from "@/modules/teams/manifest";
import { analyticsManifest } from "@/modules/analytics/manifest";
import { planningManifest } from "@/modules/planning/manifest";
import { planManifest } from "@/modules/plan/manifest";
// import { ticketingManifest } from "@/modules/tickets/manifest"; // Disabled due to schema issues
// import { manufacturingManifest } from "@/modules/manufacturing/manifest"; // Disabled: schema mismatch, awaiting Postgres + schema migration
import type { ModuleManifest } from "@/core/modules/types";
import { salesManifest } from "@/modules/sales/manifest";
import { crmManifest } from "@/modules/crm/manifest";
import { projectsManifest } from "@/modules/projects/manifest";
import { stockManifest } from "@/modules/stock/manifest";
import { kpisManifest } from "@/modules/kpis/manifest";
import { productsManifest } from "@/modules/products/manifest";
import { pricingManifest } from "@/modules/pricing/manifest";
import { peopleManifest } from "@/modules/people/manifest";
import { payrollManifest } from "@/modules/payroll/manifest";
// import { manufacturingManifest } from "@/modules/manufacturing/manifest";
import { safetyManifest } from "@/modules/safety/manifest";
import { auditManifest } from "@/modules/audit/manifest";
import { qualityManifest } from "@/modules/quality/manifest";
import { stubModules } from "@/modules/stubs";

/**
 * The module catalogue: every module Atlas knows about, implemented or not.
 * This is the single place a new module registers itself. Per-organisation
 * enable/disable state lives in the database (ModuleState) — see runtime.ts.
 */
const implemented = [
  crmManifest, salesManifest, projectsManifest, stockManifest, kpisManifest,
  productsManifest, pricingManifest, peopleManifest, schedulingManifest,
  payrollManifest, teamsManifest, planningManifest, planManifest,
  analyticsManifest, serviceManifest, marketingManifest, financeManifest,
  logisticsManifest, /* manufacturingManifest disabled */, safetyManifest,
  auditManifest, qualityManifest, /* ticketingManifest disabled */
];

const stubs = stubModules.filter(m =>
  !["projects","stock","people","scheduling","payroll","service","marketing","finance","purchasing","logistics","manufacturing","safety","quality","tickets"].includes(m.id)
);

export const MODULE_CATALOGUE = [...implemented, ...stubs].filter((m): m is ModuleManifest => m !== undefined && m !== null);

export function getModule(moduleId: string): ModuleManifest | undefined {
  return MODULE_CATALOGUE.find((entry) => entry.id === moduleId);
}

export function getImplementedModules(): ModuleManifest[] {
  return MODULE_CATALOGUE.filter((entry) => entry.status !== "coming_soon");
}

/** Dependency ids that are not yet enabled for the given set of enabled module ids. */
export function getMissingDependencies(moduleId: string, enabledModuleIds: Set<string>): string[] {
  const entry = getModule(moduleId);
  if (!entry) return [];
  return entry.dependencies.filter((dependencyId) => !enabledModuleIds.has(dependencyId));
}
