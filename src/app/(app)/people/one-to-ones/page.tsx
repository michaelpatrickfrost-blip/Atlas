import { CreateDialog } from "@/components/ui/create-dialog";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { HR_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { scheduleOneToOne, completeOneToOne } from "./actions";

export default async function OneToOnesPage({ searchParams }: { searchParams: Promise<{ employeeId?: string }> }) {
  const { employeeId } = await searchParams;
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.oneToOneRead);
  const manage = can(session, HR_CAPABILITIES.oneToOneManage);

  const [oneToOnes, employees] = await Promise.all([
    db.oneToOne.findMany({ where: { organisationId: session.organisationId }, include: { employee: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { scheduledAt: "desc" } }),
    db.employee.findMany({ where: { organisationId: session.organisationId, status: { not: "LEFT" } }, select: { id: true, firstName: true, lastName: true }, orderBy: { lastName: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">One-to-Ones</h2>
          <p className="text-sm text-[var(--color-ink-muted)]">Regular check-ins between managers and their reports.</p>
        </div>
        {manage && (
          <CreateDialog title="Schedule one-to-one" label="Schedule one-to-one">
            <ActionForm action={scheduleOneToOne} className="mt-5 grid gap-4">
              <label className="text-sm">Employee
                <select name="employeeId" required defaultValue={employeeId ?? ""} className="mt-2 w-full border border-[var(--color-border)] bg-white p-3">
                  <option value="">Choose employee</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </label>
              <label className="text-sm">Date &amp; time<input type="datetime-local" name="scheduledAt" required className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
              <label className="text-sm">Talking points<textarea name="talkingPoints" className="mt-2 w-full rounded-lg border border-[var(--color-border)] p-3" /></label>
              <Button type="submit" variant="primary" className="justify-self-start">Schedule</Button>
            </ActionForm>
          </CreateDialog>
        )}
      </div>

      {oneToOnes.length === 0 ? <EmptyState title="No one-to-ones scheduled" /> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {oneToOnes.map((o) => (
            <article key={o.id} className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{o.employee.firstName} {o.employee.lastName}</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">{o.scheduledAt.toLocaleString("en-GB")}</p>
                </div>
                <StatusPill label={o.status} tone={o.status === "COMPLETED" ? "success" : "neutral"} />
              </div>
              {o.talkingPoints && <p className="text-sm text-[var(--color-ink-muted)]">Talking points: {o.talkingPoints}</p>}
              {o.status === "COMPLETED" ? (
                <div className="space-y-1 text-sm text-[var(--color-ink-muted)]">
                  {o.notes && <p>Notes: {o.notes}</p>}
                  {o.actionPoints && <p>Actions: {o.actionPoints}</p>}
                </div>
              ) : manage ? (
                <ActionForm action={completeOneToOne.bind(null, o.id)} className="space-y-3">
                  <textarea name="notes" placeholder="Notes" className="w-full rounded-lg border border-[var(--color-border)] p-2 text-sm" />
                  <textarea name="actionPoints" placeholder="Action points" className="w-full rounded-lg border border-[var(--color-border)] p-2 text-sm" />
                  <Button type="submit" variant="primary">Mark complete</Button>
                </ActionForm>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
