import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { planList } from "@/modules/plan/services/queries";

export default async function Page() {
  const session = await requireSession();
  const plans = await planList(session);
  const reviews = await db.planReview.findMany({ where: { organisationId: session.organisationId, planId: { in: plans.map((plan) => plan.id) } }, orderBy: { scheduledFor: "asc" }, take: 100 });
  const names = new Map(plans.map((plan) => [plan.id, plan.name]));
  return (
    <div>
      <h2 className="text-3xl font-semibold tracking-tight">Reviews</h2>
      <p className="mt-2 text-sm text-[var(--color-ink-muted)]">Completing a review stores the figures as they were. Later forecasts do not rewrite that snapshot.</p>
      <div className="mt-6 divide-y divide-slate-100 rounded-3xl border border-slate-200">
        {reviews.map((review) => <Link key={review.id} href={`/plan/plans/${review.planId}/present`} className="block px-5 py-4"><span className="font-medium">{review.title}</span><span className="block text-sm text-[var(--color-ink-muted)]">{names.get(review.planId)} · {review.status}{review.scheduledFor ? ` · ${review.scheduledFor.toLocaleDateString("en-GB")}` : ""}</span></Link>)}
        {!reviews.length ? <p className="px-5 py-8 text-sm text-[var(--color-ink-muted)]">Reviews appear when a plan is created.</p> : null}
      </div>
    </div>
  );
}
