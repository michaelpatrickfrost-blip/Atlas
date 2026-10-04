import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { MANUFACTURING_CAPABILITIES } from "@/core/permissions/capabilities";
import { getLatestMrpRun } from "@/modules/manufacturing/services/mrp-queries";
import { db } from "@/core/db/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { firmPlannedOrderForm, dismissPlannedOrderForm } from "../form-actions";
import { StatusPill } from "@/components/ui/status-pill";
import { BarChart3, Zap, Package } from "lucide-react";

export default async function PlannedOrdersPage() {
  const session = await requireSession();
  assertCapability(session, MANUFACTURING_CAPABILITIES.planRead);

  const run = await getLatestMrpRun(session.organisationId);
  if (!run) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">No planning run executed yet. Run MRP first.</p>
        </div>
      </div>
    );
  }

  // Get all suggestions
  const suggestions = await db.manufacturingSupplySuggestion.findMany({
    where: { runId: run.runId },
    include: { product: true },
    orderBy: { neededBy: "asc" },
  });

  const byStatus = {
    PENDING: suggestions.filter((s) => s.status === "PENDING"),
    FIRMED: suggestions.filter((s) => s.status === "FIRMED"),
    DISMISSED: suggestions.filter((s) => s.status === "DISMISSED"),
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Planned Orders</h1>
        <p className="text-sm text-muted-foreground">
          MRP run from {run.startedAt.toLocaleString()} · {suggestions.length} total suggestions
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-3xl font-bold text-amber-600">{byStatus.PENDING.length}</div>
          <p className="text-xs text-muted-foreground">Pending</p>
        </Card>
        <Card className="p-4">
          <div className="text-3xl font-bold text-green-600">{byStatus.FIRMED.length}</div>
          <p className="text-xs text-muted-foreground">Firmed</p>
        </Card>
        <Card className="p-4">
          <div className="text-3xl font-bold text-slate-600">{byStatus.DISMISSED.length}</div>
          <p className="text-xs text-muted-foreground">Dismissed</p>
        </Card>
      </div>

      {/* Pending suggestions */}
      {byStatus.PENDING.length > 0 && (
        <SuggestionSection
          title="Pending (Requires Action)"
          suggestions={byStatus.PENDING}
          status="PENDING"
          icon={Zap}
        />
      )}

      {/* Firmed */}
      {byStatus.FIRMED.length > 0 && (
        <SuggestionSection
          title="Firmed (Converted to Orders)"
          suggestions={byStatus.FIRMED}
          status="FIRMED"
          icon={Package}
        />
      )}

      {/* Dismissed */}
      {byStatus.DISMISSED.length > 0 && (
        <SuggestionSection
          title="Dismissed"
          suggestions={byStatus.DISMISSED}
          status="DISMISSED"
          icon={BarChart3}
        />
      )}
    </div>
  );
}

function SuggestionSection({
  title,
  suggestions,
  status,
  icon: Icon,
}: {
  title: string;
  suggestions: any[];
  status: "PENDING" | "FIRMED" | "DISMISSED";
  icon?: any;
}) {
  const bgClasses = {
    PENDING: "bg-amber-50 border-amber-200",
    FIRMED: "bg-green-50 border-green-200",
    DISMISSED: "bg-slate-50 border-slate-200",
  };

  return (
    <Card className={`${bgClasses[status]} border p-4`}>
      <div className="mb-4 flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5" />}
        <div className="text-lg font-semibold">{title}</div>
        <div className="ml-auto rounded-full bg-white px-3 py-1 text-sm font-semibold">{suggestions.length}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr className="text-left text-xs font-semibold text-muted-foreground">
              <th className="pb-2 pr-4">Product</th>
              <th className="pb-2 pr-4">Quantity</th>
              <th className="pb-2 pr-4">Needed By</th>
              <th className="pb-2 pr-4">Type</th>
              <th className="pb-2 pr-4">Pegging</th>
              {status === "PENDING" && <th className="pb-2 pr-4">Actions</th>}
            </tr>
          </thead>
          <tbody className="space-y-2">
            {suggestions.map((suggestion) => (
              <SuggestionRow
                key={suggestion.id}
                suggestion={suggestion}
                status={status}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SuggestionRow({ suggestion, status }: { suggestion: any; status: "PENDING" | "FIRMED" | "DISMISSED" }) {
  const peggingData = typeof suggestion.pegging === "string" ? JSON.parse(suggestion.pegging) : suggestion.pegging || [];
  const demandCount = Array.isArray(peggingData) ? peggingData.length : 0;

  return (
    <tr className="border-b text-xs last:border-b-0">
      <td className="py-3 pr-4">
        <div className="font-semibold">{suggestion.product.name}</div>
        <div className="text-muted-foreground">{suggestion.product.code}</div>
      </td>
      <td className="py-3 pr-4 font-semibold">{Number(suggestion.quantity).toLocaleString()}</td>
      <td className="py-3 pr-4">
        {suggestion.neededBy ? new Date(suggestion.neededBy).toLocaleDateString() : "—"}
      </td>
      <td className="py-3 pr-4">
        <StatusPill label={suggestion.kind} tone={suggestion.kind === "MAKE" ? "success" : suggestion.kind === "BUY" ? "warning" : "neutral"} />
      </td>
      <td className="py-3 pr-4 text-muted-foreground">
        {demandCount} {demandCount === 1 ? "line" : "lines"}
      </td>
      {status === "PENDING" && (
        <td className="py-3 pr-4 space-x-2">
          <form action={firmPlannedOrderForm} className="inline">
            <input type="hidden" name="suggestionId" value={suggestion.id} />
            <Button type="submit" variant="primary">
              Firm
            </Button>
          </form>
          <form action={dismissPlannedOrderForm} className="inline">
            <input type="hidden" name="suggestionId" value={suggestion.id} />
            <Button type="submit" variant="ghost">
              Dismiss
            </Button>
          </form>
        </td>
      )}
      {status === "FIRMED" && (
        <td className="py-3 pr-4">
          {suggestion.resultingOrderId && (
            <a href={`/manufacturing/orders/${suggestion.resultingOrderId}`} className="text-blue-600 hover:underline">
              View Order
            </a>
          )}
        </td>
      )}
    </tr>
  );
}
