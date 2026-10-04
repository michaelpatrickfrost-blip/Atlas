import { redirect } from "next/navigation";
import Link from "next/link";
import { CreateDialog } from "@/components/ui/create-dialog";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/table";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { HR_CAPABILITIES, PAYROLL_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { createEmployee } from "./actions";

const STATUS_TONE: Record<string, StatusTone> = {
  ONBOARDING: "warning",
  ACTIVE: "success",
  ON_LEAVE: "neutral",
  OFFBOARDING: "warning",
  LEFT: "danger",
};

export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; department?: string }> }) {
  const filters = await searchParams;
  const query = (filters.q ?? "").trim().slice(0, 100);
  const status = ["ONBOARDING", "ACTIVE", "ON_LEAVE", "OFFBOARDING", "LEFT"].includes(filters.status ?? "") ? filters.status : undefined;
  const session = await requireSession();
  if (!can(session, HR_CAPABILITIES.employeeRead)) redirect("/people/me");
  assertCapability(session, HR_CAPABILITIES.employeeRead);
  const manage = can(session, HR_CAPABILITIES.employeeManage);

  const employees = await db.employee.findMany({
    where: { organisationId: session.organisationId,
      ...(status ? { status: status as "ACTIVE" } : {}),
      ...(filters.department ? { department: filters.department.slice(0, 150) } : {}),
      ...(query ? { OR: ["firstName", "lastName", "email", "employeeNumber", "jobTitle"].map(field => ({ [field]: { contains: query, mode: "insensitive" } })) } : {}),
    },
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
          <Link href="/people/workspace" className="text-xs text-[var(--color-atlas-blue)]">Open HR workspace →</Link>
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
              {can(session, PAYROLL_CAPABILITIES.employeeManage) && <label className="text-sm">Annual salary (£)<input type="number" step="0.01" min="0" name="annualSalary" className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>}
              <label className="text-sm">Annual leave days<input type="number" min="0" name="annualLeaveDaysEntitlement" defaultValue={25} className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
              <label className="text-sm sm:col-span-2">Linked Atlas login (optional)
                <select name="userId" className="mt-2 w-full border border-[var(--color-border)] bg-white p-3">
                  <option value="">No login link yet</option>
                  {unlinkedMembers.map((m) => <option key={m.userId} value={m.userId}>{m.user.name} ({m.user.email})</option>)}
                </select>
                <span className="mt-1 block text-xs text-[var(--color-ink-muted)]">Links this HR record to their Atlas account, so it shows on their profile.</span>
              </label>
              <div className="border-t border-[var(--color-border)] pt-3 sm:col-span-2"><h3 className="font-medium">Contact & emergency details</h3><p className="mt-1 text-xs text-[var(--color-ink-muted)]">Optional details can be completed later.</p></div>
              <label className="text-sm">Preferred name<input name="preferredName" type="text" maxLength={100} className="mt-2 w-full rounded-lg border border-[var(--color-border)] p-3" /></label>
              <label className="text-sm">Phone<input name="phone" type="tel" maxLength={50} className="mt-2 w-full rounded-lg border border-[var(--color-border)] p-3" /></label>
              <label className="text-sm">Home address<input name="address" type="text" maxLength={500} className="mt-2 w-full rounded-lg border border-[var(--color-border)] p-3" /></label>
              <label className="text-sm">Emergency contact name<input name="emergencyContactName" type="text" maxLength={150} className="mt-2 w-full rounded-lg border border-[var(--color-border)] p-3" /></label>
              <label className="text-sm">Emergency contact phone<input name="emergencyContactPhone" type="tel" maxLength={50} className="mt-2 w-full rounded-lg border border-[var(--color-border)] p-3" /></label>
              <label className="text-sm">Skills (comma-separated)<input name="skills" type="text" maxLength={1000} className="mt-2 w-full rounded-lg border border-[var(--color-border)] p-3" /></label>
              <label className="text-sm">Contracted weekly hours<input name="contractedWeeklyHours" type="number" min="1" max="168" step="0.5" className="mt-2 w-full rounded-lg border border-[var(--color-border)] p-3" /></label>
              <Button type="submit" variant="primary" className="justify-self-start sm:col-span-2">Add employee &amp; start onboarding</Button>
            </ActionForm>
          </CreateDialog>
        )}
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-4">
        <label className="flex-1 text-xs">Search people<input name="q" defaultValue={query} placeholder="Name, email, role or employee number" className="mt-2 w-full rounded-lg border border-[var(--color-border)] p-3 text-sm" /></label>
        <label className="text-xs">Status<select name="status" defaultValue={status ?? ""} className="mt-2 block rounded-lg border border-[var(--color-border)] bg-white p-3 text-sm"><option value="">All statuses</option>{Object.keys(STATUS_TONE).map(s => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}</select></label>
        <label className="text-xs">Department<input name="department" defaultValue={filters.department ?? ""} className="mt-2 block rounded-lg border border-[var(--color-border)] p-3 text-sm" /></label>
        <Button type="submit">Filter</Button><Link href="/people" className="p-3 text-xs text-[var(--color-atlas-blue)]">Clear</Link>
      </form>
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
