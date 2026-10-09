import type { ModuleManifest } from "./types";

export type WorkspaceFeature = { module: ModuleManifest; enabled: boolean; entitled: boolean };
export type WorkspaceApp = WorkspaceFeature & { features: WorkspaceFeature[] };

/** One app card per workspace; source access switches stay attached and unchanged. */
export function groupWorkspaceApps(states: WorkspaceFeature[]): WorkspaceApp[] {
  const ids = new Set(states.map(({ module }) => module.id));
  return states.filter(({ module }) => !module.launcherConsolidatedInto || !ids.has(module.launcherConsolidatedInto))
    .map((entry) => ({ ...entry, features: states.filter(({ module }) => module.launcherConsolidatedInto === entry.module.id) }));
}
