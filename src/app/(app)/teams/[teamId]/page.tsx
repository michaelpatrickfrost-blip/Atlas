import {WorkspaceTabs} from "@/components/ui/people-workspace";
import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { loadBoard } from "@/modules/teams/services/queries";
import {
  addMember, removeMember, renameTeam, saveCover, saveHandover,
  saveMoment, removeMoment, savePlace, saveTask, setTaskStatus, removeTask,
} from "@/modules/teams/services/commands";
import { PLACE_LABELS, MOMENT_LABELS, shiftMonth } from "@/modules/teams/domain/board";

const PLACE_TONE: Record<string, string> = {
  OFFICE: "bg-[var(--color-status-info-bg)] text-[var(--color-status-info)]",
  HOME: "bg-[var(--color-surface-sunken)] text-[var(--color-ink-muted)]",
  SITE: "bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning)]",
  TRAVEL: "bg-[var(--color-status-success-bg)] text-[var(--color-status-success)]",
};

export default async function TeamBoardPage({
  params, searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ month?: string; day?: string }>;
}) {
  const session = await requireSession();
  const { teamId } = await params;
  const query = await searchParams;
  const board = await loadBoard(session, teamId, query.month, query.day);
  const prevMonth = shiftMonth(board.monthKey, -1);
  const nextMonth = shiftMonth(board.monthKey, 1);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/teams" className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-atlas-blue)]">← Your teams</Link>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">{board.team.name}</h1>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{board.people.length === 1 ? "1 person" : `${board.people.length} people`} · {board.monthLabel}</p>
        </div>
        {board.manage && (
          <ActionForm action={renameTeam} className="flex items-end gap-2">
            <input type="hidden" name="teamId" value={board.team.id} />
            <label className="text-sm">
              <span className="mb-1 block font-medium">Rename team</span>
              <input name="name" defaultValue={board.team.name} maxLength={80} required className="w-56 rounded-2xl border border-[var(--color-border)] px-3 py-2" />
            </label>
            <Button type="submit" variant="secondary">Save</Button>
          </ActionForm>
        )}
      </header>

      <WorkspaceTabs active="calendar" items={[{id:"work",label:"Work & capacity",href:`/teams/${board.team.id}/capacity`},{id:"calendar",label:"Calendar, people & cover",href:`/teams/${board.team.id}`}]}/>
      <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Who&rsquo;s on {board.dayLabel}</h2>
          <nav className="flex items-center gap-3 text-sm">
            <Link href={`/teams/${board.team.id}?month=${prevMonth}`} className="text-[var(--color-ink-muted)] hover:text-[var(--color-atlas-blue)]">← Prev</Link>
            <span className="font-medium">{board.monthLabel}</span>
            <Link href={`/teams/${board.team.id}?month=${nextMonth}`} className="text-[var(--color-ink-muted)] hover:text-[var(--color-atlas-blue)]">Next →</Link>
          </nav>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs">
          {board.calendar.map((cell) => (
            <Link
              key={cell.key}
              href={`/teams/${board.team.id}?month=${board.monthKey}&day=${cell.key}`}
              className={`rounded-xl border px-1 py-2 ${cell.key === board.day ? "border-[var(--color-atlas-blue)] bg-[var(--color-status-info-bg)]" : "border-transparent hover:border-[var(--color-border)]"} ${cell.inMonth ? "" : "opacity-40"}`}
            >
              <p className="font-medium">{Number(cell.key.slice(8, 10))}</p>
              <p className={`mt-1 ${cell.thin ? "text-[var(--color-status-warning)]" : "text-[var(--color-ink-muted)]"}`}>{cell.working ? `${cell.available}/${cell.working}` : "—"}</p>
              {cell.names.map((person) => (
                <span key={person.name} className="mt-1 block truncate" style={{ color: person.colour }}>{person.name}</span>
              ))}
              {cell.more > 0 && <span className="block text-[var(--color-ink-muted)]">+{cell.more}</span>}
            </Link>
          ))}
        </div>

        <ul className="mt-5 divide-y divide-[var(--color-border)]">
          {board.selected.map((person) => (
            <li key={person.employeeId} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: person.colour }} />
                <div>
                  <p className="font-medium">{person.name} {person.lead && <span className="text-xs text-[var(--color-ink-muted)]">Lead</span>}</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">{person.title ?? "—"}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {!person.working && <span className="rounded-full bg-[var(--color-surface-sunken)] px-3 py-1 text-[var(--color-ink-muted)]">Not working</span>}
                {person.awayLabel && <span className="rounded-full bg-[var(--color-status-warning-bg)] px-3 py-1 text-[var(--color-status-warning)]">{person.awayLabel}</span>}
                {person.place && <span className={`rounded-full px-3 py-1 ${PLACE_TONE[person.place] ?? ""}`}>{PLACE_LABELS[person.place as keyof typeof PLACE_LABELS]}</span>}
                {person.coverName && <span className="rounded-full bg-[var(--color-status-success-bg)] px-3 py-1 text-[var(--color-status-success)]">Covered by {person.coverName}</span>}
                {person.handover && <span className="rounded-full bg-[var(--color-surface-sunken)] px-3 py-1 text-[var(--color-ink-muted)]">Handover left</span>}
              </div>
            </li>
          ))}
        </ul>

        {(board.manage || board.selfId) && (
          <ActionForm action={savePlace} className="mt-4 flex flex-wrap items-end gap-2 border-t border-[var(--color-border)] pt-4">
            <input type="hidden" name="onDate" value={board.day} />
            <label className="text-xs">
              <span className="mb-1 block font-medium">Set where</span>
              <select name="employeeId" required defaultValue={board.selfId ?? ""} className="rounded-2xl border border-[var(--color-border)] px-3 py-2">
                {board.people.map((person) => (
                  <option key={person.employeeId} value={person.employeeId} disabled={!board.manage && person.employeeId !== board.selfId}>{person.name}</option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              <span className="mb-1 block font-medium">is</span>
              <select name="kind" required className="rounded-2xl border border-[var(--color-border)] px-3 py-2">
                {Object.entries(PLACE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="text-xs">
              <span className="mb-1 block font-medium">Note</span>
              <input name="note" maxLength={120} className="rounded-2xl border border-[var(--color-border)] px-3 py-2" />
            </label>
            <Button type="submit" variant="secondary">Save</Button>
          </ActionForm>
        )}
      </section>

      <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5">
        <h2 className="text-lg font-semibold">People</h2>
        <ul className="mt-3 divide-y divide-[var(--color-border)]">
          {board.people.map((person) => (
            <li key={person.memberId} className="flex items-center justify-between gap-3 py-2">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: person.colour }} />
                <span>{person.name}{person.lead && <span className="ml-2 text-xs text-[var(--color-ink-muted)]">Lead</span>}</span>
              </div>
              {board.manage && (
                <ActionForm action={removeMember}>
                  <input type="hidden" name="teamId" value={board.team.id} />
                  <input type="hidden" name="memberId" value={person.memberId} />
                  <Button type="submit" variant="ghost" className="text-xs">Remove</Button>
                </ActionForm>
              )}
            </li>
          ))}
        </ul>
        {board.manage && "candidates" in board && (
          <ActionForm action={addMember} className="mt-4 flex flex-wrap items-end gap-2 border-t border-[var(--color-border)] pt-4">
            <input type="hidden" name="teamId" value={board.team.id} />
            <label className="text-xs">
              <span className="mb-1 block font-medium">Add a person</span>
              <select name="employeeId" required className="w-56 rounded-2xl border border-[var(--color-border)] px-3 py-2">
                <option value="">Choose…</option>
                {board.candidates.map((person) => (
                  <option key={person.id} value={person.id}>{person.name}{person.title ? ` · ${person.title}` : ""}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" name="lead" /> Lead
            </label>
            <Button type="submit" variant="primary">Add</Button>
          </ActionForm>
        )}
      </section>

      <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5">
        <h2 className="text-lg font-semibold">Tasks the lead has set</h2>
        <ul className="mt-3 divide-y divide-[var(--color-border)]">
          {board.tasks.map((task) => (
            <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className={`font-medium ${task.status === "DONE" ? "line-through text-[var(--color-ink-muted)]" : ""}`}>{task.title}</p>
                <p className="text-xs text-[var(--color-ink-muted)]">{task.assigneeName}{task.due ? ` · due ${task.due}` : ""}{task.clash ? " · clashes with time off" : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                {(board.manage || task.mine) && (
                  <ActionForm action={setTaskStatus} className="flex items-center gap-2">
                    <input type="hidden" name="teamId" value={board.team.id} />
                    <input type="hidden" name="taskId" value={task.id} />
                    <input type="hidden" name="version" value={task.version} />
                    <select name="status" defaultValue={task.status} className="rounded-2xl border border-[var(--color-border)] px-2 py-1 text-xs">
                      <option value="OPEN">Open</option>
                      <option value="DOING">Doing</option>
                      <option value="DONE">Done</option>
                    </select>
                    <Button type="submit" variant="ghost">Update</Button>
                  </ActionForm>
                )}
                {board.manage && (
                  <ActionForm action={removeTask}>
                    <input type="hidden" name="teamId" value={board.team.id} />
                    <input type="hidden" name="taskId" value={task.id} />
                    <input type="hidden" name="version" value={task.version} />
                    <Button type="submit" variant="ghost" className="text-xs">Remove</Button>
                  </ActionForm>
                )}
              </div>
            </li>
          ))}
          {!board.tasks.length && <p className="py-3 text-sm text-[var(--color-ink-muted)]">Nothing set yet.</p>}
        </ul>
        {board.manage && (
          <ActionForm action={saveTask} className="mt-4 flex flex-wrap items-end gap-2 border-t border-[var(--color-border)] pt-4">
            <input type="hidden" name="teamId" value={board.team.id} />
            <label className="text-xs">
              <span className="mb-1 block font-medium">What needs doing</span>
              <input name="title" required maxLength={140} className="w-56 rounded-2xl border border-[var(--color-border)] px-3 py-2" />
            </label>
            <label className="text-xs">
              <span className="mb-1 block font-medium">Who</span>
              <select name="assigneeEmployeeId" className="rounded-2xl border border-[var(--color-border)] px-3 py-2">
                <option value="">Anyone</option>
                {board.people.map((person) => <option key={person.employeeId} value={person.employeeId}>{person.name}</option>)}
              </select>
            </label>
            <label className="text-xs">
              <span className="mb-1 block font-medium">Due</span>
              <input type="date" name="dueOn" className="rounded-2xl border border-[var(--color-border)] px-3 py-2" />
            </label>
            <Button type="submit" variant="primary">Add task</Button>
          </ActionForm>
        )}
      </section>

      <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5">
        <h2 className="text-lg font-semibold">Who&rsquo;s covering</h2>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Set this when someone is away or stepping out, so the team knows who to ask.</p>
        {board.manage && (
          <ActionForm action={saveCover} className="mt-4 flex flex-wrap items-end gap-2">
            <input type="hidden" name="teamId" value={board.team.id} />
            <label className="text-xs">
              <span className="mb-1 block font-medium">Who&rsquo;s away</span>
              <select name="employeeId" required className="rounded-2xl border border-[var(--color-border)] px-3 py-2">
                {board.people.map((person) => <option key={person.employeeId} value={person.employeeId}>{person.name}</option>)}
              </select>
            </label>
            <label className="text-xs">
              <span className="mb-1 block font-medium">Covered by</span>
              <select name="coverEmployeeId" required className="rounded-2xl border border-[var(--color-border)] px-3 py-2">
                {board.people.map((person) => <option key={person.employeeId} value={person.employeeId}>{person.name}</option>)}
              </select>
            </label>
            <label className="text-xs">
              <span className="mb-1 block font-medium">From</span>
              <input type="date" name="startsOn" required defaultValue={board.day} className="rounded-2xl border border-[var(--color-border)] px-3 py-2" />
            </label>
            <label className="text-xs">
              <span className="mb-1 block font-medium">To</span>
              <input type="date" name="endsOn" className="rounded-2xl border border-[var(--color-border)] px-3 py-2" />
            </label>
            <Button type="submit" variant="secondary">Set cover</Button>
          </ActionForm>
        )}
      </section>

      <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5">
        <h2 className="text-lg font-semibold">Handovers</h2>
        <ActionForm action={saveHandover} className="mt-4 flex flex-wrap items-end gap-2">
          <input type="hidden" name="teamId" value={board.team.id} />
          <label className="text-xs">
            <span className="mb-1 block font-medium">Who</span>
            <select name="employeeId" required defaultValue={board.selfId ?? ""} className="rounded-2xl border border-[var(--color-border)] px-3 py-2">
              {board.people.map((person) => (
                <option key={person.employeeId} value={person.employeeId} disabled={!board.manage && person.employeeId !== board.selfId}>{person.name}</option>
              ))}
            </select>
          </label>
          <label className="min-w-64 flex-1 text-xs">
            <span className="mb-1 block font-medium">What the team should know</span>
            <input name="note" required maxLength={500} className="w-full rounded-2xl border border-[var(--color-border)] px-3 py-2" />
          </label>
          <label className="text-xs">
            <span className="mb-1 block font-medium">From</span>
            <input type="date" name="startsOn" required defaultValue={board.day} className="rounded-2xl border border-[var(--color-border)] px-3 py-2" />
          </label>
          <label className="text-xs">
            <span className="mb-1 block font-medium">To</span>
            <input type="date" name="endsOn" className="rounded-2xl border border-[var(--color-border)] px-3 py-2" />
          </label>
          <Button type="submit" variant="secondary">Leave handover</Button>
        </ActionForm>
      </section>

      <section className="rounded-3xl border border-[var(--color-border)] bg-white p-5">
        <h2 className="text-lg font-semibold">Moments this day</h2>
        <ul className="mt-3 space-y-2">
          {board.moments.map((moment) => (
            <li key={moment.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--color-surface-sunken)] px-3 py-2 text-sm">
              <span>{MOMENT_LABELS[moment.kind as keyof typeof MOMENT_LABELS]} · {moment.title}{moment.note ? ` — ${moment.note}` : ""}</span>
              {board.manage && (
                <ActionForm action={removeMoment}>
                  <input type="hidden" name="teamId" value={board.team.id} />
                  <input type="hidden" name="momentId" value={moment.id} />
                  <Button type="submit" variant="ghost" className="text-xs">Remove</Button>
                </ActionForm>
              )}
            </li>
          ))}
          {!board.moments.length && <p className="text-sm text-[var(--color-ink-muted)]">Nothing marked for this day.</p>}
        </ul>
        {board.manage && (
          <ActionForm action={saveMoment} className="mt-4 flex flex-wrap items-end gap-2 border-t border-[var(--color-border)] pt-4">
            <input type="hidden" name="teamId" value={board.team.id} />
            <input type="hidden" name="onDate" value={board.day} />
            <label className="text-xs">
              <span className="mb-1 block font-medium">Kind</span>
              <select name="kind" required className="rounded-2xl border border-[var(--color-border)] px-3 py-2">
                {Object.entries(MOMENT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="text-xs">
              <span className="mb-1 block font-medium">Name</span>
              <input name="title" required maxLength={120} className="rounded-2xl border border-[var(--color-border)] px-3 py-2" />
            </label>
            <label className="text-xs">
              <span className="mb-1 block font-medium">Note</span>
              <input name="note" maxLength={240} className="rounded-2xl border border-[var(--color-border)] px-3 py-2" />
            </label>
            <Button type="submit" variant="secondary">Add to {board.dayLabel}</Button>
          </ActionForm>
        )}
      </section>
    </div>
  );
}
