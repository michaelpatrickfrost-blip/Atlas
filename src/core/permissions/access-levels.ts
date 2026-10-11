import { STUDIO_DATA_CAPABILITIES } from "@/core/studio/permissions";

export type AccessLevel = "none" | "read" | "write" | "admin";
export type AccessGroup = { id: string; name: string; capabilities: string[] };
/** Presets expand into the same granular capabilities enforced by business services. */
export function capabilityLevel(cap: string): Exclude<AccessLevel, "none"> {
  const action = cap.split(".").at(-1) ?? "";
  if (["read", "self", "view"].includes(action)) return "read";
  if (
    [
      "decide",
      "verify",
      "post",
      "execute",
      "reopen",
      "approve",
      "reveal",
      "delete",
      "archive",
      "cancel",
      "configure",
      "price_override",
      "confirm",
      "authorise",
      "close",
      "dispatch",
      "firm",
      "issue",
      "lock",
      "override",
      "release",
      "remove",
      "restricted",
      "resolve",
      "publish",
      "activate",
      "finalise",
      "finalize",
      "pay",
      "restore",
      "purge",
    ].includes(action) ||
    cap === "finance.period.manage" ||
    cap.startsWith("core.roles.") ||
    cap.startsWith("core.users.") ||
    cap.startsWith("core.modules.") ||
    cap.startsWith("core.it.")
  )
    return "admin";
  return "write";
}
export function presetCapabilities(group: AccessGroup, level: AccessLevel) {
  const rank = { none: 0, read: 1, write: 2, admin: 3 };
  return group.capabilities.filter(
    (cap) => cap !== STUDIO_DATA_CAPABILITIES.liveTest && rank[capabilityLevel(cap)] <= rank[level],
  );
}
export function effectiveRoleCapabilities(
  roles: Iterable<{ capabilities: string[] }>,
  granted: string[] = [],
  denied: string[] = [],
) {
  const caps = new Set([...roles].flatMap((role) => role.capabilities));
  for (const cap of granted) caps.add(cap);
  for (const cap of denied) caps.delete(cap);
  return caps;
}
export function capabilityOverrides(base: Set<string>, selected: Set<string>) {
  return {
    grantedCapabilities: [...selected].filter((cap) => !base.has(cap)),
    deniedCapabilities: [...base].filter((cap) => !selected.has(cap)),
  };
}

export function permissionLabel(value: string) {
  if (value === STUDIO_DATA_CAPABILITIES.liveTest) return "Use live business data in Studio previews";
  return value
    .split(/[._]/)
    .filter(Boolean)
    .map((word) =>
      word === "kpi"
        ? "KPI"
        : word === "hr"
          ? "HR"
          : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}
export function accessSections(group: AccessGroup): AccessGroup[] {
  const sections = new Map<string, string[]>();
  for (const cap of group.capabilities) {
    const id = cap.split(".").slice(0, -1).join(".");
    sections.set(id, [...(sections.get(id) ?? []), cap]);
  }
  return [...sections].map(([id, capabilities]) => ({
    id,
    name: permissionLabel(id.split(".").slice(1).join(".")) || group.name,
    capabilities,
  }));
}
export function selectedAccessLevel(
  group: AccessGroup,
  selected: ReadonlySet<string>,
): AccessLevel | "custom" {
  const actual = group.capabilities.filter((cap) => selected.has(cap));
  return (
    (["none", "read", "write", "admin"] as AccessLevel[]).find((level) => {
      const expected = presetCapabilities(group, level);
      return (
        expected.length === actual.length &&
        expected.every((cap) => selected.has(cap))
      );
    }) ?? "custom"
  );
}
/** Retain intentional exceptions when profiles are mixed; do not discard unsaved edits. */
export function remixRoleAccess(
  roles: Array<{ id: string; capabilities: string[] }>,
  before: ReadonlySet<string>,
  after: ReadonlySet<string>,
  selected: Set<string>,
  granted: string[] = [],
  denied: string[] = [],
) {
  const delta = capabilityOverrides(
    effectiveRoleCapabilities(roles.filter((role) => before.has(role.id))),
    selected,
  );
  return effectiveRoleCapabilities(
    roles.filter((role) => after.has(role.id)),
    [
      ...new Set([
        ...granted.filter((cap) => selected.has(cap)),
        ...delta.grantedCapabilities,
      ]),
    ],
    [
      ...new Set([
        ...denied.filter((cap) => !selected.has(cap)),
        ...delta.deniedCapabilities,
      ]),
    ],
  );
}
