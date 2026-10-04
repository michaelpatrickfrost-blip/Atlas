import Link from "next/link";
import { Zap, Plus } from "lucide-react";
import { requireSession } from "@/core/auth/session";
import { listAutomations } from "@/modules/automations/services/queries";
import { summarise, TRIGGERS } from "@/modules/automations/engine/catalogue";
import { ActionForm } from "@/components/ui/action-form";
import { setAutomationEnabled } from "@/modules/automations/services/actions";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { TEMPLATES } from "@/modules/automations/engine/templates";

export default async function AutomationsHome() {
  const session = await requireSession();
  const automations = await listAutomations(session);
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><Zap size={22} className="text-blue-500" /> Automations</h1>
          <p className="mt-1 text-sm text-slate-500">When something happens in Atlas, do something about it — automatically, across the whole business.</p>
        </div>
        <Link href="/automations/new" className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white"><Plus size={16} /> New automation</Link>
      </div>

      {!automations.length && (
        <div className="space-y-4">
          <EmptyState title="No automations yet" description="Start from a ready-made one, or build your own." />
          <div className="grid gap-3 md:grid-cols-2">
            {TEMPLATES.map((t) => (
              <Link key={t.key} href={`/automations/new?template=${t.key}`} className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300">
                <p className="font-semibold">{t.name}</p>
                <p className="mt-1 text-sm text-slate-500">{t.description}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {automations.length > 0 && (
        <div className="space-y-3">
          {automations.map((a) => {
            const trig = TRIGGERS.find((t) => t.event === a.triggerEvent);
            return (
              <div key={a.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                <Link href={`/automations/${a.id}`} className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{a.name}</p>
                    <StatusPill label={a.enabled ? "On" : "Off"} tone={a.enabled ? "success" : "neutral"} />
                  </div>
                  <p className="mt-1 truncate text-sm text-slate-500">{summarise(a.triggerEvent, a.triggerType, (a.conditions as never) ?? [], (a.steps as never) ?? [], a.schedule as never)}</p>
                  <p className="mt-1 text-xs text-slate-400">{a.triggerType === "SCHEDULE" ? "On a schedule" : trig?.group ?? ""} · Run {a.runCount} time{a.runCount === 1 ? "" : "s"}{a.failCount ? ` · ${a.failCount} failed` : ""}</p>
                </Link>
                <ActionForm action={setAutomationEnabled}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="enabled" value={String(!a.enabled)} />
                  <button className={`rounded-lg px-3 py-1.5 text-xs ${a.enabled ? "border border-slate-200" : "bg-blue-600 text-white"}`}>{a.enabled ? "Turn off" : "Turn on"}</button>
                </ActionForm>
              </div>
            );
          })}
        </div>
      )}
      <Link href="/automations/activity" className="text-sm text-blue-700">See recent activity →</Link>
    </div>
  );
}
