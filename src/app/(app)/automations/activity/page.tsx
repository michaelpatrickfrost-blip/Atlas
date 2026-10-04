import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { StatusPill } from "@/components/ui/status-pill";

export default async function AutomationActivity() {
  const session = await requireSession();
  const runs = await db.automationRun.findMany({ where: { organisationId: session.organisationId }, orderBy: { startedAt: "desc" }, take: 50, include: { automation: { select: { name: true } } } });
  const tone: Record<string, "success" | "danger" | "neutral" | "warning"> = { SUCCEEDED: "success", FAILED: "danger", RUNNING: "warning" };
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div><Link href="/automations" className="text-xs font-medium text-[#0071e3]">← Automations</Link><h1 className="mt-2 text-2xl font-semibold tracking-tight">Activity</h1></div>
      <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
        {runs.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <Link href={`/automations/${r.automationId}`} className="min-w-0 truncate">{r.automation.name}<span className="ml-2 text-xs text-slate-400">{new Date(r.startedAt).toLocaleString("en-GB")}</span></Link>
            <StatusPill label={r.status.toLowerCase()} tone={tone[r.status] ?? "neutral"} />
          </div>
        ))}
        {!runs.length && <p className="p-4 text-sm text-slate-500">Nothing has run yet.</p>}
      </div>
    </div>
  );
}
