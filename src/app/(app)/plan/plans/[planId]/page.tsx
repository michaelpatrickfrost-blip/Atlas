import { requireSession } from "@/core/auth/session";
import { PlanWorkspace } from "@/modules/plan/components/planner";

export default async function Page({ params, searchParams }: { params: Promise<{ planId: string }>; searchParams: Promise<{ tab?: string; scenario?: string; metric?: string; q?: string; edit?: string }> }) {
  const session = await requireSession();
  const [{ planId }, query] = await Promise.all([params, searchParams]);
  return <PlanWorkspace session={session} planId={planId} tab={query.tab} editId={query.edit} scenarioId={query.scenario} metricKey={query.metric} query={query.q} />;
}
