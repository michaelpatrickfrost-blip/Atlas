import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { createTeam } from "@/modules/teams/services/commands";
import { listPlanner } from "@/modules/teams/services/queries";

export default async function TeamsPage() {
  const session = await requireSession();
  const planner = await listPlanner(session);
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Your teams</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--color-ink-muted)]">Add the people who work together. They can see each other’s holidays, who is covering, and the tasks their lead has set.</p>
        </div>
      </header>
      {planner.teams.length === 0 && (
        <div className="rounded-3xl border border-dashed border-[var(--color-border)] bg-white px-6 py-10">
          <p className="text-lg font-medium">No team yet</p>
          <p className="mt-2 max-w-lg text-sm text-[var(--color-ink-muted)]">{planner.manage ? "Name the team, then add the people. Holidays already booked in HR appear on the calendar." : "When a lead adds you, their holidays, cover and tasks show up here."}</p>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {planner.teams.map((team) => (
          <Link key={team.id} href={`/teams/${team.id}`} className="rounded-3xl border border-[var(--color-border)] bg-white p-5 transition hover:border-[var(--color-atlas-blue)]">
            <p className="text-xl font-semibold tracking-tight">{team.name}</p>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{team.people.length === 1 ? "1 person" : `${team.people.length} people`}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {team.people.slice(0, 8).map((person) => (
                <span key={person.id} className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface-sunken)] px-3 py-1 text-sm">
                  <span className="h-2 w-2 rounded-full" style={{ background: person.colour }} />
                  {person.name}
                  {person.lead ? <span className="text-[var(--color-ink-muted)]">Lead</span> : null}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
      {planner.manage && (
        <ActionForm action={createTeam} className="flex flex-wrap items-end gap-3 rounded-3xl border border-[var(--color-border)] bg-white p-5">
          <label className="min-w-64 flex-1 text-sm">
            <span className="mb-1 block font-medium">New team</span>
            <input name="name" required maxLength={80} placeholder="Warehouse days" className="w-full rounded-2xl border border-[var(--color-border)] px-3 py-2" />
          </label>
          <Button type="submit" variant="primary">Create team</Button>
        </ActionForm>
      )}
    </div>
  );
}
