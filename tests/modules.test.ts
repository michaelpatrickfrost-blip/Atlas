import { describe, expect, it } from "vitest";
import { getImplementedModules, getMissingDependencies, getModule, MODULE_CATALOGUE } from "@/core/modules/registry";

describe("module registry", () => {
  it("registers the implemented apps separately from future stubs", () => {
    const implemented = getImplementedModules();
    expect(implemented.map((m) => m.id)).toEqual(["templates", "crm", "sales", "projects", "stock", "kpis", "products", "pricing", "people", "scheduling", "payroll", "teams", "planning", "plan", "analytics", "service", "marketing", "finance", "logistics", "manufacturing", "safety", "audit", "quality", "automations", "csat"]);
  });

  it("every module id in the catalogue is unique", () => {
    const ids = MODULE_CATALOGUE.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("flags missing dependencies when a dependency isn't enabled", () => {
    const missing = getMissingDependencies("manufacturing", new Set());
    expect(missing).toEqual(["stock", "products", "sales"]);
  });

  it("reports no missing dependencies once the dependency is enabled", () => {
    const missing = getMissingDependencies("manufacturing", new Set(["stock", "products", "sales"]));
    expect(missing).toEqual([]);
  });

  it("returns an empty list for an unknown module id", () => {
    expect(getModule("does-not-exist")).toBeUndefined();
    expect(getMissingDependencies("does-not-exist", new Set())).toEqual([]);
  });
});
