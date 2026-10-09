import { db } from "@/core/db/client";
import { getImplementedModules, getModule, MODULE_CATALOGUE } from "@/core/modules/registry";
import type { ModuleManifest, ModuleNavItem } from "@/core/modules/types";
import type { Session } from "@/core/auth/session";
import { ATLAS_CAPABILITIES } from "@/core/admin/access";
import { can, canAny } from "@/core/permissions/check";
import { syncAdminCapabilities } from "@/core/permissions/role-sync";

export async function getEnabledModuleIds(organisationId: string): Promise<Set<string>> {
  const states = await db.moduleState.findMany({ where: { organisationId, }  });
  const enabled = new Set(states.filter((state) => state.enabled && state.entitled).map((state) => state.moduleId));
  return enabled;
}

/** True when this session belongs to active Atlas staff (independent platform grant). */
function isAtlasStaff(session: Session): boolean {
  return session.capabilities.has(ATLAS_CAPABILITIES.staff);
}

/** Every implemented app id. Atlas staff see all apps regardless of a company's enablement. */
function allImplementedModuleIds(): Set<string> {
  return new Set(getImplementedModules().map((module) => module.id));
}

/** Enabled app ids for this session's company, honouring the Atlas staff exception.
 *  Atlas staff must be able to open every app in every company, including the
 *  internal Atlas team workspace, which has no per-company enablement rows. */
export async function enabledModulesForSession(session: Session): Promise<Set<string>> {
  if (isAtlasStaff(session)) return allImplementedModuleIds();
  const enabled = await getEnabledModuleIds(session.organisationId);
  for (const entry of getImplementedModules()) if (entry.utility) enabled.add(entry.id);
  return enabled;
}

/** Whether one app is enabled for this session's company, honouring the Atlas staff exception. */
export async function isModuleEnabled(session: Session, moduleId: string): Promise<boolean> {
  if (getModule(moduleId)?.utility || isAtlasStaff(session)) return true;
  return (await getEnabledModuleIds(session.organisationId)).has(moduleId);
}

/** Modules enabled for this org AND accessible to this user, in catalogue order.
 *  This is what populates primary navigation — installing a module never requires
 *  editing navigation code. */
export function canOpenModule(session: Session, module: ModuleManifest) {
  if (module.audience === "customer" && isAtlasStaff(session)) return false;
  if (module.accessAnyOf?.length) return canAny(session, module.accessAnyOf);
  return can(session, module.accessCapability);
}

/** Source owners remain discoverable inside a consolidated workspace. No launcher filtering. */
export async function getAccessibleModules(session: Session): Promise<ModuleManifest[]> {
  const modules = getImplementedModules();
  const enabled = await enabledModulesForSession(session);
  return modules.filter(
    (module) => enabled.has(module.id) && canOpenModule(session, module),
  );
}

export async function getNavigableModules(session: Session): Promise<ModuleManifest[]> {
  const accessible = (await getAccessibleModules(session)).filter(module => module.launcherVisible !== false);
  return accessible.filter((module) => !module.launcherConsolidatedInto || !accessible.some((target) => target.id === module.launcherConsolidatedInto)).map((module) => module.id === "scheduling" && !can(session, "scheduling.manage") && !can(session, "people.rota.manage")
    ? { ...module, name: "My rota", description: "Your published shifts, hours and team." }
    : module);
}

/** A module's secondary navigation, filtered to items the user can see. */
export function getModuleNavigation(module: ModuleManifest, session: Session): ModuleNavItem[] {
  return module.navigation.filter((item) => {
    if (item.anyOf?.length) return canAny(session, item.anyOf);
    return !item.capability || can(session, item.capability);
  });
}

export async function setModuleEnabled(organisationId: string, moduleId: string, enabled: boolean) {
  const requestedModule = getModule(moduleId);
  if (requestedModule?.utility) throw new Error("Workspace utilities cannot be toggled.");
  if (!requestedModule || requestedModule.status === "coming_soon") throw new Error("This app is not available yet.");
  if (!enabled) {
    const enabledIds = await getEnabledModuleIds(organisationId);
    if (MODULE_CATALOGUE.some((entry) => enabledIds.has(entry.id) && entry.dependencies.includes(moduleId))) throw new Error("Disable dependent apps first.");
  }
  if (enabled) {
    const licence = await db.moduleState.findUnique({where:{organisationId_moduleId:{organisationId,moduleId}}});
    if (!licence?.entitled) throw new Error("This app is not included in your company account. Contact your Atlas administrator.");
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
  if (enabled) await syncAdminCapabilities(organisationId);
}

export async function getModuleStatesForOrg(organisationId: string) {
  const states = await db.moduleState.findMany({ where: { organisationId } });
  const stateByModuleId = new Map(states.map((state) => [state.moduleId, state.enabled]));
  return MODULE_CATALOGUE.filter(module => !module.utility).map((module) => ({
    module,
    enabled: (stateByModuleId.get(module.id) ?? false) && (states.find(s=>s.moduleId===module.id)?.entitled??false),
    entitled: states.find(s=>s.moduleId===module.id)?.entitled??false,
  }));
}
