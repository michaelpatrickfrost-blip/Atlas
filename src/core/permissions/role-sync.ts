import { db } from "@/core/db/client";
import { STANDARD_ROLES } from "@/core/permissions/capabilities";

/**
 * Role capabilities are copied into each company's `roles` rows when it is created, so a module
 * shipped later never reaches existing administrators and its pages fail with FORBIDDEN.
 * This adds - never removes - the standard Administrator capabilities for the modules a company
 * has enabled. Narrower roles are left exactly as the company set them; per-person limits
 * (denied capabilities, restricted areas) still apply on top.
 */
export function missingAdminCapabilities(current: readonly string[], enabledPrefixes: ReadonlySet<string>): string[] {
  const admin = STANDARD_ROLES.find((role) => role.key === "admin");
  if (!admin) return [];
  const have = new Set(current);
  return admin.capabilities.filter((capability) => {
    if (have.has(capability)) return false;
    const area = capability.split(".")[0];
    return area === "core" || enabledPrefixes.has(area);
  });
}

const AREA_ALIASES: Record<string, string[]> = {
  people: ["people", "hr"], sales: ["sales", "customers"], crm: ["sales"], stock: ["stock"],
  audit: ["echo", "audit"], products: ["core"], pricing: ["core"], scheduling: ["scheduling"],
};

export async function syncAdminCapabilities(organisationId: string): Promise<string[]> {
  const [role, states] = await Promise.all([
    db.role.findUnique({ where: { organisationId_key: { organisationId, key: "admin" } } }),
    db.moduleState.findMany({ where: { organisationId, enabled: true, entitled: true }, select: { moduleId: true } }),
  ]);
  if (!role) return [];
  const areas = new Set<string>();
  for (const state of states) for (const area of AREA_ALIASES[state.moduleId] ?? [state.moduleId]) areas.add(area);
  const add = missingAdminCapabilities(role.capabilities, areas);
  if (!add.length) return [];
  await db.role.update({ where: { id: role.id }, data: { capabilities: [...role.capabilities, ...add] } });
  return add;
}
