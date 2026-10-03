import { CreateDialog } from "@/components/ui/create-dialog";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { HR_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { scheduleAppraisal, completeAppraisal } from "./actions";

const RATINGS = ["EXCEEDS", "MEETS", "DEVELOPING", "UNSATISFACTORY"];

export default async function AppraisalsPage({ searchParams }: { searchParams: Promise<{ employeeId?: string }> }) {
  const { employeeId } = await searchParams;
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.appraisalRead);
  const manage = can(session, HR_CAPABILITIES.appraisalManage);

  const [appraisals, employees] = await Promise.all([
    db.appraisal.findMany({ where: { organisationId: session.organisationId }, include: { employee: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { scheduledAt: "desc" } }),
    db.employee.findMany({ where: { organisationId: session.organisationId, status: { not: "LEFT" } }, select: { id: true, firstName: true, lastName: true }, orderBy: { lastName: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Appraisals</h2>
          <p className="text-sm text-[var(--color-ink-muted)]">Performance review cycles, ratings and development goals.</p>
        </div>
        {manage && (
          <CreateDialog title="Schedule appraisal" label="Schedule appraisal">
            <ActionForm action={scheduleAppraisal} className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm sm:col-span-2">Employee
                <select name="employeeId" required defaultValue={employeeId ?? ""} className="mt-2 w-full border border-[var(--color-border)] bg-white p-3">
                  <option value="">Choose employee</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </label>
              <label className="text-sm">Cycle<input name="cycle" required maxLength={150} placeholder="2026 H1 review" className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
              <label className="text-sm">Date<input type="date" name="scheduledAt" required className="mt-2 w-full border border-[var(--color-border)] p-3" /></label>
              <Button type="submit" variant="primary" className="justify-self-start sm:col-span-2">Schedule</Button>
            </ActionForm>
          </CreateDialog>
        )}
      </div>

      {appraisals.length === 0 ? <EmptyState title="No appraisals scheduled" /> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {appraisals.map((a) => (
            <article key={a.id} className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{a.employee.firstName} {a.employee.lastName}</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">{a.cycle} · {a.scheduledAt.toLocaleDateString("en-GB")}</p>
                </div>
                <StatusPill label={a.status} tone={(a.status === "COMPLETED" ? "success" : a.scheduledAt < new Date() && a.status === "SCHEDULED" ? "warning" : "neutral") as StatusTone} />
              </div>
              {a.status === "COMPLETED" ? (
                <div className="space-y-1 text-sm text-[var(--color-ink-muted)]">
                  {a.rating && <p>Rating: <span className="font-medium text-[var(--color-ink)]">{a.rating.replaceAll("_", " ")}</span></p>}
                  {a.strengths && <p>Strengths: {a.strengths}</p>}
                  {a.areasForGrowth && <p>Growth areas: {a.areasForGrowth}</p>}
                  {a.goals && <p>Goals: {a.goals}</p>}
                </div>
              ) : manage ? (
                <ActionForm action={completeAppraisal.bind(null, a.id)} className="space-y-3">
                  <select name="rating" required className="w-full border border-[var(--color-border)] bg-white p-2 text-sm">
                    <option value="">Rating</option>
                    {RATINGS.map((r) => <option key={r} value={r}>{r.replaceAll("_", " ")}</option>)}
                  </select>
                  <textarea name="strengths" placeholder="Strengths" className="w-full rounded-lg border border-[var(--color-border)] p-2 text-sm" />
                  <textarea name="areasForGrowth" placeholder="Areas for growth" className="w-full rounded-lg border border-[var(--color-border)] p-2 text-sm" />
                  <textarea name="goals" placeholder="Goals for next cycle" className="w-full rounded-lg border border-[var(--color-border)] p-2 text-sm" />
                  <Button type="submit" variant="primary">Complete appraisal</Button>
                </ActionForm>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
