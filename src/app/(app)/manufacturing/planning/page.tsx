import { redirect } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { MANUFACTURING_CAPABILITIES } from "@/core/permissions/capabilities";
import { buildPlannerCockpit, getMaterialShortages, getLatestMrpRun } from "@/modules/manufacturing/services/mrp-queries";
import { runMrpAction, firmPlannedOrderAction } from "./actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, Zap } from "lucide-react";

export default async function PlanningCockpitPage() {
  const session = await requireSession();
  assertCapability(session, MANUFACTURING_CAPABILITIES.planRead);

  const [cockpit, shortages, latestRun] = await Promise.all([
    buildPlannerCockpit(session.organisationId),
    getMaterialShortages(session.organisationId, 5),
    getLatestMrpRun(session.organisationId),
  ]);

  return (
    <div className="space-y-6 p-6">
      {/* Header with run MRP button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Production Planning Cockpit</h1>
          <p className="text-sm text-muted-foreground">
            {latestRun ? `Last run: ${latestRun.startedAt.toLocaleString()}` : "No planning run executed yet"}
          </p>
        </div>
        <form action={runMrpAction} method="POST">
          <Button type="submit" size="lg">
            Run MRP
          </Button>
        </form>
      </div>

      {/* Attention Section */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <MetricCard
          label="Component Shortages"
          value={cockpit.shortageCount}
          variant={cockpit.shortageCount > 0 ? "warning" : "default"}
          icon={AlertTriangle}
        />
        <MetricCard
          label="Overloaded Resources"
          value={cockpit.overloadedResources}
          variant={cockpit.overloadedResources > 0 ? "warning" : "default"}
          icon={Zap}
        />
        <MetricCard label="Late Orders" value={cockpit.lateOrders} variant={cockpit.lateOrders > 0 ? "danger" : "default"} />
        <MetricCard label="At-Risk Demand" value={cockpit.atRiskDemand} variant={cockpit.atRiskDemand > 0 ? "danger" : "default"} />
        <MetricCard label="Requires Action" value={cockpit.requiringAction} icon={TrendingUp} />
      </div>

      {/* Top Shortages */}
      {shortages.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 p-4">
          <div className="mb-4 text-lg font-semibold">Material Shortages</div>
          <div className="space-y-3">
            {shortages.map((shortage) => (
              <div key={shortage.productId} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                <div>
                  <div className="font-semibold">{shortage.productName}</div>
                  <div className="text-sm text-muted-foreground">
                    Short {shortage.shortageQuantity} units, needed {shortage.requiredDate.toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${shortage.priority === "CRITICAL" ? "text-red-600" : "text-orange-600"}`}>
                    {shortage.priority}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Demand Outlook */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-4">
          <div className="text-sm font-semibold mb-2">7-Day Demand</div>
          <div className="text-3xl font-bold">{cockpit.demand7.reduce((sum, d) => sum + d.quantity, 0)}</div>
          <p className="text-xs text-muted-foreground">units across {cockpit.demand7.length} days</p>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-semibold mb-2">30-Day Demand</div>
          <div className="text-3xl font-bold">{cockpit.demand30.reduce((sum, d) => sum + d.quantity, 0)}</div>
          <p className="text-xs text-muted-foreground">units across {cockpit.demand30.length} days</p>
        </Card>
      </div>

      {/* Bottlenecks */}
      {cockpit.topBottlenecks.length > 0 && (
        <Card className="p-4">
          <div className="mb-4 text-sm font-semibold">Capacity Bottlenecks</div>
          <div className="space-y-4">
            {cockpit.topBottlenecks.map((bottleneck) => (
              <div key={bottleneck.workCentre} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{bottleneck.workCentre}</div>
                  <div className="text-xs text-muted-foreground">{bottleneck.utilization}% utilization</div>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className={`h-2 rounded-full ${bottleneck.utilization > 80 ? "bg-red-500" : "bg-green-500"}`}
                    style={{ width: `${Math.min(bottleneck.utilization, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Supply Risk */}
      <Card className="p-4">
        <div className="mb-4 text-sm font-semibold">Supply Risk by Priority</div>
        <div className="grid grid-cols-3 gap-4 text-center">
          {(["CRITICAL", "HIGH", "NORMAL"] as const).map((priority) => {
            const items = cockpit.shortagesByPriority.get(priority) || [];
            return (
              <div key={priority}>
                <div className={`text-2xl font-bold ${priority === "CRITICAL" ? "text-red-600" : priority === "HIGH" ? "text-orange-600" : "text-gray-600"}`}>
                  {items.length}
                </div>
                <div className="text-xs text-muted-foreground">{priority}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  variant?: "default" | "warning" | "danger";
  icon?: any;
}

function MetricCard({ label, value, variant = "default", icon: Icon }: MetricCardProps) {
  const colors = {
    default: "bg-slate-50 text-slate-900",
    warning: "bg-amber-50 text-amber-900",
    danger: "bg-red-50 text-red-900",
  };

  return (
    <Card className={colors[variant]}>
      <CardContent className="pt-6">
        <div className="flex items-end gap-2">
          <div>
            <div className="text-3xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
          {Icon && <Icon className="h-5 w-5 mb-1 opacity-50" />}
        </div>
      </CardContent>
    </Card>
  );
}
