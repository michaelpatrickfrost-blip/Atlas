import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { HR_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { completeEmployeeTask } from "../actions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default async function OffboardingPage() {
  const session = await requireSession();
  assertCapability(session, HR_CAPABILITIES.offboardingManage);

  const employees = await db.employee.findMany({
    where: { organisationId: session.organisationId, status: "OFFBOARDING" },
    include: { onboardingTasks: { where: { phase: "OFFBOARDING" }, orderBy: { createdAt: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Offboarding</h2>
        <p className="text-sm text-[var(--color-ink-muted)]">Leavers in progress. Move an employee to &ldquo;Offboarding&rdquo; on their record to start a checklist, then &ldquo;Left&rdquo; once complete.</p>
      </div>
      {employees.length === 0 ? (
        <EmptyState title="Nobody is currently leaving" description="Set an employee's status to Offboarding on their record to begin." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {employees.map((e) => {
            const done = e.onboardingTasks.filter((t) => t.completedAt).length;
            return (
              <article key={e.id} className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-white p-6">
                <div className="flex items-center justify-between">
                  <Link href={`/people/${e.id}`} className="font-semibold text-[var(--color-atlas-blue)]">{e.firstName} {e.lastName}</Link>
                  <span className="text-xs text-[var(--color-ink-muted)]">{done}/{e.onboardingTasks.length} complete</span>
                </div>
                <ul className="space-y-1.5">
                  {e.onboardingTasks.filter((t) => !t.completedAt).map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 text-sm">
                      <span>{t.title}{t.category ? <span className="ml-2 text-xs text-[var(--color-ink-faint)]">{t.category}</span> : null}</span>
                      <form action={completeEmployeeTask.bind(null, t.id)}><Button type="submit" className="text-xs">Done</Button></form>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
