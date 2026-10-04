import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@/core/auth/session";
import { HR_CAPABILITIES, STANDARD_ROLES } from "@/core/permissions/capabilities";
import { hrAccessGroups, policyAudiences } from "@/core/permissions/hr-access";
import { presetCapabilities } from "@/core/permissions/access-levels";
import { readObjectives } from "@/modules/people/domain/conduct";
import { readPolicyPdf } from "@/modules/people/domain/policy-file";
import { canReadModel, deniedScalar, modelScope } from "@/server/data-api/read-policy";

const mock = vi.hoisted(() => ({ employee: vi.fn(), teams: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { employee: { findFirst: mock.employee }, workTeam: { findMany: mock.teams } } }));
import { employeeInConductScope } from "@/modules/people/services/conduct-access";

const session = (caps: string[] = []): Session => ({ userId: "manager", organisationId: "org", membershipId: "m", userName: "Manager", userEmail: "m@example.com", organisationName: "Org", capabilities: new Set(["core.profile.self", ...caps]) });
const staff = { id: "staff", userId: "staff-user", department: "Ops", status: "ACTIVE", firstName: "Sam", lastName: "Lee", jobTitle: "Operator", manager: { userId: "manager", organisationId: "org" } };

beforeEach(() => { mock.employee.mockReset(); mock.teams.mockReset(); mock.teams.mockResolvedValue([]); });

describe("HR conduct and policy access", () => {
  it("splits every HR permission into its own access slice", () => {
    const groups = hrAccessGroups();
    const caps = groups.flatMap((group) => group.capabilities);
    expect(new Set(caps).size).toBe(caps.length);
    expect(caps.sort()).toEqual(Object.values(HR_CAPABILITIES).sort());
    const policies = groups.find((group) => group.id === "people-policies")!;
    expect(presetCapabilities(policies, "read")).toEqual([HR_CAPABILITIES.policyRead]);
    expect(presetCapabilities(policies, "write")).toEqual([HR_CAPABILITIES.policyRead, HR_CAPABILITIES.policyManage]);
    expect(presetCapabilities(groups.find((group) => group.id === "people-pay")!, "read")).not.toContain(HR_CAPABILITIES.expenseApprove);
  });

  it("keeps the staff role to holidays and policies", () => {
    const role = STANDARD_ROLES.find((item) => item.key === "staff")!;
    expect(role.capabilities).toEqual(expect.arrayContaining([HR_CAPABILITIES.holidaySelf, HR_CAPABILITIES.policyRead]));
    expect(role.capabilities.some((cap) => cap.startsWith("people.") && ![HR_CAPABILITIES.holidaySelf, HR_CAPABILITIES.policyRead].includes(cap as never))).toBe(false);
  });

  it("hides manager and HR policies from a holiday-and-policy reader", () => {
    const reader = session([HR_CAPABILITIES.policyRead]);
    expect(policyAudiences(reader)).toEqual(["EVERYONE"]);
    expect(modelScope(reader, "HrPolicy")).toMatchObject({ audience: { in: ["EVERYONE"] }, status: "PUBLISHED" });
    expect(policyAudiences(session([HR_CAPABILITIES.teamManage, HR_CAPABILITIES.policyRead]))).toEqual(["EVERYONE", "MANAGERS"]);
    expect(policyAudiences(session([HR_CAPABILITIES.policyManage]))).toEqual(["EVERYONE", "MANAGERS", "HR"]);
    expect(deniedScalar(session([HR_CAPABILITIES.policyManage]), "HrPolicy", "content")).toBe(true);
    expect(canReadModel(reader, "HrPolicy")).toBe(true);
    expect(canReadModel(reader, "PerformancePlan")).toBe(true);
    expect(modelScope(reader, "PerformancePlan")).toEqual({ organisationId: "org", OR: [{ ownerUserId: "manager" }, { leadUserIds: { has: "manager" }, status: { not: "DRAFT" } }] });
    expect(canReadModel(reader, "DisciplinaryCase")).toBe(false);
  });

  it("limits disciplinary records to the person, their manager, or HR", async () => {
    mock.employee.mockResolvedValue(staff);
    await expect(employeeInConductScope(session([HR_CAPABILITIES.policyRead]), "staff", "view")).rejects.toThrow("FORBIDDEN");
    await expect(employeeInConductScope(session([HR_CAPABILITIES.conductManage, HR_CAPABILITIES.teamManage]), "staff", "edit")).resolves.toMatchObject({ own: false });
    mock.employee.mockResolvedValue({ ...staff, manager: { userId: "someone-else", organisationId: "org" }, department: "Finance" });
    await expect(employeeInConductScope(session([HR_CAPABILITIES.conductManage, HR_CAPABILITIES.teamManage]), "staff", "view")).rejects.toThrow("outside your management scope");
    await expect(employeeInConductScope(session([HR_CAPABILITIES.conductRead, HR_CAPABILITIES.employeeRead]), "staff", "view")).resolves.toMatchObject({ employee: { id: "staff" }, own: false });
    mock.employee.mockResolvedValue({ ...staff, userId: "manager" });
    await expect(employeeInConductScope(session([HR_CAPABILITIES.conductManage]), "staff", "view")).resolves.toMatchObject({ own: true });
    await expect(employeeInConductScope(session([HR_CAPABILITIES.conductManage, HR_CAPABILITIES.employeeManage]), "staff", "edit")).rejects.toThrow("about yourself");
  });

  it("accepts a real PDF and rejects other files", async () => {
    const pdf = new File([Buffer.from("%PDF-1.4\n%handbook")], "holiday-policy.pdf", { type: "application/pdf" });
    await expect(readPolicyPdf(pdf)).resolves.toMatchObject({ fileName: "holiday-policy.pdf" });
    await expect(readPolicyPdf(new File([Buffer.from("not a pdf")], "notes.pdf"))).rejects.toThrow("must be a PDF");
    const form = new FormData();
    form.append("goal", "Reply within one day");
    form.append("measure", "Inbox under 10");
    form.append("supportItem", "Shared inbox training");
    form.append("objectiveBy", "2026-11-01");
    expect(readObjectives(form)).toEqual([{ goal: "Reply within one day", measure: "Inbox under 10", support: "Shared inbox training", by: "2026-11-01" }]);
    expect(() => readObjectives(new FormData())).toThrow("between 1 and 8");
  });
});
