import type { ModuleManifest } from "@/core/modules/types";
import { salesManifest } from "@/modules/sales/manifest";
import { stubModules } from "@/modules/stubs";

/**
 * The module catalogue: every module Atlas knows about, implemented or not.
 * This is the single place a new module registers itself. Per-organisation
 * enable/disable state lives in the database (ModuleState) — see runtime.ts.
 */
export const MODULE_CATALOGUE: ModuleManifest[] = [salesManifest, ...stubModules];

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
