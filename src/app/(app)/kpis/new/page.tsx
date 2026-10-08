import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { HR_CAPABILITIES as HR } from "@/core/permissions/capabilities";
import { assertModuleEnabled } from "@/core/modules/access";
import { db } from "@/core/db/client";
import { getMyHR } from "@/app/(app)/people/self-service";
import { GoalForm } from "@/modules/kpis/components/goal-form";
import { canEditConduct, conductEmployeeChoices } from "@/modules/people/services/conduct-access";
import { loadMeasureChoices } from "@/modules/kpis/services/workspace";

export default async function NewGoalPage({ searchParams }: { searchParams: Promise<{ kind?: string; employee?: string; self?: string; metric?:string }> }) {
  const session = await requireSession();
  const params = await searchParams;
  const self = params.self === "1";
  if (self) await assertModuleEnabled(session, "people");
  else if (!can(session, "kpis.manage") && !canEditConduct(session)) throw new Error("You cannot set a goal.");
  const [measures, members] = await Promise.all([
    loadMeasureChoices(session).catch(() => []),
    db.membership.findMany({ where: { organisationId: session.organisationId, active:true }, select: { userId: true, user: { select: { name: true } } }, orderBy: { user: { name: "asc" } } }),
  ]);
  let people: { id: string; firstName: string; lastName: string; jobTitle: string; department: string | null }[] = [];
  try { people = await conductEmployeeChoices(session); } catch { people = []; }
  if (!people.length && (can(session, HR.employeeRead) || can(session, "kpis.manage"))) {
    try {
      people = await db.employee.findMany({ where: { organisationId: session.organisationId, status: { not: "LEFT" } }, select: { id: true, firstName: true, lastName: true, jobTitle: true, department: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }], take: 300 });
    } catch { people = []; }
  }
  let employeeId = params.employee ?? "";
  let personLabel = "";
  if (self) {
    const mine = await getMyHR();
    employeeId = mine?.id ?? "";
    personLabel = mine ? `${mine.firstName} ${mine.lastName}` : "";
    if (!employeeId) throw new Error("Your employee record is not linked to this login yet.");
  } else if (employeeId) {
    const person = people.find((item) => item.id === employeeId);
    personLabel = person ? `${person.firstName} ${person.lastName}` : "";
  }
  return <div className="space-y-6">
    <div><Link href="/kpis" className="text-sm text-[var(--color-atlas-blue)]">Goals</Link><h2 className="mt-2 text-3xl font-semibold tracking-tight">Set a goal</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-muted)]">Department results follow the live measure onto dashboards. A personal goal or a performance plan stays with that person and on their profile.</p></div>
    <GoalForm measures={measures} people={people} members={members.map((member) => ({ userId: member.userId, name: member.user.name }))} initialKind={params.kind ?? "department"} employeeId={employeeId} personLabel={personLabel} self={self} initialMetricId={params.metric} />
  </div>;
}
