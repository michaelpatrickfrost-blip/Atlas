import { ClipboardList, Clock, CheckCircle2 } from "lucide-react";
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
const RATING_TONE: Record<string, StatusTone> = { EXCEEDS: "success", MEETS: "success", DEVELOPING: "warning", UNSATISFACTORY: "danger" };

type AppraisalAnswer = { question: string; answer: string };

export default async function AppraisalsPage({ searchParams }: { searchParams: Promise<{ employeeId?: string }> }) {
  const { employeeId } = await searchParams;
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.appraisalRead);
  const manage = can(session, HR_CAPABILITIES.appraisalManage);

  const [appraisals, employees, templates] = await Promise.all([
    db.appraisal.findMany({ where: { organisationId: session.organisationId }, include: { employee: { select: { id: true, firstName: true, lastName: true } }, template: { select: { name: true, questions: true } } }, orderBy: { scheduledAt: "desc" } }),
    db.employee.findMany({ where: { organisationId: session.organisationId, status: { not: "LEFT" } }, select: { id: true, firstName: true, lastName: true }, orderBy: { lastName: "asc" } }),
    manage ? db.appraisalTemplate.findMany({ where: { organisationId: session.organisationId, active: true }, orderBy: { name: "asc" } }) : [],
  ]);

  const now = new Date();
  const upcoming = appraisals.filter((a) => a.status === "SCHEDULED").sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  const completed = appraisals.filter((a) => a.status !== "SCHEDULED");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-accent-blue-soft)] text-[var(--color-accent-blue)]"><ClipboardList size={20} strokeWidth={1.6} /></div>
          <div>
            <h2 className="text-lg font-semibold">Appraisals</h2>
            <p className="text-sm text-[var(--color-ink-muted)]">Performance review cycles, ratings and development goals.</p>
          </div>
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
              {templates.length > 0 && (
                <label className="text-sm sm:col-span-2">Template (optional)
                  <select name="templateId" className="mt-2 w-full border border-[var(--color-border)] bg-white p-3">
                    <option value="">Freeform — no fixed questions</option>
                    {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </label>
              )}
              <Button type="submit" variant="primary" className="justify-self-start sm:col-span-2">Schedule</Button>
            </ActionForm>
          </CreateDialog>
        )}
      </div>

      {appraisals.length === 0 ? <EmptyState title="No appraisals scheduled" /> : (
        <>
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]"><Clock size={14} /> Upcoming ({upcoming.length})</h3>
            {upcoming.length === 0 ? <p className="text-sm text-[var(--color-ink-muted)]">Nothing scheduled.</p> : (
              <div className="grid gap-4 lg:grid-cols-2">
                {upcoming.map((a) => {
                  const overdue = a.scheduledAt < now;
                  return (
                    <article key={a.id} className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{a.employee.firstName} {a.employee.lastName}</p>
                          <p className="text-xs text-[var(--color-ink-muted)]">{a.cycle} · {a.scheduledAt.toLocaleDateString("en-GB")}{a.template ? ` · ${a.template.name}` : ""}</p>
                        </div>
                        <StatusPill label={overdue ? "Overdue" : "Scheduled"} tone={(overdue ? "danger" : "neutral") as StatusTone} />
                      </div>
                      {manage && (
                        <ActionForm action={completeAppraisal.bind(null, a.id)} className="space-y-3 border-t border-[var(--color-border)] pt-3">
                          <select name="rating" required className="w-full border border-[var(--color-border)] bg-white p-2 text-sm">
                            <option value="">Rating</option>
                            {RATINGS.map((r) => <option key={r} value={r}>{r.replaceAll("_", " ")}</option>)}
                          </select>
                          {a.template ? (
                            a.template.questions.map((q, i) => (
                              <label key={q} className="block text-xs text-[var(--color-ink-muted)]">{q}
                                <textarea name={`answer_${i}`} className="mt-1 w-full rounded-lg border border-[var(--color-border)] p-2 text-sm" />
                              </label>
                            ))
                          ) : (
                            <>
                              <textarea name="strengths" placeholder="Strengths" className="w-full rounded-lg border border-[var(--color-border)] p-2 text-sm" />
                              <textarea name="areasForGrowth" placeholder="Areas for growth" className="w-full rounded-lg border border-[var(--color-border)] p-2 text-sm" />
                              <textarea name="goals" placeholder="Goals for next cycle" className="w-full rounded-lg border border-[var(--color-border)] p-2 text-sm" />
                            </>
                          )}
                          <Button type="submit" variant="primary">Complete appraisal</Button>
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
                {completed.map((a) => (
                  <article key={a.id} className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-sunken)] p-6">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{a.employee.firstName} {a.employee.lastName}</p>
                      {a.rating ? <StatusPill label={a.rating.replaceAll("_", " ")} tone={RATING_TONE[a.rating]} /> : <StatusPill label={a.status} tone="neutral" />}
                    </div>
                    <p className="text-xs text-[var(--color-ink-muted)]">{a.cycle} · {a.scheduledAt.toLocaleDateString("en-GB")}{a.template ? ` · ${a.template.name}` : ""}</p>
                    {Array.isArray(a.answers) && (a.answers as unknown as AppraisalAnswer[]).length > 0 ? (
                      <ul className="space-y-1 text-sm text-[var(--color-ink-muted)]">
                        {(a.answers as unknown as AppraisalAnswer[]).map((qa) => <li key={qa.question}><span className="font-medium text-[var(--color-ink)]">{qa.question}:</span> {qa.answer || "—"}</li>)}
                      </ul>
                    ) : (
                      <div className="space-y-1 text-sm text-[var(--color-ink-muted)]">
                        {a.strengths && <p>Strengths: {a.strengths}</p>}
                        {a.areasForGrowth && <p>Growth areas: {a.areasForGrowth}</p>}
                        {a.goals && <p>Goals: {a.goals}</p>}
                      </div>
                    )}
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
