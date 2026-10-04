import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { MANUFACTURING_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { todayBoard } from "@/modules/manufacturing/services/queries";

export default async function ManufacturingToday() {
  const session = await requireSession();
  assertCapability(session, C.orderRead);
  const board = await todayBoard(session.organisationId);
  const date = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const tiles = [
    { label: "Running", value: board.byStatus.running, href: "/manufacturing/produce" },
    { label: "Waiting to start", value: board.byStatus.waiting, href: "/manufacturing/produce" },
    { label: "Ready", value: board.byStatus.ready, href: "/manufacturing/produce" },
    { label: "Blocked", value: board.byStatus.blocked, href: "/manufacturing/produce" },
  ];
  return (
    <div className="space-y-10">
      <header>
        <p className="text-sm text-[var(--color-ink-muted)]">{date}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">{board.total} production orders active</h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--color-ink-muted)]">What needs attention right now. Machines live under Plant, and each product step chooses the one it runs on.</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href} className="rounded-3xl border border-[var(--color-border)] bg-white px-5 py-6 transition hover:border-[var(--color-atlas-blue)]">
            <p className="text-4xl font-semibold tabular-nums">{tile.value}</p>
            <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{tile.label}</p>
          </Link>
        ))}
      </div>
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">Needs attention</h2>
        <div className="mt-3 divide-y divide-[var(--color-border)] rounded-3xl border border-[var(--color-border)] bg-white">
          {board.attention.length === 0 && <p className="px-5 py-6 text-sm text-[var(--color-ink-muted)]">Nothing is overdue or blocked.</p>}
          {board.attention.map((item) => (
            <Link key={item.id} href={item.href} className="flex items-center justify-between gap-4 px-5 py-4 text-sm hover:bg-[var(--color-surface-sunken)]">
              <span>{item.label}</span>
              <span className={item.severity === "critical" ? "text-rose-600" : "text-amber-600"}>{item.severity === "critical" ? "Critical" : "Attention"}</span>
            </Link>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">Next completions</h2>
        <div className="mt-3 divide-y divide-[var(--color-border)] rounded-3xl border border-[var(--color-border)] bg-white">
          {board.nextCompletions.length === 0 && <p className="px-5 py-6 text-sm text-[var(--color-ink-muted)]">Nothing is currently running.</p>}
          {board.nextCompletions.map((row) => (
            <Link key={row.id} href={`/manufacturing/produce/${row.id}`} className="flex items-center justify-between gap-4 px-5 py-4 text-sm hover:bg-[var(--color-surface-sunken)]">
              <span>{row.plannedFinish?.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) ?? "—"} · {row.orderNumber} · {row.product}</span>
              <span className="text-[var(--color-ink-muted)]">{row.quantity}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
