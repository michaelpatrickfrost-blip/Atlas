import { describe, it, expect } from "vitest";
import {
  accessSections,
  presetCapabilities,
  selectedAccessLevel,
  remixRoleAccess,
} from "@/core/permissions/access-levels";
import {
  roleAccessRevision,
  memberAccessRevision,
} from "@/core/permissions/access-revision";
import { accessGroups } from "@/app/(app)/settings/access-groups";
import { MODULE_CATALOGUE } from "@/core/modules/registry";
import {
  CORE_CAPABILITIES,
  CUSTOMER_CAPABILITIES,
} from "@/core/permissions/capabilities";
describe("section profiles and mixed exceptions", () => {
  const group = {
    id: "sales",
    name: "Sales",
    capabilities: [
      "sales.order.read",
      "sales.order.create",
      "sales.order.confirm",
      "sales.quote.read",
      "sales.quote.create",
      "sales.quote.approve",
    ],
  };
  it("breaks apps into independent source sections", () => {
    const sections = accessSections(group);
    expect(sections.map((s) => s.id)).toEqual(["sales.order", "sales.quote"]);
    expect(presetCapabilities(sections[0], "write")).toEqual([
      "sales.order.read",
      "sales.order.create",
    ]);
    expect(
      selectedAccessLevel(
        group,
        new Set(["sales.order.read", "sales.order.create", "sales.quote.read"]),
      ),
    ).toBe("custom");
  });
  it("reserves publication, activation and payroll completion for Admin presets", () => {
    const g = {
      id: "s",
      name: "s",
      capabilities: [
        "studio.definition.read",
        "studio.definition.edit",
        "studio.definition.publish",
        "studio.definition.activate",
        "payroll.run.finalise",
        "core.it.manage",
      ],
    };
    expect(presetCapabilities(g, "write")).toEqual([
      "studio.definition.read",
      "studio.definition.edit",
    ]);
    expect(presetCapabilities(g, "admin")).toEqual(g.capabilities);
  });
  it("keeps explicit grants, denials and unsaved fine-tuning while mixing profiles", () => {
    const roles = [
      { id: "a", capabilities: ["read", "edit"] },
      { id: "b", capabilities: ["approve", "bank"] },
    ];
    expect(
      [
        ...remixRoleAccess(
          roles,
          new Set(["a"]),
          new Set(["a", "b"]),
          new Set(["read", "special"]),
          ["special"],
          ["bank"],
        ),
      ].sort(),
    ).toEqual(["approve", "read", "special"]);
  });
  it("offers every implemented native capability once, including new HR sections", () => {
    const offered = accessGroups().flatMap((g) => g.capabilities);
    expect(new Set(offered).size).toBe(offered.length);
    for (const cap of [
      ...Object.values(CORE_CAPABILITIES),
      ...Object.values(CUSTOMER_CAPABILITIES),
      ...MODULE_CATALOGUE.filter((m) => m.status !== "coming_soon").flatMap(
        (m) => m.capabilities,
      ),
    ])
      if (cap !== "core.profile.self" && !cap.startsWith("atlas."))
        expect(offered).toContain(cap);
    expect(offered.some((c) => c.startsWith("atlas."))).toBe(false);
  });
  it("normalises snapshot order but detects role, user or catalogue changes", () => {
    const r = { id: "r", name: "Team", capabilities: ["read", "edit"] };
    expect(roleAccessRevision(r)).toBe(
      roleAccessRevision({ ...r, capabilities: ["edit", "read"] }),
    );
    expect(roleAccessRevision({ ...r, name: "Renamed" })).not.toBe(
      roleAccessRevision(r),
    );
    const m = {
      id: "m",
      sessionVersion: 0,
      grantedCapabilities: [],
      deniedCapabilities: [],
      roles: [{ roleId: r.id, role: r }],
    };
    expect(memberAccessRevision(m, [r])).not.toBe(
      memberAccessRevision({ ...m, sessionVersion: 1 }, [r]),
    );
    expect(memberAccessRevision(m, [r])).not.toBe(
      memberAccessRevision(m, [
        r,
        { id: "new", name: "New", capabilities: [] },
      ]),
    );
  });
});
