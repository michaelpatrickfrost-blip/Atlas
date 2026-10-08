import { SourceGoals } from "@/modules/kpis/components/source-goals";
import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { db } from "@/core/db/client";
import { assertCapability, can } from "@/core/permissions/check";
import { CSAT_CAPABILITIES } from "@/core/permissions/capabilities";
import { StatusPill } from "@/components/ui/status-pill";

const panel = "rounded-2xl border border-slate-200 bg-white p-5";
const since = (days: number) => new Date(Date.now() - days * 86_400_000);

export default async function CsatResults({ searchParams }: { searchParams: Promise<{ survey?: string; days?: string }> }) {
  const session = await requireSession();
  assertCapability(session, CSAT_CAPABILITIES.read);
  const organisationId = session.organisationId, filters = await searchParams;
  const days = [30, 90, 365].includes(Number(filters.days)) ? Number(filters.days) : 90;
  const surveys = await db.csatSurvey.findMany({ where: { organisationId }, select: { id: true, name: true, reasons: true }, orderBy: { name: "asc" } });
  const surveyId = surveys.find((survey) => survey.id === filters.survey)?.id ?? "";
  const where = { organisationId, sentAt: { gte: since(days) }, ...(surveyId ? { surveyId } : {}) };
  const [sent, responses] = await Promise.all([
    db.csatResponse.count({ where }),
    db.csatResponse.findMany({ where: { ...where, score: { not: null } }, orderBy: { respondedAt: "desc" }, take: 500, select: { id: true, score: true, comment: true, reasons: true, respondedAt: true, email: true, partyId: true, surveyId: true } }),
  ]);
  const parties = await db.party.findMany({ where: { organisationId, id: { in: [...new Set(responses.map((row) => row.partyId).filter((id): id is string => !!id))] } }, select: { id: true, name: true } });
  const partyName = new Map(parties.map((party) => [party.id, party.name])), surveyName = new Map(surveys.map((survey) => [survey.id, survey.name]));
  const scores = responses.map((row) => row.score ?? 0), average = scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : null;
  const happy = scores.filter((value) => value >= 4).length, unhappy = responses.filter((row) => (row.score ?? 0) <= 3);
  const distribution = [5, 4, 3, 2, 1].map((value) => ({ value, count: scores.filter((score) => score === value).length }));
  const reasons = new Map<string, { low: number; high: number }>();
  for (const row of responses) for (const reason of row.reasons) { const entry = reasons.get(reason) ?? { low: 0, high: 0 }; if ((row.score ?? 0) <= 3) entry.low += 1; else entry.high += 1; reasons.set(reason, entry); }
  const ranked = [...reasons].sort((a, b) => b[1].low + b[1].high - (a[1].low + a[1].high));
  const most = Math.max(1, ...ranked.map(([, entry]) => entry.low + entry.high));
  const cards: [string, string, string][] = [["Average score", average ? `${average.toFixed(1)} / 5` : "—", `${scores.length} answers`], ["Happy customers", scores.length ? `${Math.round((happy / scores.length) * 100)}%` : "—", "Scored 4 or 5"], ["Need a call", String(unhappy.length), "Scored 3 or lower"], ["Response rate", sent ? `${Math.round((scores.length / sent) * 100)}%` : "—", `${sent} sent`]];
  const when = (value: Date | null) => value ? value.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";
  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="text-2xl font-semibold tracking-tight">Customer satisfaction</h2><p className="mt-1 text-sm text-slate-500">What customers scored, why, and who needs a call back.</p></div>
      {can(session, CSAT_CAPABILITIES.manage) && <Link href="/csat/surveys" className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700">Surveys and templates</Link>}
    </div>
    <SourceGoals session={session} prefixes={["csat."]}/>
    <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <label className="min-w-48 flex-1 text-xs text-slate-500">Survey<select name="survey" defaultValue={surveyId} className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="">All surveys</option>{surveys.map((survey) => <option key={survey.id} value={survey.id}>{survey.name}</option>)}</select></label>
      <label className="text-xs text-slate-500">Sent in the last<select name="days" defaultValue={days} className="mt-1.5 block rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value={30}>30 days</option><option value={90}>90 days</option><option value={365}>12 months</option></select></label>
      <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white">Apply</button>
    </form>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, note]) => <figure key={label} className={panel}><figcaption className="text-xs text-slate-500">{label}</figcaption><p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p><p className="mt-2 text-xs text-slate-500">{note}</p></figure>)}</div>
    {!surveys.length ? <p className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">No surveys yet. <Link href="/csat/surveys" className="font-medium text-blue-600">Start from a template →</Link></p> : <>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className={panel}><h3 className="text-sm font-semibold">Scores</h3><div className="mt-4 space-y-2">{distribution.map((row) => <div key={row.value} className="flex items-center gap-3 text-sm"><span className="w-4 tabular-nums">{row.value}</span><div className="h-2.5 flex-1 rounded-full bg-slate-100"><div className={`h-2.5 rounded-full ${row.value >= 4 ? "bg-emerald-500" : row.value === 3 ? "bg-amber-400" : "bg-red-500"}`} style={{ width: `${scores.length ? (row.count / scores.length) * 100 : 0}%` }} /></div><span className="w-8 text-right tabular-nums text-slate-500">{row.count}</span></div>)}</div></section>
        <section className={panel}><h3 className="text-sm font-semibold">Reasons customers ticked</h3><p className="mt-1 text-xs text-slate-500">Green with a good score, red with a poor one.</p>{ranked.length ? <div className="mt-4 space-y-2">{ranked.slice(0, 10).map(([reason, entry]) => <div key={reason} className="text-sm"><div className="flex justify-between gap-3"><span>{reason}</span><span className="tabular-nums text-slate-500">{entry.high} good · {entry.low} poor</span></div><div className="mt-1 flex h-2 overflow-hidden rounded-full bg-slate-100"><div className="bg-emerald-500" style={{ width: `${(entry.high / most) * 100}%` }} /><div className="bg-red-500" style={{ width: `${(entry.low / most) * 100}%` }} /></div></div>)}</div> : <p className="mt-4 text-sm text-slate-500">No reasons ticked yet.</p>}</section>
      </div>
      <section className={panel}><h3 className="text-sm font-semibold">Answers</h3>{responses.length ? <ul className="mt-3 divide-y divide-slate-100">{responses.slice(0, 60).map((row) => <li key={row.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
        <div className="min-w-0 flex-1"><p className="text-sm">{row.partyId ? <Link href={`/customers/${row.partyId}`} className="font-medium text-blue-700">{partyName.get(row.partyId) ?? "Customer"}</Link> : <span className="font-medium">{row.email ?? "Unknown"}</span>}<span className="ml-2 text-xs text-slate-400">{surveyName.get(row.surveyId)} · {when(row.respondedAt)}</span></p>{row.comment && <p className="mt-1 text-sm text-slate-600">“{row.comment}”</p>}{!!row.reasons.length && <p className="mt-1 text-xs text-slate-500">{row.reasons.join(" · ")}</p>}</div>
        <StatusPill label={`${row.score} / 5`} tone={(row.score ?? 0) >= 4 ? "success" : row.score === 3 ? "warning" : "danger"} />
      </li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No answers in this period.</p>}</section>
    </>}
  </div>;
}
