import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import type { Session } from "@/core/auth/session";
import { audienceLabel } from "../domain/access";
import { planTypeLabel, planHome } from "../services/queries";
import { showMeasure } from "./format";

export async function PlanHome({ session }: { session: Session }) {
  const home = await planHome(session);
  const month = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  if (!home.focus) {
    return <EmptyState title="No plan yet" description="Start with what you are trying to achieve. Atlas will bring in the records it already has." action={<Link href="/plan/plans/new" className="rounded-full bg-[var(--color-atlas-blue)] px-5 py-2.5 text-sm font-semibold text-white">Create a plan</Link>} />;
  }
  const watch = home.attention.filter((item) => item.tone === "watch");
  const good = home.attention.filter((item) => item.tone === "good");
  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <p className="text-sm text-[var(--color-ink-muted)]">{month}</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight">{home.focus.name}</h2>
          <p className="mt-3 max-w-2xl text-[var(--color-ink-muted)]">{home.focus.purpose || "What should happen next, next to what Atlas already knows."}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {home.cards.slice(0, 3).map((card) => (
              <Link key={card.key} href={`/plan/plans/${home.focus!.id}?metric=${card.key}`} className="rounded-3xl border border-slate-200 p-5">
                <p className="text-sm text-[var(--color-ink-muted)]">{card.name}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{showMeasure(card.forecast ?? card.plan, card.unit, home.focus!.currency)}</p>
                <p className="mt-2 text-sm text-[var(--color-ink-muted)]">Plan {showMeasure(card.plan, card.unit, home.focus!.currency)} · Actual {showMeasure(card.actual, card.unit, home.focus!.currency)}</p>
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 p-6 lg:col-span-4">
          <h3 className="font-semibold">Needs a decision</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {watch.length ? watch.slice(0, 4).map((item) => <li key={item.title}><p className="font-medium">{item.title}</p><p className="text-[var(--color-ink-muted)]">{item.detail}</p></li>) : <li className="text-[var(--color-ink-muted)]">Nothing on this plan is off track yet. Enter a target and a forecast to see the gap.</li>}
          </ul>
          {good.length ? <p className="mt-4 text-sm text-[var(--color-ink-muted)]">{good.length} measure{good.length === 1 ? "" : "s"} on plan.</p> : null}
        </div>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 font-semibold">Plans</h3>
          <div className="divide-y divide-slate-100 rounded-3xl border border-slate-200">
            {home.plans.slice(0, 6).map((plan) => (
              <Link key={plan.id} href={`/plan/plans/${plan.id}`} className="flex items-center justify-between px-5 py-4">
                <span><span className="block font-medium">{plan.name}</span><span className="text-sm text-[var(--color-ink-muted)]">{planTypeLabel(plan.planType)} · {plan.periodLabel} · {audienceLabel(plan.audience, plan._count.shares)}</span></span>
                <span className="text-sm capitalize text-[var(--color-ink-muted)]">{plan.status}</span>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-3 font-semibold">Upcoming reviews</h3>
          <div className="rounded-3xl border border-slate-200 p-5">
            {home.reviews.length ? home.reviews.map((review) => (
              <Link key={review.id} href={`/plan/plans/${review.planId}`} className="mb-3 block">
                <span className="font-medium">{review.title}</span>
                <span className="block text-sm text-[var(--color-ink-muted)]">{review.planName}{review.scheduledFor ? ` · ${review.scheduledFor.toLocaleDateString("en-GB")}` : ""}</span>
              </Link>
            )) : <p className="text-sm text-[var(--color-ink-muted)]">No review is scheduled. Open a plan and add one.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
