import { db } from "@/core/db/client";
import { getImplementedModules, getModule, MODULE_CATALOGUE } from "@/core/modules/registry";
import type { ModuleManifest, ModuleNavItem } from "@/core/modules/types";
import type { Session } from "@/core/auth/session";
import { can } from "@/core/permissions/check";

export async function getEnabledModuleIds(organisationId: string): Promise<Set<string>> {
  const states = await db.moduleState.findMany({ where: { organisationId, enabled: true } });
  return new Set(states.map((state) => state.moduleId));
}

/** Modules enabled for this org AND accessible to this user, in catalogue order.
 *  This is what populates primary navigation — installing a module never requires
 *  editing navigation code. */
export async function getNavigableModules(session: Session): Promise<ModuleManifest[]> {
  const enabled = await getEnabledModuleIds(session.organisationId);
  return getImplementedModules().filter(
    (module) => enabled.has(module.id) && can(session, module.accessCapability),
  );
}

/** A module's secondary navigation, filtered to items the user can see. */
export function getModuleNavigation(module: ModuleManifest, session: Session): ModuleNavItem[] {
  return module.navigation.filter((item) => !item.capability || can(session, item.capability));
}

export async function setModuleEnabled(organisationId: string, moduleId: string, enabled: boolean) {
  if (enabled) {
    const enabledIds = await getEnabledModuleIds(organisationId);
    const entry = getModule(moduleId);
    if (!entry) throw new Error(`Unknown module "${moduleId}"`);
    const missing = entry.dependencies.filter((dependencyId) => !enabledIds.has(dependencyId));
    if (missing.length > 0) {
      throw new Error(`Cannot enable "${moduleId}": requires ${missing.join(", ")} to be enabled first.`);
    }
  }

  await db.moduleState.upsert({
    where: { organisationId_moduleId: { organisationId, moduleId } },
    create: { organisationId, moduleId, enabled },
    update: { enabled },
  });
}

export async function getModuleStatesForOrg(organisationId: string) {
  const states = await db.moduleState.findMany({ where: { organisationId } });
  const stateByModuleId = new Map(states.map((state) => [state.moduleId, state.enabled]));
  return MODULE_CATALOGUE.map((module) => ({
    module,
    enabled: stateByModuleId.get(module.id) ?? false,
  }));
}
