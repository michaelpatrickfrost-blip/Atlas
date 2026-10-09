import { createHash } from "node:crypto";
/** Snapshot comparison for concurrent access editors; authorisation is checked independently. */
export function roleAccessRevision(role: {
  id: string;
  name: string;
  capabilities: string[];
}) {
  return createHash("sha256")
    .update(JSON.stringify([role.id, role.name, [...role.capabilities].sort()]))
    .digest("hex");
}
export function memberAccessRevision(
  member: {
    id: string;
    sessionVersion: number;
    grantedCapabilities: string[];
    deniedCapabilities: string[];
    roles: Array<{
      roleId: string;
      role: { id: string; name: string; capabilities: string[] };
    }>;
  },
  catalogue: Array<{ id: string; name: string; capabilities: string[] }> = [],
) {
  return createHash("sha256")
    .update(
      JSON.stringify([
        member.id,
        member.sessionVersion,
        [...member.grantedCapabilities].sort(),
        [...member.deniedCapabilities].sort(),
        member.roles
          .map((r) => [r.roleId, roleAccessRevision(r.role)])
          .sort((a, b) => a[0].localeCompare(b[0])),
        catalogue.map(roleAccessRevision).sort(),
      ]),
    )
    .digest("hex");
}
