import { MessageCircle, Clock, CheckCircle2 } from "lucide-react";
import { CreateDialog } from "@/components/ui/create-dialog";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { StatusPill, type StatusTone } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { HR_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { scheduleOneToOne, completeOneToOne } from "./actions";

type Answer = { topic: string; notes: string };

export default async function OneToOnesPage({ searchParams }: { searchParams: Promise<{ employeeId?: string }> }) {
  const { employeeId } = await searchParams;
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.oneToOneRead);
  const manage = can(session, HR_CAPABILITIES.oneToOneManage);

  const [oneToOnes, employees, templates] = await Promise.all([
    db.oneToOne.findMany({ where: { organisationId: session.organisationId }, include: { employee: { select: { id: true, firstName: true, lastName: true } }, template: { select: { name: true, talkingPoints: true } } }, orderBy: { scheduledAt: "desc" } }),
    db.employee.findMany({ where: { organisationId: session.organisationId, status: { not: "LEFT" } }, select: { id: true, firstName: true, lastName: true }, orderBy: { lastName: "asc" } }),
    manage ? db.oneToOneTemplate.findMany({ where: { organisationId: session.organisationId, active: true }, orderBy: { name: "asc" } }) : [],
  ]);

  const now = new Date();
  const upcoming = oneToOnes.filter((o) => o.status === "SCHEDULED").sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  const completed = oneToOnes.filter((o) => o.status !== "SCHEDULED");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-accent-teal-soft)] text-[var(--color-accent-teal)]"><MessageCircle size={20} strokeWidth={1.6} /></div>
          <div>
            <h2 className="text-lg font-semibold">One-to-Ones</h2>
            <p className="text-sm text-[var(--color-ink-muted)]">Regular check-ins between managers and their reports.</p>
          </div>
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
              {templates.length > 0 && (
                <label className="text-sm">Template (optional)
                  <select name="templateId" className="mt-2 w-full border border-[var(--color-border)] bg-white p-3">
                    <option value="">Freeform — no fixed talking points</option>
                    {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </label>
              )}
              <label className="text-sm">Talking points<textarea name="talkingPoints" className="mt-2 w-full rounded-lg border border-[var(--color-border)] p-3" /></label>
              <Button type="submit" variant="primary" className="justify-self-start">Schedule</Button>
            </ActionForm>
          </CreateDialog>
        )}
      </div>

      {oneToOnes.length === 0 ? <EmptyState title="No one-to-ones scheduled" /> : (
        <>
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]"><Clock size={14} /> Upcoming ({upcoming.length})</h3>
            {upcoming.length === 0 ? <p className="text-sm text-[var(--color-ink-muted)]">Nothing scheduled.</p> : (
              <div className="grid gap-4 lg:grid-cols-2">
                {upcoming.map((o) => {
                  const overdue = o.scheduledAt < now;
                  return (
                    <article key={o.id} className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{o.employee.firstName} {o.employee.lastName}</p>
                          <p className="text-xs text-[var(--color-ink-muted)]">{o.scheduledAt.toLocaleString("en-GB")}{o.template ? ` · ${o.template.name}` : ""}</p>
                        </div>
                        <StatusPill label={overdue ? "Overdue" : "Scheduled"} tone={(overdue ? "danger" : "neutral") as StatusTone} />
                      </div>
                      {o.talkingPoints && <p className="text-sm text-[var(--color-ink-muted)]">{o.talkingPoints}</p>}
                      {manage && (
                        <ActionForm action={completeOneToOne.bind(null, o.id)} className="space-y-3 border-t border-[var(--color-border)] pt-3">
                          {o.template ? (
                            o.template.talkingPoints.map((topic, i) => (
                              <label key={topic} className="block text-xs text-[var(--color-ink-muted)]">{topic}
                                <textarea name={`answer_${i}`} className="mt-1 w-full rounded-lg border border-[var(--color-border)] p-2 text-sm" />
                              </label>
                            ))
                          ) : (
                            <textarea name="notes" placeholder="Notes" className="w-full rounded-lg border border-[var(--color-border)] p-2 text-sm" />
                          )}
                          <textarea name="actionPoints" placeholder="Action points" className="w-full rounded-lg border border-[var(--color-border)] p-2 text-sm" />
                          <Button type="submit" variant="primary">Mark complete</Button>
                        </ActionForm>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {completed.length > 0 && (
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]"><CheckCircle2 size={14} /> Completed ({completed.length})</h3>
              <div className="grid gap-4 lg:grid-cols-2">
                {completed.map((o) => (
                  <article key={o.id} className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-6">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{o.employee.firstName} {o.employee.lastName}</p>
                      <StatusPill label={o.status} tone={o.status === "COMPLETED" ? "success" : "neutral"} />
                    </div>
                    <p className="text-xs text-[var(--color-ink-muted)]">{o.scheduledAt.toLocaleString("en-GB")}{o.template ? ` · ${o.template.name}` : ""}</p>
                    {Array.isArray(o.answers) && (o.answers as unknown as Answer[]).length > 0 ? (
                      <ul className="space-y-1 text-sm text-[var(--color-ink-muted)]">
                        {(o.answers as unknown as Answer[]).map((a) => <li key={a.topic}><span className="font-medium text-[var(--color-ink)]">{a.topic}:</span> {a.notes || "—"}</li>)}
                      </ul>
                    ) : (
                      o.notes && <p className="text-sm text-[var(--color-ink-muted)]">{o.notes}</p>
                    )}
                    {o.actionPoints && <p className="text-sm text-[var(--color-ink-muted)]">Actions: {o.actionPoints}</p>}
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
