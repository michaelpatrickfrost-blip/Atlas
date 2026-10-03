import { CreateDialog } from "@/components/ui/create-dialog";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/table";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { HR_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { createShift, changeShiftStatus } from "./actions";

const TONE: Record<string, StatusTone> = { SCHEDULED: "neutral", CONFIRMED: "success", CANCELLED: "danger" };

export default async function RotasPage({ searchParams }: { searchParams: Promise<{ employeeId?: string }> }) {
  const { employeeId } = await searchParams;
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.rotaRead);
  const manage = can(session, HR_CAPABILITIES.rotaManage);

  const [shifts, employees] = await Promise.all([
    db.rotaShift.findMany({
      where: { organisationId: session.organisationId, startsAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { startsAt: "asc" },
      take: 100,
    }),
    db.employee.findMany({ where: { organisationId: session.organisationId, status: { not: "LEFT" } }, select: { id: true, firstName: true, lastName: true }, orderBy: { lastName: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Rotas</h2>
          <p className="text-sm text-[var(--color-ink-muted)]">Upcoming shifts, from today onward.</p>
        </div>
        {manage && (
          <CreateDialog title="Add shift" label="Add shift">
            <ActionForm action={createShift} className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm sm:col-span-2">Employee
                <select name="employeeId" required defaultValue={employeeId ?? ""} className="mt-2 w-full border border-[var(--color-border)] bg-white p-3">
                  <option value="">Choose employee</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </label>
              <label className="text-sm">Starts<input type="datetime-local" name="startsAt" required className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
              <label className="text-sm">Ends<input type="datetime-local" name="endsAt" required className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
              <label className="text-sm">Role<input name="role" maxLength={100} className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
              <label className="text-sm">Location<input name="location" maxLength={100} className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
              <Button type="submit" variant="primary" className="justify-self-start sm:col-span-2">Add shift</Button>
            </ActionForm>
          </CreateDialog>
        )}
      </div>

      <DataTable
        rows={shifts}
        emptyLabel="No shifts scheduled."
        columns={[
          { header: "Employee", render: (s) => <span className="font-medium">{s.employee.firstName} {s.employee.lastName}</span> },
          { header: "Starts", render: (s) => s.startsAt.toLocaleString("en-GB") },
          { header: "Ends", render: (s) => s.endsAt.toLocaleString("en-GB") },
          { header: "Role / location", render: (s) => [s.role, s.location].filter(Boolean).join(" · ") || "—" },
          {
            header: "Status",
            render: (s) =>
              manage ? (
                <ActionForm action={changeShiftStatus.bind(null, s.id)} className="flex items-center gap-2">
                  <select name="status" defaultValue={s.status} className="border border-[var(--color-border)] bg-white px-2 py-1 text-xs">
                    {["SCHEDULED", "CONFIRMED", "CANCELLED"].map((st) => <option key={st} value={st}>{st}</option>)}
                  </select>
                  <Button type="submit" className="text-xs">Save</Button>
                </ActionForm>
              ) : (
                <StatusPill label={s.status} tone={TONE[s.status]} />
              ),
          },
        ]}
      />
    </div>
  );
}
