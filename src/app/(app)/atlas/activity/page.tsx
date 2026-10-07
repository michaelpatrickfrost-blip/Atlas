import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
export default async function AdminActivity({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await requireSession();
  assertCapability(session, "atlas.companies.manage");
  const page = Math.max(1, Math.min(10000, Math.floor(Number((await searchParams).page) || 1)));
  const entries = await db.auditEntry.findMany({ where: { action: { startsWith: "atlas." } }, include: { organisation: { select: { name: true, kind: true } } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 51, skip: (page - 1) * 50 });
  const actors = await db.user.findMany({ where: { id: { in: [...new Set(entries.map(entry => entry.actorUserId).filter((id): id is string => !!id))] } }, select: { id: true, name: true } });
  return <div className="space-y-6"><div><h2 className="text-2xl font-semibold tracking-tight">Admin activity</h2><p className="mt-2 text-sm text-slate-500">Company changes, staff grants, recovery issuance, workspace access and generated exports. Codes and passwords never appear here.</p></div><div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">{entries.slice(0, 50).map(entry => <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 p-5"><div><p className="text-sm font-medium">{entry.action.replace(/^atlas\./, "").replaceAll(".", " · ").replaceAll("_", " ")}</p><p className="mt-2 text-xs text-slate-500">{entry.organisation?.name ?? "Deleted company"} · {actors.find(actor => actor.id === entry.actorUserId)?.name ?? "System"}</p></div><time className="text-xs text-slate-500">{entry.createdAt.toLocaleString("en-GB", { timeZone: "Europe/London" })}</time></div>)}{!entries.length && <p className="p-8 text-sm text-slate-500">No administration activity yet.</p>}</div><div className="flex justify-end gap-5 text-xs text-blue-700">{page > 1 && <Link href={`/atlas/activity?page=${page - 1}`}>Previous</Link>}{entries.length > 50 && <Link href={`/atlas/activity?page=${page + 1}`}>Next</Link>}</div></div>;
}
