import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { GUARDIAN_CAPABILITY, ISSUE_STATES } from "@/core/guardian/report";
import { SweepButton } from "./form-controls";
import { requestGuardianSweep } from "./actions";
import { workerIsOnline } from "@/core/guardian/store";

export const dynamic = "force-dynamic";
export default async function GuardianPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; queued?: string; page?: string }> }) {
  const session = await requireSession();
  assertCapability(session, GUARDIAN_CAPABILITY);
  const { status = "active", q = "", queued, page: rawPage } = await searchParams;
  const page = Math.min(10000, Math.max(1, Math.trunc(Number(rawPage) || 1)));
  const where = { ...(ISSUE_STATES.includes(status as typeof ISSUE_STATES[number]) ? { status } : status === "all" ? {} : { status: { notIn: ["FIXED", "IGNORED"] } }), ...(q ? { OR: [{ title: { contains: q.slice(0, 100), mode: "insensitive" as const } }, { route: { contains: q.slice(0, 100), mode: "insensitive" as const } }] } : {}) };
  const [issues, count, runs, worker] = await Promise.all([db.guardianIssue.findMany({ where, orderBy: [{ lastSeenAt: "desc" }], take: 30, skip: (page - 1) * 30 }), db.guardianIssue.count({ where }), db.guardianRun.findMany({ orderBy: { createdAt: "desc" }, take: 4 }), db.guardianWorker.findUnique({ where: { id: "guardian" } })]);
  const online = workerIsOnline(worker);
  const next = new URLSearchParams({ status, q, page: String(page + 1) });
  const previous = new URLSearchParams({ status, q, page: String(page - 1) });
  return <div className="mx-auto max-w-6xl space-y-6 pb-10">
    <Link href="/atlas" className="text-sm text-blue-700">← Atlas Admin</Link>
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold tracking-tight">Atlas Guardian</h1><p className="mt-2 max-w-2xl text-sm text-slate-500">Page failures, broken connections and repair briefs. Visible only to Atlas staff.</p></div><form action={requestGuardianSweep}><SweepButton /></form></div>
    {queued && <p role="status" className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">Sweep queued. The worker picks it up within five minutes. Refresh to see progress.</p>}
    <div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border bg-white p-5"><p className="text-xs text-slate-500">Worker</p><p className={`mt-2 font-semibold ${online ? "text-emerald-700" : "text-amber-700"}`}>{online ? "Monitoring" : "Not reporting"}</p><p className="mt-2 text-xs text-slate-500">{worker ? `Last heartbeat ${worker.heartbeatAt.toLocaleString("en-GB", { timeZone: "Europe/London" })}` : "No worker heartbeat received yet."}</p></div><div className="rounded-2xl border bg-white p-5"><p className="text-xs text-slate-500">Matching reports</p><p className="mt-2 text-2xl font-semibold">{count}</p></div><div className="rounded-2xl border bg-white p-5"><p className="text-xs text-slate-500">Verification standard</p><p className="mt-2 text-sm font-medium">A passing page is one check</p><p className="mt-2 text-xs text-slate-500">Button behaviour and connected writes require their own regression or browser check.</p></div></div>
    <section className="rounded-2xl border bg-white p-5"><h2 className="font-semibold">Recent sweeps</h2>{runs.length ? runs.map(run => <div key={run.id} className="mt-4 border-t pt-3 text-xs"><div className="flex flex-wrap justify-between gap-2"><span className="font-medium">{run.status} · {run.createdAt.toLocaleString("en-GB", { timeZone: "Europe/London" })}</span><span>{run.revision || "Awaiting worker"}</span></div><p className="mt-2 text-slate-600">{run.summary || "Waiting for the next worker tick."}</p></div>) : <p className="mt-3 text-sm text-slate-500">No sweep completed yet.</p>}</section>
    <form className="flex flex-wrap gap-3"><input aria-label="Search reports" name="q" defaultValue={q} placeholder="Search page or issue…" className="min-w-48 flex-1 rounded-xl border px-4 py-3 text-sm" /><select aria-label="Report status" name="status" defaultValue={status} className="rounded-xl border px-3 text-sm"><option value="active">Active reports</option><option value="all">All reports</option>{ISSUE_STATES.map(state => <option key={state}>{state}</option>)}</select><button className="rounded-xl border bg-white px-5 py-3 text-sm">Filter</button></form>
    <div className="divide-y overflow-hidden rounded-2xl border bg-white">{issues.map(issue => <Link key={issue.id} href={`/atlas/guardian/${issue.id}`} className="block p-5 hover:bg-slate-50"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold">{issue.title}</h2><span className="text-xs text-slate-500">{issue.severity} · {issue.status}</span></div><p className="mt-2 text-xs text-slate-500">{issue.route} · {issue.occurrences} observations · {issue.kind}</p><p className="mt-2 text-sm text-slate-600">{issue.actual}</p></Link>)}{!issues.length && <p className="p-8 text-sm text-slate-500">No matching reports. Use the sweep coverage above to see what has actually been checked.</p>}</div>
    <nav aria-label="Report pages" className="flex justify-between text-sm">{page > 1 ? <Link href={`?${previous}`}>← Previous</Link> : <span />}{page * 30 < count && <Link href={`?${next}`}>Next →</Link>}</nav>
  </div>;
}
