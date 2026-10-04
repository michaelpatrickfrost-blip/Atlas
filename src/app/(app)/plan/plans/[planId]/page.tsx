import { requireSession } from "@/core/auth/session";
import { PlanWorkspace } from "@/modules/plan/components/workspace";

export default async function Page({ params, searchParams }: { params: Promise<{ planId: string }>; searchParams: Promise<{ lens?: string; scenario?: string; metric?: string; q?: string }> }) {
  const session = await requireSession();
  const [{ planId }, query] = await Promise.all([params, searchParams]);
  return <PlanWorkspace session={session} planId={planId} lens={query.lens} scenarioId={query.scenario} metricKey={query.metric} query={query.q} />;
}
