import { describe, expect, it } from "vitest";
import { getImplementedModules, getMissingDependencies, getModule, MODULE_CATALOGUE } from "@/core/modules/registry";

describe("module registry", () => {
  it("registers sales as implemented and every stub as coming_soon", () => {
    const implemented = getImplementedModules();
    expect(implemented.map((m) => m.id)).toEqual(["sales"]);
  });

  it("every module id in the catalogue is unique", () => {
    const ids = MODULE_CATALOGUE.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("flags missing dependencies when a dependency isn't enabled", () => {
    const missing = getMissingDependencies("manufacturing", new Set());
    expect(missing).toEqual(["stock"]);
  });

  it("reports no missing dependencies once the dependency is enabled", () => {
    const missing = getMissingDependencies("manufacturing", new Set(["stock"]));
    expect(missing).toEqual([]);
  });

  it("returns an empty list for an unknown module id", () => {
    expect(getModule("does-not-exist")).toBeUndefined();
    expect(getMissingDependencies("does-not-exist", new Set())).toEqual([]);
  });
});
