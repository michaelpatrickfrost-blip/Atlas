import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { assertCapability } from "@/core/permissions/check";
import { CSAT_CAPABILITIES } from "@/core/permissions/capabilities";
import { ActionForm } from "@/components/ui/action-form";
import { saveSurvey, setSurveyActive } from "@/modules/csat/services/actions";

const input = "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm";

export default async function CsatSurveys() {
  const session = await requireSession();
  assertCapability(session, CSAT_CAPABILITIES.manage);
  const surveys = await db.csatSurvey.findMany({ where: { organisationId: session.organisationId }, orderBy: { createdAt: "desc" } });
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link href="/csat" className="text-xs font-medium text-[#0071e3]">← Satisfaction (CSAT)</Link>
      <h1 className="text-2xl font-semibold tracking-tight">Surveys</h1>
      <div className="space-y-3">
        {surveys.map((s) => (
          <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3"><p className="font-semibold">{s.name}</p><ActionForm action={setSurveyActive}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="active" value={String(!s.active)} /><button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs">{s.active ? "Turn off" : "Turn on"}</button></ActionForm></div>
            <p className="mt-1 text-sm text-slate-500">{s.question}</p>
          </div>
        ))}
      </div>
      <details className="rounded-2xl border border-slate-200 bg-white p-5" open={!surveys.length}>
        <summary className="cursor-pointer text-sm font-semibold">Add a survey</summary>
        <ActionForm action={saveSurvey} className="mt-4 space-y-3">
          <label className="text-sm font-medium">Name<input name="name" required className={input} placeholder="Post-delivery satisfaction" /></label>
          <label className="text-sm font-medium">Question<input name="question" required className={input} defaultValue="How satisfied were you with your order?" /></label>
          <label className="text-sm font-medium">Follow-up question<input name="followUpQuestion" className={input} defaultValue="Anything we could do better?" /></label>
          <label className="text-sm font-medium">Thank-you message<input name="thanksText" className={input} defaultValue="Thank you for your feedback." /></label>
          <button className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs text-white">Add survey</button>
        </ActionForm>
      </details>
      <p className="text-xs text-slate-500">Send a survey from Automations (&quot;Send a satisfaction survey&quot;) after an order ships or a case closes.</p>
    </div>
  );
}
