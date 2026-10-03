import { CreateDialog } from "@/components/ui/create-dialog";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/table";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { HR_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { createEmployee } from "./actions";

const STATUS_TONE: Record<string, StatusTone> = {
  ONBOARDING: "warning",
  ACTIVE: "success",
  ON_LEAVE: "neutral",
  OFFBOARDING: "warning",
  LEFT: "danger",
};

export default async function PeoplePage() {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.employeeRead);
  const manage = can(session, HR_CAPABILITIES.employeeManage);

  const employees = await db.employee.findMany({
    where: { organisationId: session.organisationId },
    orderBy: [{ status: "asc" }, { lastName: "asc" }],
  });

  const [managers, members, linkedEmployees] = manage
    ? await Promise.all([
        db.employee.findMany({ where: { organisationId: session.organisationId, status: { not: "LEFT" } }, select: { id: true, firstName: true, lastName: true }, orderBy: { lastName: "asc" } }),
        db.membership.findMany({ where: { organisationId: session.organisationId }, include: { user: { select: { id: true, name: true, email: true } } } }),
        db.employee.findMany({ where: { organisationId: session.organisationId, userId: { not: null } }, select: { userId: true } }),
      ])
    : [[], [], []];
  const linkedUserIds = new Set(linkedEmployees.map((e) => e.userId));
  const unlinkedMembers = members.filter((m) => !linkedUserIds.has(m.userId));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Employees</h2>
          <p className="text-sm text-[var(--color-ink-muted)]">{employees.length} people on record.</p>
        </div>
        {manage && (
          <CreateDialog title="Add employee" label="Add employee">
            <ActionForm action={createEmployee} className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm">First name<input name="firstName" required maxLength={100} className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
              <label className="text-sm">Last name<input name="lastName" required maxLength={100} className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
              <label className="text-sm sm:col-span-2">Email<input type="email" name="email" required maxLength={200} className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
              <label className="text-sm">Job title<input name="jobTitle" required maxLength={150} className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
              <label className="text-sm">Department<input name="department" maxLength={150} className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
              <label className="text-sm">Employment type
                <select name="employmentType" className="mt-2 w-full border border-[var(--color-border)] bg-white p-3">
                  {["FULL_TIME", "PART_TIME", "FIXED_TERM", "CONTRACTOR", "APPRENTICE"].map((t) => <option key={t} value={t}>{t.replaceAll("_", " ")}</option>)}
                </select>
              </label>
              <label className="text-sm">Start date<input type="date" name="startDate" required className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
              <label className="text-sm">Manager
                <select name="managerId" className="mt-2 w-full border border-[var(--color-border)] bg-white p-3">
                  <option value="">No manager</option>
                  {managers.map((m) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                </select>
              </label>
              <label className="text-sm">Annual salary (£)<input type="number" step="0.01" min="0" name="annualSalary" className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
              <label className="text-sm">Annual leave days<input type="number" min="0" name="annualLeaveDaysEntitlement" defaultValue={25} className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
              <label className="text-sm sm:col-span-2">Linked Atlas login (optional)
                <select name="userId" className="mt-2 w-full border border-[var(--color-border)] bg-white p-3">
                  <option value="">No login link yet</option>
                  {unlinkedMembers.map((m) => <option key={m.userId} value={m.userId}>{m.user.name} ({m.user.email})</option>)}
                </select>
                <span className="mt-1 block text-xs text-[var(--color-ink-muted)]">Links this HR record to their Atlas account, so it shows on their profile.</span>
              </label>
              <Button type="submit" variant="primary" className="justify-self-start sm:col-span-2">Add employee &amp; start onboarding</Button>
            </ActionForm>
          </CreateDialog>
        )}
      </div>

      <DataTable
        emptyLabel="No employees yet. Add your first employee to start onboarding."
        rows={employees}
        getHref={(e) => `/people/${e.id}`}
        columns={[
          { header: "Name", render: (e) => <span className="font-medium">{e.firstName} {e.lastName}</span> },
          { header: "Job title", render: (e) => e.jobTitle },
          { header: "Department", render: (e) => e.department ?? "—" },
          { header: "Employee no.", render: (e) => e.employeeNumber },
          { header: "Started", render: (e) => e.startDate.toLocaleDateString("en-GB") },
          { header: "Status", render: (e) => <StatusPill label={e.status.replaceAll("_", " ")} tone={STATUS_TONE[e.status] ?? "neutral"} /> },
        ]}
      />
    </div>
  );
}
