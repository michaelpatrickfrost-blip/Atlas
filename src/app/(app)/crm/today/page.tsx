import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { getWorkQueue } from "@/modules/crm/services/work-queue";
import { EmptyState } from "@/components/ui/empty-state";

function greeting(): string {
  const hour = new Date().getHours();
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-[var(--color-ink)]">
          {greeting()}, {session.userName.split(" ")[0]}.
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          {items.length === 0 ? "Nothing needs you right now." : `${items.length} ${items.length === 1 ? "thing needs" : "things need"} you today.`}
        </p>
      </div>

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
    <Link href={item.href} className="group flex items-start gap-4 border-b border-[var(--color-border)] py-4">
      <span className={`mt-2 size-1.5 shrink-0 rounded-full ${item.priority === "high" ? "bg-[var(--color-status-warning)]" : "bg-[var(--color-border-strong)]"}`} aria-hidden />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-[var(--color-ink)] group-hover:text-[var(--color-atlas-blue)]">{item.title}</span>
        {item.subtitle && <span className="mt-0.5 block truncate text-sm text-[var(--color-ink-muted)]">{item.subtitle}</span>}
        <span className="mt-1 block text-xs text-[var(--color-ink-faint)]">{item.reason}</span>
      </span>
    </Link>
  );
}
