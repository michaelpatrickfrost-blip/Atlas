import { getImplementedModules } from "@/core/modules/registry";
import { enabledModulesForSession, getEnabledModuleIds } from "@/core/modules/runtime";
import { CapabilityRegistry, type ModuleAvailability } from "./registry";
import { templateProviderAdapter } from "./adapters";

/** A fresh registry avoids cross-request tenant caches and mutable global registration. */
export function buildRegistry(available: ModuleAvailability): CapabilityRegistry {
  const registry = new CapabilityRegistry(available);
  const bundles = getImplementedModules().map(manifest => ({ owner: manifest.id,
    contributions: [...(manifest.studio?.contributions ?? []), ...templateProviderAdapter(manifest)] }));
  // Declarative View owners register before Page owners that explicitly embed
  // them. No module-order assumption, duplicate registration or relaxed checks:
  // all remaining owning entities/queries/Page sources keep their atomic bundle.
  for (const bundle of bundles) registry.register(bundle.owner, { contributions: bundle.contributions.filter(item => item.viewSource !== undefined) });
  for (const bundle of bundles) registry.register(bundle.owner, { contributions: bundle.contributions.filter(item => item.viewSource === undefined) });
  return registry;
}
/** Studio composition honours the company's enabled/entitled source modules. */
export function studioRegistry(): CapabilityRegistry {
  return buildRegistry(async (session, id) => (await getEnabledModuleIds(session.organisationId)).has(id));
}
/** Existing Templates retains its staff-aware workspace access during migration. */
export function templateRegistry(): CapabilityRegistry {
  return buildRegistry(async (session, id) => (await enabledModulesForSession(session)).has(id));
}
