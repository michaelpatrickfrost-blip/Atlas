import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import { getWorkQueue } from "@/modules/sales/services/work-queue";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
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
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
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
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">Priority</h2>
              <div className="flex flex-col gap-2">
                {high.map((item) => (
                  <WorkItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {normal.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">Today</h2>
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
    <Link href={item.href}>
      <Card className="flex items-center justify-between gap-3 p-4 hover:border-[var(--color-border-strong)]">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {item.priority === "high" && <StatusPill label="High" tone="danger" />}
            <p className="truncate font-medium text-[var(--color-ink)]">{item.title}</p>
          </div>
          {item.subtitle && <p className="truncate text-sm text-[var(--color-ink-muted)]">{item.subtitle}</p>}
          <p className="mt-1 text-xs text-[var(--color-ink-faint)]">{item.reason}</p>
        </div>
      </Card>
    </Link>
  );
}
