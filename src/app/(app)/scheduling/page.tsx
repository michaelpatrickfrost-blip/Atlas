import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { PersonSchedule } from "@/modules/scheduling/components/person-schedule";
import { getPersonSchedule, getTeamPlan } from "./actions";
import { TeamPlanner } from "@/modules/scheduling/components/team-planner";
export default async function SchedulingPage({ searchParams }: { searchParams: Promise<{ month?: string; team?: string; q?: string; department?: string; view?: string }> }) {
  const session = await requireSession();
  const planner = can(session, "scheduling.manage") || can(session, "people.rota.manage");
  if (!planner) {
    const shifts = await getPersonSchedule();
    return <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Your rota</h1>
        <p className="mt-2 text-sm text-[#6e6e73]">Published shifts for the next eight weeks. Time off, tasks and contact details are with the rest of your work.</p>
        <Link href="/scheduling/workforce" className="mt-3 mr-4 inline-block text-sm font-semibold text-blue-700">Open shifts & availability →</Link>
        <Link href="/profile" className="mt-3 inline-block text-sm font-medium text-[#0071e3]">Open My work</Link>
      </div>
      <PersonSchedule shifts={shifts} heading="Published shifts" />
    </div>;
  }
  const query = await searchParams;
  const data = await getTeamPlan(query.month ?? new Date().toISOString().slice(0, 7), query.team ?? "", query.q ?? "", query.department ?? "", query.view === "mine");
  return <TeamPlanner key={`${data.month}:${query.team??""}:${query.department??""}:${query.q??""}:${query.view??""}:${data.employees.map(e=>e.id).join(",")}`} data={data} query={query} />;
}
