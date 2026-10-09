import Link from "next/link";
import { CalendarDays, Building2, TrendingUp, UserRoundPlus, CircleAlert, ListTodo, ArrowUpRight } from "lucide-react";
import { WorkspaceHeading, WorkspaceLinks, WorkspaceStats } from "@/components/ui/workspace";
import { can } from "@/core/permissions/check";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { getWorkQueue } from "@/modules/crm/services/work-queue";
import { EmptyState } from "@/components/ui/empty-state";

function greeting(): string {
  const hour = new Date().getUTCHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** Today — the salesperson's work queue (§6). Not a dashboard: every item is
 *  something to act on, with an explicit reason (§7). */
export default async function TodayPage() {
  const session = await requireSession();
  assertCapability(session, SALES_CAPABILITIES.opportunityRead);

  const items = await getWorkQueue(session.organisationId, session.userId);
  const high = items.filter((item) => item.priority === "high");
  const normal = items.filter((item) => item.priority === "normal");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <WorkspaceHeading eyebrow="Your sales workspace" title={`${greeting()}, ${session.userName.split(" ")[0]}`} description={items.length ? `${items.length} things need your attention. Start with the priorities below, then make time for the next conversation.` : "Your queue is clear. Build your relationships, plan a conversation or develop your next deal."} actions={<Link href="/crm/appointments" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white"><CalendarDays size={16} />Open appointments</Link>} />
      <WorkspaceStats items={[{ label: "Needs attention", value: high.length, hint: "Overdue or at risk", icon: CircleAlert }, { label: "Also on your list", value: normal.length, hint: "Useful next actions", icon: ListTodo }, { label: "Conversations due", value: items.filter(item => item.kind === "activity").length, icon: CalendarDays }, { label: "Deals to progress", value: items.filter(item => item.kind === "opportunity").length, icon: TrendingUp }]} />
      <WorkspaceLinks items={[
        { title: "Appointments", description: "Book calls, demos and customer visits", href: "/crm/appointments", icon: CalendarDays },
        ...(can(session, "customers.read") ? [{ title: "Accounts", description: "People, notes and relationship history", href: "/crm/accounts", icon: Building2 }] : []),
        { title: "Pipeline", description: "See open deals and their next step", href: "/crm/pipeline", icon: TrendingUp },
        ...(can(session, "sales.prospect.read") ? [{ title: "Prospects", description: "Qualify and develop new business", href: "/crm/prospect", icon: UserRoundPlus }] : []),
      ]} />
      {items.length === 0 ? (
        <EmptyState title="All clear." description="New prospects, due activities and at-risk opportunities will show up here." />
      ) : (
        <>
          {high.length > 0 && (
            <section>
              <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">Needs you first</h2>
              <div className="flex flex-col gap-2">
                {high.map((item) => (
                  <WorkItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {normal.length > 0 && (
            <section>
              <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">Also today</h2>
              <div className="flex flex-col gap-2">
                {normal.map((item) => (
                  <WorkItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function WorkItemCard({ item }: { item: Awaited<ReturnType<typeof getWorkQueue>>[number] }) {
  return (
    <Link href={item.href} className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-blue-300 hover:bg-blue-50/30">
      <span className={`mt-2 size-1.5 shrink-0 rounded-full ${item.priority === "high" ? "bg-[var(--color-status-warning)]" : "bg-[var(--color-border-strong)]"}`} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-[var(--color-ink)] group-hover:text-[var(--color-atlas-blue)]">{item.title}</span>
        {item.subtitle && <span className="mt-0.5 block truncate text-sm text-[var(--color-ink-muted)]">{item.subtitle}</span>}
        <span className="mt-1 block text-xs text-[var(--color-ink-faint)]">{item.reason}</span>
      </span><ArrowUpRight size={17} className="shrink-0 text-slate-300 group-hover:text-blue-600" />
    </Link>
  );
}
