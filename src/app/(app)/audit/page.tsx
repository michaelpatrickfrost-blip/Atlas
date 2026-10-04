import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { AUDIT_AREA_CAPABILITY, AUDIT_OWN_CAPABILITY } from "@/core/audit/access";
import { AUDIT_CAPABILITIES, CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { loadAuditBoard } from "@/modules/audit/services/actions";

function link(params: { person?: string; system?: string; team?: string; days?: string; q?: string }, patch: Record<string, string | null>) {
  const next = new URLSearchParams();
  const merged = { ...params, ...patch };
  for (const [key, value] of Object.entries(merged)) if (value) next.set(key, value);
  const query = next.toString();
  return query ? `/audit?${query}` : "/audit";
}

function reportHref(params: { person?: string; system?: string; team?: string; days?: string; q?: string }) {
  const next = new URLSearchParams();
  if (params.q) next.set("q", params.q);
  if (params.person) next.set("person", params.person);
  if (params.system) next.set("system", params.system);
  if (params.team) next.set("team", params.team);
  if (params.days && params.days !== "7") next.set("days", params.days);
  const query = next.toString();
  return query ? `/api/audit/report?${query}` : "/api/audit/report";
}

export default async function AuditTeamPage({ searchParams }: { searchParams: Promise<{ person?: string; system?: string; team?: string; days?: string; q?: string }> }) {
  const session = await requireSession();
  const activity = can(session, AUDIT_CAPABILITIES.teamRead) || can(session, CORE_CAPABILITIES.auditRead) || can(session, AUDIT_AREA_CAPABILITY) || can(session, AUDIT_OWN_CAPABILITY);
  if (!activity) redirect(can(session, CORE_CAPABILITIES.usersManage) || can(session, CORE_CAPABILITIES.modulesManage) ? "/audit/access" : "/audit/echo");
  const params = await searchParams;
  const days = params.days === "1" || params.days === "30" ? params.days : "7";
  const q = (params.q ?? "").trim().slice(0, 80);
  const board = await loadAuditBoard({
    personId: params.person,
    systemId: params.system,
    teamId: params.team,
    days: Number(days),
    query: q,
  });
  const query = { person: board.personId ?? undefined, system: board.systemId ?? undefined, team: board.teamId ?? undefined, days, q: board.query || undefined };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{board.title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-muted)]">{board.detail}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {["1", "7", "30"].map((value) => (
            <Link key={value} href={link(query, { days: value === "7" ? null : value })} className={`rounded-full px-3 py-1.5 text-sm ${days === value ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>{value === "1" ? "Today" : `${value} days`}</Link>
          ))}
          <a href={reportHref(query)} className="rounded-full bg-white px-3 py-1.5 text-sm text-slate-700 ring-1 ring-slate-200">Download report</a>
        </div>
      </div>
      <form action="/audit" className="flex flex-wrap items-center gap-2">
        {query.person && <input type="hidden" name="person" value={query.person} />}
        {query.system && <input type="hidden" name="system" value={query.system} />}
        {query.team && <input type="hidden" name="team" value={query.team} />}
        {days !== "7" && <input type="hidden" name="days" value={days} />}
        <input name="q" defaultValue={board.query} placeholder="Search people, changes or areas" maxLength={80} className="min-w-64 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm" />
        <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm text-white">Search</button>
        {board.query && <Link href={link(query, { q: null })} className="text-sm text-slate-500">Clear</Link>}
      </form>
      {board.teams.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Link href={link(query, { team: null, person: null })} className={`rounded-full px-3 py-1.5 text-sm ${board.teamId ? "bg-white ring-1 ring-slate-200" : "bg-blue-600 text-white"}`}>All in this view</Link>
          {board.teams.map((team) => (
            <Link key={team.id} href={link(query, { team: team.id, person: null })} className={`rounded-full px-3 py-1.5 text-sm ${board.teamId === team.id ? "bg-blue-600 text-white" : "bg-white ring-1 ring-slate-200"}`}>{team.name}</Link>
          ))}
        </div>
      )}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {board.systems.map((system) => (
          <Link key={system.id} href={link(query, { system: board.systemId === system.id ? null : system.id })} className={`rounded-2xl border bg-white p-4 ${board.systemId === system.id ? "border-blue-400" : "border-slate-200"}`}>
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-semibold">{system.name}</h3>
              <span className="text-sm text-slate-500">{system.count}</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">{system.summary}</p>
          </Link>
        ))}
      </section>
      {board.unclassified.length > 0 && <p className="text-xs text-slate-500">Not yet classified: {board.unclassified.join(", ")}. These still appear in the list below.</p>}
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-2">
          <Link href={link(query, { person: null })} className={`block rounded-2xl px-4 py-3 text-sm ${board.personId ? "bg-white ring-1 ring-slate-200" : "bg-slate-900 text-white"}`}>Everyone in this view</Link>
          {board.people.map((person) => (
            <Link key={person.id} href={link(query, { person: person.id })} className={`block rounded-2xl px-4 py-3 ${board.personId === person.id ? "bg-slate-900 text-white" : "bg-white ring-1 ring-slate-200"}`}>
              <span className="block text-sm font-medium">{person.name}</span>
              <span className={`mt-1 block text-xs ${board.personId === person.id ? "text-slate-300" : "text-slate-500"}`}>{person.detail} · {person.count} {person.count === 1 ? "change" : "changes"}</span>
            </Link>
          ))}
          {!board.people.length && <p className="rounded-2xl bg-white px-4 py-6 text-sm text-slate-500 ring-1 ring-slate-200">No people in this view yet.</p>}
        </aside>
        <section className="divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200">
          {board.entries.map((entry) => (
            <article key={entry.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
              <div>
                <p className="text-sm font-medium">{entry.actorName} · {entry.label}</p>
                <p className="mt-1 text-xs text-slate-500">{entry.systemName}{entry.detail ? ` · ${entry.detail}` : ""}</p>
              </div>
              <div className="text-right text-xs text-slate-400">
                <time>{new Date(entry.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</time>
                {entry.href && <Link href={entry.href} className="mt-2 block text-blue-700">Open Echo</Link>}
              </div>
            </article>
          ))}
          {!board.entries.length && <p className="px-5 py-10 text-sm text-slate-500">{board.query ? "No changes match this search." : "No changes recorded for this view."}</p>}
        </section>
      </div>
    </div>
  );
}
