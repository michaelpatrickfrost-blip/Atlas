/** Platform grants are independent of all customer roles and membership overrides. */
export const ATLAS_CAPABILITIES = {
  companies: "atlas.companies.manage",
  users: "atlas.users.manage",
  businessUsersCreate: "atlas.business_users.create",
  staff: "atlas.staff.manage",
  archive: "atlas.companies.archive",
  export: "atlas.data.export",
} as const;

export const ATLAS_STAFF_ROLES = {
  OWNER: { name: "Atlas Owner", description: "Company and user administration, Atlas team, archives and full exports.", capabilities: Object.values(ATLAS_CAPABILITIES) },
  ADMIN: { name: "Atlas Administrator", description: "Full platform administration and full company permissions.", capabilities: Object.values(ATLAS_CAPABILITIES) },
  EMPLOYEE: { name: "Atlas Employee", description: "Platform/company access; business-user provisioning requires an Atlas administrator.", capabilities: Object.values(ATLAS_CAPABILITIES).filter(cap => cap !== ATLAS_CAPABILITIES.businessUsersCreate) },
} as const;
export type AtlasStaffRole = keyof typeof ATLAS_STAFF_ROLES;
export function isStaffRole(value: string): value is AtlasStaffRole { return value === "OWNER" || value === "ADMIN" || value === "EMPLOYEE"; }
export function platformCapabilities(grant: { role?: string; active?: boolean } | null | undefined): readonly string[] {
  if (!grant || grant.active === false) return [];
  // Old in-memory clients/test fixtures may omit role; DB migration makes it mandatory.
  const role = grant.role ?? "OWNER";
  return isStaffRole(role) ? ATLAS_STAFF_ROLES[role].capabilities : [];
}

/** Atlas staff provisioning is reserved to Michael's signed-in Atlas staff identity. */
export function canCreateUsers(session: { userEmail?: string; capabilities: ReadonlySet<string> }): boolean {
  return session.userEmail?.trim().toLowerCase() === "kickablur@icloud.com" && session.capabilities.has(ATLAS_CAPABILITIES.staff);
}
export function assertUserProvisioner(session: { userEmail?: string; capabilities: ReadonlySet<string> }): void {
  if (!canCreateUsers(session)) throw new Error("FORBIDDEN: Only Michael can add Atlas users.");
}


/** Atlas administrators may provision business identities; staff identities stay Michael-only. */
export function canCreateBusinessUsers(session: { userEmail?: string; capabilities: ReadonlySet<string> }): boolean {
  return canCreateUsers(session) || (session.capabilities.has(ATLAS_CAPABILITIES.staff) && session.capabilities.has(ATLAS_CAPABILITIES.businessUsersCreate));
}
export function assertBusinessUserProvisioner(session: { userEmail?: string; capabilities: ReadonlySet<string> }): void {
  if (!canCreateBusinessUsers(session)) throw new Error("FORBIDDEN: Business users must be created by an Atlas administrator.");
}
