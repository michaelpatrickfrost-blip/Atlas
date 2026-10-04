import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { assertCapability } from "@/core/permissions/check";
import { CSAT_CAPABILITIES } from "@/core/permissions/capabilities";

export default async function CsatResults() {
  const session = await requireSession();
  assertCapability(session, CSAT_CAPABILITIES.read);
  const responses = await db.csatResponse.findMany({ where: { organisationId: session.organisationId, respondedAt: { not: null } }, orderBy: { respondedAt: "desc" }, take: 100, include: { survey: { select: { name: true } } } });
  const scored = responses.filter((r) => r.score !== null);
  const avg = scored.length ? scored.reduce((s, r) => s + (r.score ?? 0), 0) / scored.length : null;
  const distribution = [1, 2, 3, 4, 5].map((n) => scored.filter((r) => r.score === n).length);
  const sent = await db.csatResponse.count({ where: { organisationId: session.organisationId } });
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div><h1 className="text-2xl font-semibold tracking-tight">Satisfaction (CSAT)</h1><p className="mt-1 text-sm text-slate-500">Results from surveys sent by Automations, Sales and Service.</p></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs text-slate-500">Average score</p><p className="mt-1 text-2xl font-semibold">{avg ? avg.toFixed(1) : "—"} / 5</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs text-slate-500">Responses</p><p className="mt-1 text-2xl font-semibold">{scored.length}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs text-slate-500">Response rate</p><p className="mt-1 text-2xl font-semibold">{sent ? Math.round((scored.length / sent) * 100) : 0}%</p></div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Distribution</p>
        <div className="space-y-1.5">
          {distribution.map((count, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="w-4">{i + 1}</span>
              <div className="h-2 flex-1 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-500" style={{ width: `${scored.length ? (count / scored.length) * 100 : 0}%` }} /></div>
              <span className="w-8 text-right text-slate-400">{count}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
        {responses.filter((r) => r.comment).map((r) => (
          <div key={r.id} className="px-4 py-3 text-sm"><span className="font-semibold">{r.score}/5</span> · {r.survey.name} — <span className="text-slate-600">{r.comment}</span></div>
        ))}
        {!responses.length && <p className="p-4 text-sm text-slate-500">No responses yet.</p>}
      </div>
      <Link href="/csat/surveys" className="text-sm text-blue-700">Manage surveys →</Link>
    </div>
  );
}
