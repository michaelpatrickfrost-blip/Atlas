/** Platform grants are independent of all customer roles and membership overrides. */
export const ATLAS_CAPABILITIES = {
  companies: "atlas.companies.manage",
  users: "atlas.users.manage",
  staff: "atlas.staff.manage",
  archive: "atlas.companies.archive",
  export: "atlas.data.export",
} as const;

export const ATLAS_STAFF_ROLES = {
  OWNER: { name: "Atlas Owner", description: "Company and user administration, Atlas team, archives and full exports.", capabilities: Object.values(ATLAS_CAPABILITIES) },
  ADMIN: { name: "Atlas Administrator", description: "Full platform administration and full company permissions.", capabilities: Object.values(ATLAS_CAPABILITIES) },
  EMPLOYEE: { name: "Atlas Employee", description: "Full platform administration and full company permissions (current policy).", capabilities: Object.values(ATLAS_CAPABILITIES) },
} as const;
export type AtlasStaffRole = keyof typeof ATLAS_STAFF_ROLES;
export function isStaffRole(value: string): value is AtlasStaffRole { return value === "OWNER" || value === "ADMIN" || value === "EMPLOYEE"; }
export function platformCapabilities(grant: { role?: string; active?: boolean } | null | undefined): readonly string[] {
  if (!grant || grant.active === false) return [];
  // Old in-memory clients/test fixtures may omit role; DB migration makes it mandatory.
  const role = grant.role ?? "OWNER";
  return isStaffRole(role) ? ATLAS_STAFF_ROLES[role].capabilities : [];
}
