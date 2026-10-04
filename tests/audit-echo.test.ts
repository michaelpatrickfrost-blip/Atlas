import { describe, expect, it } from "vitest";
import { actionLabel, collectTeamUserIds, publicChange, recordHref, systemForAction, UNCLASSIFIED_SYSTEM } from "@/core/audit/systems";
import { echoNoteScope } from "@/core/audit/scope";
import { applyCompanyAccessRestrictions } from "@/core/permissions/company-access";
import {
  assignAuditAreas,
  auditReportCsv,
  auditSearchWhere,
  auditSessionCapabilities,
  auditVisibility,
  echoChangeVisible,
  parseAuditAccess,
  personInAuditView,
  setOwnActivity,
} from "@/core/audit/access";
import { canReadModel, modelScope } from "@/server/data-api/read-policy";
import type { Session } from "@/core/auth/session";

const session = {
  organisationId: "tenant-a",
  userId: "viewer",
  capabilities: new Set(["echo.read", "customers.read", "sales.order.read"]),
} as Session;

describe("audit system map", () => {
  it("places recorded actions on the system that owns them", () => {
    expect(systemForAction("order.confirmed").id).toBe("sales");
    expect(systemForAction("quote.sent").id).toBe("sales");
    expect(systemForAction("customer.bank_account.revealed").id).toBe("customers");
    expect(systemForAction("logistics.order.released").id).toBe("logistics");
    expect(systemForAction("finance.journal.posted").id).toBe("finance");
    expect(systemForAction("echo.note.added").id).toBe("echo");
    expect(systemForAction("employee.created").id).toBe("people");
    expect(systemForAction("membership.access.updated").id).toBe("company");
  });

  it("keeps an unmapped action visible instead of dropping it", () => {
    expect(systemForAction("future.widget.saved")).toBe(UNCLASSIFIED_SYSTEM);
  });

  it("labels an action and hides secret-looking change fields", () => {
    expect(actionLabel("order.hold_added")).toBe("Order hold added");
    expect(publicChange({ status: "CONFIRMED", iban: "secret", nested: { a: 1 } })).toBe("status CONFIRMED");
  });

  it("opens Echo on the record a person was pointed at", () => {
    expect(recordHref("SalesOrder", "ord-1")).toBe("/sales/orders/ord-1?echo=1");
    expect(recordHref("Party", "cus-1")).toBe("/customers/cus-1?echo=1");
    expect(recordHref("Quote", "quo-1")).toBe("/sales/quotes/quo-1?echo=1");
  });
});

describe("team scope", () => {
  it("includes the manager, direct reports and managed team members once", () => {
    expect(collectTeamUserIds({
      viewerUserId: "manager",
      directReportUserIds: ["report", null],
      managedTeamMemberUserIds: ["report", "colleague"],
    })).toEqual(["manager", "report", "colleague"]);
  });
});

describe("echo access", () => {
  it("limits notes to records the person can open, plus notes that mention them", () => {
    expect(modelScope(session, "EchoNote")).toEqual(echoNoteScope(session));
    expect(canReadModel(session, "EchoNote")).toBe(true);
    expect(canReadModel({ ...session, capabilities: new Set(["customers.read"]) } as Session, "EchoMention")).toBe(false);
  });

  it("assigns one person to several areas and lets the company show own activity", () => {
    const cleared = assignAuditAreas(parseAuditAccess({ areas: { sam: ["sales", "not-an-area"] }, ownActivity: false }), "sam", []);
    expect(cleared.grants).toEqual([]);
    const assigned = assignAuditAreas(setOwnActivity(cleared, true), "sam", ["sales", "finance", "sales"]);
    expect(assigned.ownActivity).toBe(true);
    expect(assigned.grants).toEqual([{ userId: "sam", areaIds: ["sales", "finance"] }]);
    expect(auditSessionCapabilities(assigned, "sam")).toEqual(["audit.own.read", "audit.area.read"]);
    expect(auditSessionCapabilities(assigned, "alex")).toEqual(["audit.own.read"]);
    expect([...applyCompanyAccessRestrictions(new Set(auditSessionCapabilities(assigned, "sam")), ["audit"])]).toEqual([]);
  });

  it("keeps company, team, area and own views apart", () => {
    expect(auditVisibility({ company: true, teamActorIds: null, areaIds: ["sales"], own: true, userId: "sam" }).kind).toBe("company");
    expect(auditVisibility({ company: false, teamActorIds: ["sam", "alex"], areaIds: [], own: true, userId: "sam" }).where).toEqual({ actorUserId: { in: ["sam", "alex"] } });
    const areas = auditVisibility({ company: false, teamActorIds: null, areaIds: ["finance"], own: false, userId: "sam" });
    expect(areas.kind).toBe("areas");
    expect(areas.where).toEqual({ OR: [{ action: { startsWith: "finance." } }, { action: { startsWith: "approval." } }] });
    expect(auditVisibility({ company: false, teamActorIds: null, areaIds: [], own: true, userId: "sam" }).where).toEqual({ actorUserId: "sam" });
    expect(auditVisibility({ company: false, teamActorIds: ["sam"], areaIds: ["sales"], own: true, userId: "sam" }).kind).toBe("mixed");
    expect(personInAuditView("alex", { company: false, teamActorIds: null, areaIds: [], own: true, userId: "sam" })).toBe(false);
    expect(personInAuditView("alex", { company: false, teamActorIds: null, areaIds: ["sales"], own: false, userId: "sam" })).toBe(true);
    expect(echoChangeVisible({ company: false, team: false, own: true, areaIds: [], userId: "sam", actorUserId: "alex", action: "order.confirmed" })).toBe(false);
    expect(echoChangeVisible({ company: false, team: false, own: false, areaIds: ["sales"], userId: "sam", actorUserId: "alex", action: "order.confirmed" })).toBe(true);
  });

  it("searches by words and writes a report without secret fields", () => {
    expect(auditSearchWhere("a", [])).toBeNull();
    expect(auditSearchWhere("sales", ["user-1"])).toMatchObject({ OR: expect.arrayContaining([{ actorUserId: { in: ["user-1"] } }]) });
    const csv = auditReportCsv([{ at: "3 Oct 2026, 09:00", actorName: "Sam", systemName: "Sales", label: "Order confirmed", detail: "=cmd" }]);
    expect(csv).toContain("When,Person,Area,Change,Detail");
    expect(csv).toContain("'=cmd");
  });

  it("treats Echo as part of the audit area a company can switch off", () => {
    const grants = new Set(["echo.read", "echo.write", "audit.team.read", "core.audit.read", "sales.order.read"]);
    expect([...applyCompanyAccessRestrictions(grants, ["audit"])]).toEqual(["sales.order.read"]);
  });
});
