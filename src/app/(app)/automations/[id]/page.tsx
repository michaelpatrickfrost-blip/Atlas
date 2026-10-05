import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { notFound } from "next/navigation";
import { getAutomation, listRuns } from "@/modules/automations/services/queries";
import { Builder } from "../builder";
import { ActionForm } from "@/components/ui/action-form";
import { deleteAutomation, runNow } from "@/modules/automations/services/actions";
import { StatusPill } from "@/components/ui/status-pill";

export default async function AutomationDetail({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  const [automation, runs, templates, surveys, accounts, audiences] = await Promise.all([
    getAutomation(session, id),
    listRuns(session, id),
    db.emailTemplate.findMany({ where: { organisationId: session.organisationId }, select: { id: true, name: true, category: true }, orderBy: { name: "asc" } }),
    db.csatSurvey.findMany({ where: { organisationId: session.organisationId, active: true }, select: { id: true, name: true } }),
    db.emailAccount.findMany({ where: { organisationId: session.organisationId, active: true }, select: { id: true, label: true } }),
    db.marketingAudience.findMany({ where: { organisationId: session.organisationId }, select: { id: true, name: true } }),
  ]);
  if (!automation) notFound();
  const tone: Record<string, "success" | "danger" | "neutral" | "warning"> = { SUCCEEDED: "success", FAILED: "danger", RUNNING: "warning" };
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/automations" className="text-xs font-medium text-[#0071e3]">← Automations</Link>
        <div className="flex gap-2">
          {automation.triggerType !== "EVENT" && <ActionForm action={runNow}><input type="hidden" name="id" value={automation.id} /><button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs">Run now</button></ActionForm>}
          <ActionForm action={deleteAutomation}><input type="hidden" name="id" value={automation.id} /><button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-red-700">Delete</button></ActionForm>
        </div>
      </div>
      <Builder
        initial={{ id: automation.id, name: automation.name, description: automation.description, triggerType: automation.triggerType, triggerEvent: automation.triggerEvent, conditions: (automation.conditions as never) ?? [], steps: (automation.steps as never) ?? [], schedule: (automation.schedule as never) ?? {} }}
        options={{ templates, surveys, accounts, audiences }}
      />
      <section>
        <h2 className="mb-3 text-base font-semibold">Run history</h2>
        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
          {runs.map((r) => (
            <details key={r.id} className="p-4">
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm">
                <span>{new Date(r.startedAt).toLocaleString("en-GB")} {r.dryRun && <span className="text-slate-400">(test)</span>}</span>
                <StatusPill label={r.status.toLowerCase()} tone={tone[r.status] ?? "neutral"} />
              </summary>
              <ol className="mt-3 space-y-1.5 text-xs text-slate-600">
                {((r.results as never as Array<{ step: string; type: string; status: string; detail: string }>) ?? []).map((s, i) => (
                  <li key={`${r.id}-${i}`} className={s.status === "FAILED" ? "text-red-700" : s.status === "SKIPPED" ? "text-slate-400" : ""}>{s.detail}</li>
                ))}
              </ol>
              {r.error && <p className="mt-2 text-xs text-red-700">{r.error}</p>}
            </details>
          ))}
          {!runs.length && <p className="p-4 text-sm text-slate-500">Not run yet.</p>}
        </div>
      </section>
    </div>
  );
}
