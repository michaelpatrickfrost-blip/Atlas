import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { LOGISTICS_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { todayBoard } from "@/modules/logistics/services/queries";
import { DemandSync } from "@/modules/logistics/components/demand-sync";
import { LivePulse } from "@/modules/logistics/components/live";

export default async function LogisticsToday() {
  const session = await requireSession();
  assertCapability(session, C.fulfilmentRead);
  const board = await todayBoard(session.organisationId);
  const date = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const tiles = [
    { label: "Orders to fulfil", value: board.open, href: "/logistics/fulfil" },
    { label: "Ready to pick", value: board.readyToPick, href: "/logistics/fulfil?view=ready" },
    { label: "Being packed", value: board.packing, href: "/logistics/fulfil" },
    { label: "Ready to dispatch", value: board.readyToDispatch, href: "/logistics/dispatch" },
  ];
  return (
    <div className="space-y-10">
      <DemandSync />
      <LivePulse />
      <header>
        <p className="text-sm text-[var(--color-ink-muted)]">{date}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">What needs moving?</h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--color-ink-muted)]">{board.mode === "SIMPLE" ? "Pick, then ship." : board.mode === "ADVANCED" ? "Reserve, wave, pick, pack, stage, load, ship." : "Pick, pack, then ship."} Every number opens the work behind it.</p>
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
          {board.attention.length === 0 && <p className="px-5 py-6 text-sm text-[var(--color-ink-muted)]">Nothing is late, short or blocked.</p>}
          {board.attention.map((item) => (
            <Link key={item.label} href={item.href} className="flex items-center justify-between gap-4 px-5 py-4 text-sm hover:bg-[var(--color-surface-sunken)]">
              <span>{item.label}</span>
              <span className={item.tone === "critical" ? "text-rose-600" : "text-amber-600"}>{item.tone === "critical" ? "Blocked" : "Attention"}</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">Dispatch today</h2>
          <div className="mt-3 space-y-2">
            {board.dispatch.length === 0 && <p className="rounded-3xl border border-[var(--color-border)] bg-white px-5 py-6 text-sm text-[var(--color-ink-muted)]">No carrier is waiting on a collection.</p>}
            {board.dispatch.map((row) => (
              <Link key={row.carrier} href="/logistics/dispatch" className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-white px-5 py-4">
                <span className="font-medium">{row.carrier.replaceAll("_", " ")}</span>
                <span className="text-sm text-[var(--color-ink-muted)]">{row.count} shipments · Cut-off {row.cutoff}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-[var(--color-border)] bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">Warehouse</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div><div className="flex justify-between"><dt>Picking</dt><dd>{board.warehouse.picking}%</dd></div><div className="mt-2 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-[var(--color-atlas-blue)]" style={{ width: `${board.warehouse.picking}%` }} /></div></div>
            <div><div className="flex justify-between"><dt>Packing</dt><dd>{board.warehouse.packing}%</dd></div><div className="mt-2 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${board.warehouse.packing}%` }} /></div></div>
            <div className="flex justify-between"><dt>Ready</dt><dd>{board.warehouse.ready}</dd></div>
            <div className="flex justify-between"><dt>Exceptions</dt><dd className={board.warehouse.exceptions ? "text-rose-600" : ""}>{board.warehouse.exceptions}</dd></div>
          </dl>
        </div>
      </section>
    </div>
  );
}
