import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/ui/action-form";
import { requireSession } from "@/core/auth/session";
import { can } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { loadAuditAccess, saveAuditAreas, saveAuditOwnActivity } from "@/modules/audit/services/actions";

export default async function AuditAccessPage({ searchParams }: { searchParams: Promise<{ user?: string }> }) {
  const session = await requireSession();
  if (!can(session, CORE_CAPABILITIES.usersManage) && !can(session, CORE_CAPABILITIES.modulesManage)) redirect("/audit");
  const params = await searchParams;
  const board = await loadAuditAccess(params.user);
  const selected = board.people.find((person) => person.id === board.selectedId) ?? null;
  const selectedAreas = new Set(board.grants.find((grant) => grant.userId === selected?.id)?.areaIds ?? []);
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Access</h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">Choose who can see each area of Audit. A person can be assigned to one area or several. Company readers and team managers keep the view they already have.</p>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-base font-semibold">Own activity</h3>
        <p className="mt-2 text-sm text-slate-500">When this is on, everyone in the company can open Audit and see the changes they made. They do not see other people unless an area is assigned, or they already manage a team.</p>
        <ActionForm action={saveAuditOwnActivity} className="mt-5 space-y-4">
          <label className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4 text-sm">
            <span>People can see their own activity</span>
            <input name="ownActivity" type="checkbox" defaultChecked={board.ownActivity} className="size-5 accent-blue-600" />
          </label>
          <button className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs text-white">Save own activity</button>
        </ActionForm>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-base font-semibold">Assigned areas</h3>
        <p className="mt-2 text-sm text-slate-500">Someone assigned to Sales sees every recorded Sales change. Tick more than one area when they should see several.</p>
        <form action="/audit/access" className="mt-5 flex flex-wrap items-end gap-2">
          <label className="min-w-56 flex-1 text-xs">Person
            <select name="user" defaultValue={selected?.id ?? ""} className="mt-2 block w-full rounded-xl border border-slate-200 bg-white p-3 text-sm">
              <option value="">Choose a person</option>
              {board.people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
            </select>
          </label>
          <button className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">Choose</button>
        </form>
        {selected && (
          <ActionForm action={saveAuditAreas} className="mt-5 space-y-4">
            <input type="hidden" name="userId" value={selected.id} />
            <p className="text-sm font-medium">{selected.name}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {board.areas.map((area) => (
                <label key={area.id} className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs">
                  <input name="area" type="checkbox" value={area.id} defaultChecked={selectedAreas.has(area.id)} className="mt-0.5 accent-blue-600" />
                  <span><span className="block font-medium">{area.name}</span><span className="mt-1 block text-slate-500">{area.summary}</span></span>
                </label>
              ))}
            </div>
            <button className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs text-white">Save areas</button>
          </ActionForm>
        )}
        <div className="mt-6 divide-y divide-slate-100">
          {board.grants.map((grant) => (
            <div key={grant.userId} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium">{grant.name}</p>
                <p className="mt-1 text-xs text-slate-500">{grant.areaIds.map((id) => board.areas.find((area) => area.id === id)?.name ?? id).join(", ")}</p>
              </div>
              <Link href={`/audit/access?user=${grant.userId}`} className="text-xs text-blue-700">Change</Link>
            </div>
          ))}
          {!board.grants.length && <p className="pt-4 text-sm text-slate-500">Nobody is assigned to an area yet.</p>}
        </div>
      </section>
    </div>
  );
}
