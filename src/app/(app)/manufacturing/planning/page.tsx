import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { MANUFACTURING_CAPABILITIES } from "@/core/permissions/capabilities";
import { buildPlannerCockpit } from "@/modules/manufacturing/services/mrp-queries";
import { ActionForm } from "@/components/ui/action-form";
import { runMrpForm } from "./form-actions";
import { Card } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, Zap } from "lucide-react";

const whole = (value: number) => value.toLocaleString("en-GB", { maximumFractionDigits: 1 });
const money = (minor: number) => `£${(minor / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default async function PlanningCockpitPage() {
  const session = await requireSession();
  assertCapability(session, MANUFACTURING_CAPABILITIES.planRead);

  const cockpit = await buildPlannerCockpit(session.organisationId);
  const canManage = session.capabilities.has(MANUFACTURING_CAPABILITIES.planManage);
  const canReadCost = session.capabilities.has(MANUFACTURING_CAPABILITIES.costRead);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Production planning</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-ink-muted)]">
            What to make, what it consumes, which machines it runs on and how the work centres carry it.
            Every figure below comes from the last identified run, the shared stock chain or your real shifts.
          </p>
        </div>
        {canManage && (
          <ActionForm action={runMrpForm}>
            <button type="submit" className="rounded-full bg-[var(--color-atlas-blue)] px-5 py-2.5 text-sm font-semibold text-white">Run MRP</button>
          </ActionForm>
        )}
      </header>

      <p className="text-xs text-[var(--color-ink-faint)]">
        {cockpit.mrpRun
          ? <>Last run {cockpit.mrpRun.startedAt.toLocaleString("en-GB")} · {cockpit.mrpRun.productCount} product{cockpit.mrpRun.productCount === 1 ? "" : "s"} considered · {cockpit.mrpRun.suggestionCount} proposal{cockpit.mrpRun.suggestionCount === 1 ? "" : "s"}{cockpit.mrpRun.warnings.length > 0 && <> · {cockpit.mrpRun.warnings.join(" ")}</>}</>
          : "No planning run has been identified yet."}
      </p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MetricCard label="Material shortages" value={cockpit.shortageCount} variant={cockpit.shortageCount > 0 ? "warning" : "default"} icon={AlertTriangle} />
        <MetricCard label="Overloaded work centres" value={cockpit.overloadedResources} variant={cockpit.overloadedResources > 0 ? "warning" : "default"} icon={Zap} />
        <MetricCard label="Late production orders" value={cockpit.lateOrders} variant={cockpit.lateOrders > 0 ? "danger" : "default"} />
        <MetricCard label="Demand at risk" value={cockpit.atRiskDemand} variant={cockpit.atRiskDemand > 0 ? "danger" : "default"} />
        <MetricCard label="Proposals to review" value={cockpit.requiringAction} icon={TrendingUp} />
      </div>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">Planned production</h2>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              What the plan says to make and the hours each takes. Planned orders shows the same rows in detail.
              {canReadCost && <> Estimated costs are included with cost access.</>}
            </p>
          </div>
          <Link href="/manufacturing/planning/planned-orders" className="text-sm font-medium text-[var(--color-atlas-blue)]">Open planned orders</Link>
        </div>
        {cockpit.plan.length === 0 ? (
          <div className="mt-3 rounded-3xl border border-[var(--color-border)] bg-white px-6 py-10 text-center text-sm text-[var(--color-ink-muted)]">
            No planned production yet. Run MRP to turn confirmed demand and forecast into a plan.
          </div>
        ) : (
          <div className="mt-3 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-surface-sunken)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-faint)]">
                <tr>
                  <th className="px-5 py-3">Make</th>
                  <th className="px-5 py-3 text-right">Qty</th>
                  <th className="px-5 py-3 text-right">Machine h</th>
                  <th className="px-5 py-3 text-right">Crew h</th>
                  {canReadCost && <th className="px-5 py-3 text-right">Cost</th>}
                  <th className="px-5 py-3">Needed by</th>
                  <th className="px-5 py-3 text-right">Materials</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {cockpit.plan.map((row) => (
                  <tr key={row.productId} className={row.shortComponents > 0 ? "bg-amber-50" : ""}>
                    <td className="px-5 py-3">
                      <Link href={`/products/${row.productId}`} className="font-medium text-[var(--color-atlas-blue)] hover:underline">{row.productName}</Link>
                      <span className="ml-2 text-xs text-[var(--color-ink-faint)]">{row.productCode}</span>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">{whole(row.quantity)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{whole(row.machineHours)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{whole(row.crewHours)}</td>
                    {canReadCost && <td className="px-5 py-3 text-right tabular-nums font-semibold">{money(row.totalCostMinor)}</td>}
                    <td className="px-5 py-3">{row.neededBy.toLocaleDateString("en-GB")}</td>
                    <td className="px-5 py-3 text-right">
                      {row.shortComponents > 0
                        ? <span className="font-semibold text-amber-700">{row.shortComponents} short</span>
                        : <span className="text-emerald-700">ready</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">Work centre load</h2>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Hours every pending proposal would add over the next 4 weeks, against the hours each centre opens for.</p>
          </div>
          <Link href="/manufacturing/schedule" className="text-sm font-medium text-[var(--color-atlas-blue)]">Open the schedule</Link>
        </div>
        <div className="mt-3 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface-sunken)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-faint)]">
              <tr>
                <th className="px-5 py-3">Work centre</th>
                <th className="px-5 py-3 text-right">Planned hours</th>
                <th className="px-5 py-3 text-right">Available</th>
                <th className="px-5 py-3 text-right">Load</th>
                <th className="px-5 py-3">Basis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {cockpit.capacity.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-[var(--color-ink-muted)]">No work centres yet. Add them under Plant.</td></tr>
              )}
              {cockpit.capacity.map((row) => (
                <tr key={row.workCentreId} className={row.overloaded ? "bg-amber-50" : ""}>
                  <td className="px-5 py-3">
                    <span className="font-medium">{row.workCentre}</span>
                    <span className="ml-2 text-xs text-[var(--color-ink-faint)]">{row.code}</span>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{whole(row.requiredHours)}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{whole(row.availableHours)}</td>
                  <td className={`px-5 py-3 text-right tabular-nums font-semibold ${row.overloaded ? "text-amber-700" : ""}`}>{row.utilization}%</td>
                  <td className="px-5 py-3 text-xs text-[var(--color-ink-muted)]">
                    {row.usingConfiguredShifts ? "Your shifts" : "Weekday estimate — set shifts for a real figure"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">Demand outlook</h2>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="text-sm font-semibold">Next 7 days</div>
              <div className="text-3xl font-bold">{cockpit.demand7.reduce((sum, row) => sum + row.quantity, 0).toLocaleString("en-GB")}</div>
              <p className="text-xs text-[var(--color-ink-muted)]">units across {cockpit.demand7.length} day{cockpit.demand7.length === 1 ? "" : "s"}</p>
            </Card>
            <Card className="p-4">
              <div className="text-sm font-semibold">Next 30 days</div>
              <div className="text-3xl font-bold">{cockpit.demand30.reduce((sum, row) => sum + row.quantity, 0).toLocaleString("en-GB")}</div>
              <p className="text-xs text-[var(--color-ink-muted)]">units across {cockpit.demand30.length} day{cockpit.demand30.length === 1 ? "" : "s"}</p>
            </Card>
          </div>
          <p className="mt-2 text-xs text-[var(--color-ink-faint)]">Confirmed and on-hold sales lines only, less anything cancelled.</p>
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">Shortages by priority</h2>
          <div className="mt-3 grid grid-cols-3 gap-4">
            {(["CRITICAL", "HIGH", "NORMAL"] as const).map((priority) => (
              <Card key={priority} className="p-4 text-center">
                <div className={`text-2xl font-bold ${priority === "CRITICAL" ? "text-rose-600" : priority === "HIGH" ? "text-amber-600" : "text-slate-600"}`}>
                  {cockpit.shortagesByPriority[priority].length}
                </div>
                <div className="text-xs text-[var(--color-ink-muted)]">{priority}</div>
              </Card>
            ))}
          </div>
        </section>
      </div>

      {cockpit.topBottlenecks.length > 0 && (
        <Card className="p-5">
          <div className="text-sm font-semibold">Capacity bottlenecks</div>
          <div className="mt-4 space-y-4">
            {cockpit.topBottlenecks.map((bottleneck) => (
              <div key={bottleneck.workCentre} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{bottleneck.workCentre}</span>
                  <span className="text-xs text-[var(--color-ink-muted)]">{bottleneck.utilization}% · {whole(bottleneck.requiredHours)} of {whole(bottleneck.capacity)} h</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200">
                  <div
                    className={`h-2 rounded-full ${bottleneck.utilization > 100 ? "bg-rose-500" : bottleneck.utilization > 80 ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min(bottleneck.utilization, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function MetricCard({ label, value, variant = "default", icon: Icon }: { label: string; value: number; variant?: "default" | "warning" | "danger"; icon?: typeof AlertTriangle }) {
  const colors = { default: "bg-slate-50 text-slate-900", warning: "bg-amber-50 text-amber-900", danger: "bg-rose-50 text-rose-900" };
  return (
    <Card className={colors[variant]}>
      <div className="p-5">
        <div className="flex items-end gap-2">
          <div>
            <div className="text-3xl font-bold">{value}</div>
            <p className="text-xs text-[var(--color-ink-muted)]">{label}</p>
          </div>
          {Icon && <Icon className="mb-1 h-5 w-5 opacity-50" />}
        </div>
      </div>
    </Card>
  );
}
