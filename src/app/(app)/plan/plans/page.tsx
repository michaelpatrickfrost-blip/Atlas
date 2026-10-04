import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { audienceLabel } from "@/modules/plan/domain/access";
import { planList, planTypeLabel } from "@/modules/plan/services/queries";

export default async function Page({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const session = await requireSession();
  const query = await searchParams;
  const plans = (await planList(session)).filter((plan) => !query.type || plan.planType === query.type);
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-3xl font-semibold tracking-tight">Plans</h2>
        <Link href="/plan/plans/new" className="rounded-full bg-[var(--color-atlas-blue)] px-4 py-2 text-sm font-semibold text-white">Create plan</Link>
      </div>
      <div className="divide-y divide-slate-100 rounded-3xl border border-slate-200">
        {plans.map((plan) => (
          <Link key={plan.id} href={`/plan/plans/${plan.id}`} className="flex items-center justify-between px-5 py-4">
            <span><span className="block font-medium">{plan.name}</span><span className="text-sm text-[var(--color-ink-muted)]">{planTypeLabel(plan.planType)} · {plan.periodLabel} · {plan.ownerName} · {audienceLabel(plan.audience, plan._count.shares)}</span></span>
            <span className="text-sm capitalize text-[var(--color-ink-muted)]">{plan.status}</span>
          </Link>
        ))}
        {!plans.length ? <p className="px-5 py-8 text-sm text-[var(--color-ink-muted)]">No plans of this kind yet.</p> : null}
      </div>
    </div>
  );
}
