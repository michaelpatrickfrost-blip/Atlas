import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { planList } from "@/modules/plan/services/queries";
import { PLAN_CAPABILITIES } from "@/core/permissions/capabilities";

export default async function Page() {
  const session = await requireSession();
  const plans = await planList(session);
  const seePrivate = session.capabilities.has(PLAN_CAPABILITIES.scenarioShare) || session.capabilities.has(PLAN_CAPABILITIES.approve);
  const versions = await db.planVersion.findMany({
    where: { organisationId: session.organisationId, kind: "scenario", planId: { in: plans.map((plan) => plan.id) }, ...(seePrivate ? {} : { OR: [{ shared: true }, { ownerUserId: session.userId }] }) },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const names = new Map(plans.map((plan) => [plan.id, plan.name]));
  return (
    <div>
      <h2 className="text-3xl font-semibold tracking-tight">Scenarios</h2>
      <p className="mt-2 max-w-2xl text-sm text-[var(--color-ink-muted)]">A scenario stays beside the plan until someone promotes it to the forecast. Promotion does not change the approved baseline.</p>
      <div className="mt-6 divide-y divide-slate-100 rounded-3xl border border-slate-200">
        {versions.map((version) => <Link key={version.id} href={`/plan/plans/${version.planId}?scenario=${version.id}&lens=analyst`} className="block px-5 py-4"><span className="font-medium">{version.name}</span><span className="block text-sm text-[var(--color-ink-muted)]">{names.get(version.planId)} · {version.shared ? "Shared" : "Private"}</span></Link>)}
        {!versions.length ? <p className="px-5 py-8 text-sm text-[var(--color-ink-muted)]">No scenarios yet. Open a plan and create one from its forecast.</p> : null}
      </div>
    </div>
  );
}
