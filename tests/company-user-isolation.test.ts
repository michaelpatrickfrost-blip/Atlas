import { describe, expect, it } from "vitest";
import type { Session } from "@/core/auth/session";
import { canReadModel, modelScope } from "@/server/data-api/read-policy";
import { planRead } from "@/server/data-api/read-query";

function session(userId: string, organisationId: string, capabilities: string[]): Session {
  return {
    userId,
    userName: userId,
    userEmail: `${userId}@example.com`,
    organisationId,
    organisationName: organisationId,
    membershipId: `member-${userId}`,
    capabilities: new Set(capabilities),
  };
}

const staff = session("person-a", "company-a", ["core.profile.self", "people.holiday.self", "scheduling.read", "projects.read"]);
const colleague = session("person-b", "company-a", ["core.profile.self", "payroll.run.read", "people.absence.read", "people.rota.read", "scheduling.manage", "projects.manage"]);
const otherCompany = session("person-c", "company-b", ["core.profile.self", "customers.read", "sales.order.read", "people.employee.read"]);

describe("company and user areas", () => {
  it("keeps another company's records out of a company read", () => {
    for (const model of ["Party", "Product", "SalesOrder", "Employee", "Project"] as const) {
      const plan = planRead(otherCompany, model, { where: { organisationId: "company-a" } });
      expect(plan.args.where).toMatchObject({ AND: [{ organisationId: "company-b" }, { organisationId: "company-a" }] });
    }
    const users = planRead(otherCompany, "User", { where: { email: "person-a@example.com" } });
    expect(users.args.where).toMatchObject({ AND: [{ memberships: { some: { organisationId: "company-b" } } }, { email: "person-a@example.com" }] });
    const companies = planRead(otherCompany, "Organisation", {});
    expect(companies.args.where).toMatchObject({ AND: [{ id: "company-b" }, {}] });
  });

  it("gives a person their own pay, time off, expenses, reviews and rota", () => {
    expect(modelScope(staff, "Payslip")).toEqual({ organisationId: "company-a", employee: { organisationId: "company-a", userId: "person-a" } });
    expect(modelScope(staff, "ExpenseClaim")).toEqual({ organisationId: "company-a", employee: { organisationId: "company-a", userId: "person-a" } });
    expect(modelScope(staff, "AbsenceRecord")).toEqual({ organisationId: "company-a", employee: { organisationId: "company-a", userId: "person-a" } });
    expect(modelScope(staff, "RotaShift")).toEqual({ organisationId: "company-a", employee: { organisationId: "company-a", userId: "person-a" } });
    expect(modelScope(staff, "Appraisal")).toEqual({ organisationId: "company-a", OR: [{ reviewerUserId: "person-a" }, { employee: { organisationId: "company-a", userId: "person-a" } }] });
    expect(modelScope(staff, "OneToOne")).toEqual({ organisationId: "company-a", OR: [{ managerUserId: "person-a" }, { employee: { organisationId: "company-a", userId: "person-a" } }] });
    expect(JSON.stringify(modelScope(staff, "Meeting"))).toContain("person-a");
    expect(JSON.stringify(modelScope(staff, "Meeting"))).not.toContain("projects.manage");
  });

  it("lets payroll, absence and rota roles see their company, not another company", () => {
    expect(modelScope(colleague, "Payslip")).toEqual({ organisationId: "company-a" });
    expect(modelScope(colleague, "AbsenceRecord")).toEqual({ organisationId: "company-a" });
    expect(modelScope(colleague, "RotaShift")).toEqual({ organisationId: "company-a" });
    expect(modelScope(colleague, "Meeting")).toMatchObject({ organisationId: "company-a" });
    expect(canReadModel(staff, "PayrollRun")).toBe(false);
    expect(canReadModel(otherCompany, "Payslip")).toBe(true);
    expect(modelScope(otherCompany, "Payslip").organisationId).toBe("company-b");
  });

  it("does not let a caller replace the company on a personal record", () => {
    const plan = planRead(staff, "Payslip", { where: { organisationId: "company-b" } });
    expect(plan.args.where).toMatchObject({
      AND: [
        { organisationId: "company-a", employee: { organisationId: "company-a", userId: "person-a" } },
        { organisationId: "company-b" },
      ],
    });
  });
});
