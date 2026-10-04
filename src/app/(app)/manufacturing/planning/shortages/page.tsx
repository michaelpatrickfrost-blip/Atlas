import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { MANUFACTURING_CAPABILITIES } from "@/core/permissions/capabilities";
import { getMaterialShortages } from "@/modules/manufacturing/services/mrp-queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";

export default async function ShortageWorkbenchPage() {
  const session = await requireSession();
  assertCapability(session, MANUFACTURING_CAPABILITIES.planRead);

  const shortages = await getMaterialShortages(session.organisationId, 100);

  const critical = shortages.filter((s) => s.priority === "CRITICAL");
  const high = shortages.filter((s) => s.priority === "HIGH");
  const normal = shortages.filter((s) => s.priority === "NORMAL");

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Material Shortage Workbench</h1>
        <p className="text-sm text-muted-foreground">{shortages.length} shortages identified</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard count={critical.length} label="Critical" variant="danger" />
        <SummaryCard count={high.length} label="High" variant="warning" />
        <SummaryCard count={normal.length} label="Normal" variant="default" />
      </div>

      {/* Shortage lists */}
      {critical.length > 0 && (
        <ShortageSection title="Critical Shortages" shortages={critical} priority="CRITICAL" />
      )}
      {high.length > 0 && (
        <ShortageSection title="High Priority Shortages" shortages={high} priority="HIGH" />
      )}
      {normal.length > 0 && (
        <ShortageSection title="Normal Shortages" shortages={normal} priority="NORMAL" />
      )}

      {shortages.length === 0 && (
        <Card className="border-green-200 bg-green-50 p-6 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600 mb-2" />
          <p className="font-semibold text-green-900">No material shortages identified</p>
          <p className="text-sm text-green-700">Your supply plan is healthy.</p>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({
  count,
  label,
  variant,
}: {
  count: number;
  label: string;
  variant: "critical" | "danger" | "warning" | "default";
}) {
  const colors = {
    critical: "bg-red-50 text-red-900",
    danger: "bg-red-50 text-red-900",
    warning: "bg-amber-50 text-amber-900",
    default: "bg-slate-50 text-slate-900",
  };

  return (
    <Card className={`${colors[variant]} p-4`}>
      <div className="text-3xl font-bold">{count}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}

function ShortageSection({
  title,
  shortages,
  priority,
}: {
  title: string;
  shortages: any[];
  priority: "CRITICAL" | "HIGH" | "NORMAL";
}) {
  const bgColors = {
    CRITICAL: "bg-red-50 border-red-200",
    HIGH: "bg-amber-50 border-amber-200",
    NORMAL: "bg-slate-50 border-slate-200",
  };

  const iconColors = {
    CRITICAL: "text-red-600",
    HIGH: "text-amber-600",
    NORMAL: "text-slate-600",
  };

  return (
    <Card className={`${bgColors[priority]} border p-4`}>
      <div className="mb-4 flex items-center gap-2">
        {priority === "CRITICAL" && <AlertTriangle className={`h-5 w-5 ${iconColors[priority]}`} />}
        {priority === "HIGH" && <AlertCircle className={`h-5 w-5 ${iconColors[priority]}`} />}
        <div className="text-lg font-semibold">{title}</div>
      </div>
      <div className="space-y-4">
        {shortages.map((shortage) => (
          <ShortageRow key={shortage.productId} shortage={shortage} />
        ))}
      </div>
    </Card>
  );
}

function ShortageRow({ shortage }: { shortage: any }) {
  const shortagePercent = Math.round((shortage.shortageQuantity / shortage.requiredQuantity) * 100);

  return (
    <div className="border-b pb-4 last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="font-semibold">{shortage.productName}</div>
          <div className="text-sm text-muted-foreground">{shortage.productCode}</div>

          <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Required</div>
              <div className="font-semibold">{shortage.requiredQuantity} units</div>
            </div>
            <div>
              <div className="text-muted-foreground">Short</div>
              <div className="font-semibold text-red-600">
                {shortage.shortageQuantity} units ({shortagePercent}%)
              </div>
            </div>
          </div>

          <div className="mt-3 h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-red-500"
              style={{ width: `${Math.min(shortagePercent, 100)}%` }}
            />
          </div>

          <div className="mt-3 text-xs text-muted-foreground">
            Needed: {shortage.requiredDate.toLocaleDateString()}
          </div>

          {shortage.suggestedActions && shortage.suggestedActions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {shortage.suggestedActions.map((action: any, idx: number) => (
                <Button key={idx} size="sm" variant="outline">
                  {action.action === "EXPEDITE_SUPPLY" && "📦 Expedite"}
                  {action.action === "REDUCE_DEMAND" && "📉 Reduce Demand"}
                  {action.action === "SUBSTITUTE" && "🔄 Substitute"}
                  {action.action === "TRANSFER_STOCK" && "📍 Transfer"}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
