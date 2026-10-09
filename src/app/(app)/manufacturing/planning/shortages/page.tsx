import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { MANUFACTURING_CAPABILITIES } from "@/core/permissions/capabilities";
import { getMaterialShortages } from "@/modules/manufacturing/services/mrp-queries";
import { Card } from "@/components/ui/card";
import { AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";

const whole = (value: number) => value.toLocaleString("en-GB", { maximumFractionDigits: 2 });

export default async function ShortageWorkbenchPage() {
  const session = await requireSession();
  assertCapability(session, MANUFACTURING_CAPABILITIES.planRead);

  const shortages = await getMaterialShortages(session.organisationId, 200);
  const critical = shortages.filter((row) => row.priority === "CRITICAL");
  const high = shortages.filter((row) => row.priority === "HIGH");
  const normal = shortages.filter((row) => row.priority === "NORMAL");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Shortages</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-ink-muted)]">
          Parts and sub-assemblies the current plan cannot cover from stock. Each line is what the plan consumes
          less what is on hand right now.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <SummaryCard count={critical.length} label="Critical" tone="critical" />
        <SummaryCard count={high.length} label="High" tone="warning" />
        <SummaryCard count={normal.length} label="Normal" tone="default" />
      </div>

      {shortages.length === 0 ? (
        <Card className="border-emerald-200 bg-emerald-50 p-8 text-center">
          <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-emerald-600" />
          <p className="font-semibold text-emerald-900">No material shortages</p>
          <p className="text-sm text-emerald-700">Every component in the current plan is covered by stock.</p>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface-sunken)] text-left text-xs uppercase tracking-wide text-[var(--color-ink-faint)]">
              <tr>
                <th className="px-5 py-3">Component</th>
                <th className="px-5 py-3 text-right">Needed</th>
                <th className="px-5 py-3 text-right">On hand</th>
                <th className="px-5 py-3 text-right">Short</th>
                <th className="px-5 py-3">Required by</th>
                <th className="px-5 py-3">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {shortages.map((row) => (
                <tr key={row.productId} className={row.priority === "CRITICAL" ? "bg-rose-50" : ""}>
                  <td className="px-5 py-3">
                    <Link href={`/products/${row.productId}`} className="font-medium text-[var(--color-atlas-blue)] hover:underline">{row.productName}</Link>
                    <span className="ml-2 text-xs text-[var(--color-ink-faint)]">{row.productCode}</span>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{whole(row.requiredQuantity)}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{whole(row.availableQuantity)}</td>
                  <td className="px-5 py-3 text-right tabular-nums font-semibold text-rose-700">{whole(row.shortageQuantity)}</td>
                  <td className="px-5 py-3">{row.requiredDate.toLocaleDateString("en-GB")}</td>
                  <td className="px-5 py-3">
                    <span className={row.priority === "CRITICAL" ? "font-semibold text-rose-700" : row.priority === "HIGH" ? "font-semibold text-amber-700" : "text-[var(--color-ink-muted)]"}>
                      {row.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-[var(--color-ink-faint)]">
        Buying is not connected to this screen yet — a shortage here is a warning to raise a purchase order in Finance,
        or to make the sub-assembly sooner.
      </p>
    </div>
  );
}

function SummaryCard({ count, label, tone }: { count: number; label: string; tone: "critical" | "warning" | "default" }) {
  const colors = { critical: "bg-rose-50 text-rose-900", warning: "bg-amber-50 text-amber-900", default: "bg-slate-50 text-slate-900" };
  const Icon = tone === "critical" ? AlertTriangle : tone === "warning" ? AlertCircle : null;
  return (
    <Card className={colors[tone]}>
      <div className="flex items-end gap-2 p-5">
        <div>
          <div className="text-3xl font-bold">{count}</div>
          <p className="text-xs text-[var(--color-ink-muted)]">{label}</p>
        </div>
        {Icon && <Icon className="mb-1 h-5 w-5 opacity-50" />}
      </div>
    </Card>
  );
}
