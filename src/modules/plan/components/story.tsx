import Link from "next/link";
import type { Session } from "@/core/auth/session";
import { audienceLabel, canEditPlan } from "../domain/access";
import { briefFields, briefText, salesPicture } from "../domain/commercial";
import { metricByKey } from "../domain/catalogue";
import { timelineLayout, type TimelineItem } from "../domain/timeline";
import { addAction, addGoal, addInitiative, addNote, addUpdate, completeAction, createProjectForInitiative, saveGoalProgress, savePlanBrief, setPlanAudience, sharePlan, unsharePlan } from "../services/commands";
import { memberNames, planColleagues } from "../services/queries";
import { field, primary, quiet, showMeasure } from "./format";

function iso(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : null;
}

function when(value: Date | null | undefined) {
  return value ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(value) : "";
}

function stamp(value: Date) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(value);
}

export async function PlanStory({
  session,
  plan,
  revenuePlan,
  actuals,
}: {
  session: Session;
  plan: {
    id: string;
    planType: string;
    audience: string;
    ownerUserId: string;
    ownerName: string;
    currency: string;
    locked: boolean;
    periodStart: Date;
    periodEnd: Date;
    brief: unknown;
    shares: Array<{ id: string; userId: string; access: string }>;
    goals: Array<{ id: string; title: string; ownerName: string; targetText: string; metricKey: string | null; detail: string; progressNote: string; status: string; startsOn: Date | null; endsOn: Date | null }>;
    initiatives: Array<{ id: string; title: string; detail: string; ownerName: string; status: string; projectId: string | null; startsOn: Date | null; endsOn: Date | null }>;
    actions: Array<{ id: string; title: string; detail: string; ownerName: string; status: string; startsOn: Date | null; dueOn: Date | null; initiativeId: string | null }>;
    notes: Array<{ id: string; title: string; body: string; authorName: string; createdAt: Date }>;
    updates: Array<{ id: string; tone: string; summary: string; detail: string; authorName: string; createdAt: Date }>;
    comments: Array<{ id: string; body: string; authorName: string; createdAt: Date }>;
  };
  revenuePlan: number | null;
  actuals: Record<string, { value: number | null; note?: string } | undefined>;
}) {
  const owner = plan.ownerUserId === session.userId;
  const canEdit = session.capabilities.has("plan.edit") && !plan.locked && canEditPlan(plan, session.userId);
  const canShare = owner && session.capabilities.has("plan.edit");
  const names = await memberNames(session.organisationId, plan.shares.map((share) => share.userId));
  const colleagues = owner ? await planColleagues(session) : [];
  const items: TimelineItem[] = [
    ...plan.goals.map((goal) => ({ id: goal.id, title: goal.title, kind: "goal" as const, start: iso(goal.startsOn), end: iso(goal.endsOn), status: goal.status, detail: goal.detail })),
    ...plan.initiatives.map((item) => ({ id: item.id, title: item.title, kind: "initiative" as const, start: iso(item.startsOn), end: iso(item.endsOn), status: item.status, detail: item.detail })),
    ...plan.actions.map((item) => ({ id: item.id, title: item.title, kind: "action" as const, start: iso(item.startsOn), end: iso(item.dueOn), status: item.status, detail: item.detail })),
  ];
  const timeline = timelineLayout(plan.periodStart.toISOString(), plan.periodEnd.toISOString(), items);
  const fields = briefFields(plan.planType);
  const sales = plan.planType === "sales" ? salesPicture({ revenuePlan, revenueActual: actuals.revenue?.value ?? null, ordersActual: actuals.orders?.value ?? null, pipeline: actuals.pipeline?.value ?? null }) : null;
  return (
    <div className="space-y-10">
      <section id="share" className="rounded-3xl border border-slate-200 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold">Who can see this</h3>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{audienceLabel(plan.audience, plan.shares.length)}. {plan.audience === "company" ? "Anyone who can open Plan in this company can read it." : "Other people only see it when you share it with them."}</p>
          </div>
          <p className="text-sm text-[var(--color-ink-muted)]">Owner {plan.ownerName || "Unassigned"}</p>
        </div>
        {plan.shares.length ? (
          <ul className="mt-4 space-y-2 text-sm">
            {plan.shares.map((share) => (
              <li key={share.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[var(--color-app-bg)] px-4 py-3">
                <span>{names.get(share.userId) ?? "Someone in this company"} · {share.access === "edit" ? "Can edit" : "Can view"}</span>
                {canShare ? (
                  <form action={unsharePlan}><input type="hidden" name="planId" value={plan.id} /><input type="hidden" name="shareId" value={share.id} /><button className="text-[var(--color-atlas-blue)]">Remove</button></form>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
        {canShare ? (
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <form action={sharePlan} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="planId" value={plan.id} />
              <label className="text-sm">Share with<select name="userId" className={field} defaultValue=""><option value="">Choose a person</option>{colleagues.map((person) => <option key={person.userId} value={person.userId}>{person.name}</option>)}</select></label>
              <label className="text-sm">Access<select name="access" className={field} defaultValue="view"><option value="view">Can view</option><option value="edit">Can edit</option></select></label>
              <button className={primary}>Share</button>
            </form>
            <form action={setPlanAudience}>
              <input type="hidden" name="planId" value={plan.id} />
              <input type="hidden" name="audience" value={plan.audience === "company" ? "private" : "company"} />
              <button className={quiet}>{plan.audience === "company" ? "Make it private again" : "Share with everyone who can open Plan"}</button>
            </form>
          </div>
        ) : null}
        {owner ? <p className="mt-3 text-xs text-[var(--color-ink-muted)]">Share it with the person who approves it. They will not see a private plan.</p> : null}
      </section>

      <section id="timeline">
        <h3 className="text-xl font-semibold">Timeline</h3>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Goals, phases and actions across this plan. Today is the thin line.</p>
        {timeline.bars.length ? (
          <div className="mt-4 overflow-x-auto rounded-3xl border border-slate-200 p-5">
            <div className="mb-3 flex min-w-[640px] justify-between text-[11px] uppercase tracking-wide text-[var(--color-ink-faint)]">
              {timeline.months.map((month) => <span key={month}>{month.slice(5)}</span>)}
            </div>
            <div className="min-w-[640px] space-y-1">
              {timeline.bars.map((bar) => (
                <div key={bar.id} className="grid grid-cols-[minmax(160px,240px)_1fr] items-center gap-4 border-t border-slate-100 py-2">
                  <div>
                    <p className="text-sm font-medium">{bar.title}</p>
                    <p className="text-xs capitalize text-[var(--color-ink-muted)]">{bar.kind}{bar.overdue ? " · overdue" : ""}</p>
                  </div>
                  <div className="relative h-8 rounded-full bg-slate-50">
                    {timeline.marker != null ? <div className="absolute inset-y-0 w-px bg-slate-400" style={{ left: `${timeline.marker}%` }} /> : null}
                    <div className="absolute top-1.5 h-5 rounded-full" style={{ left: `${bar.left}%`, width: `${bar.width}%`, background: bar.overdue ? "#c2410c" : bar.kind === "goal" ? "#0f172a" : bar.kind === "initiative" ? "var(--color-atlas-blue)" : "#bfdbfe" }} title={bar.detail} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : <p className="mt-3 text-sm text-[var(--color-ink-muted)]">Add a start and finish on a goal, phase or action to draw the timeline.</p>}
      </section>

      {sales ? (
        <section id="sales-detail" className="rounded-3xl border border-slate-200 p-5">
          <h3 className="text-xl font-semibold">Sales detail</h3>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-ink-muted)]">{sales.note}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <Stat label="Still to reach" value={showMeasure(sales.remaining, "money", plan.currency)} />
            <Stat label="Pipeline coverage" value={sales.coverage == null ? "—" : `${sales.coverage.toLocaleString("en-GB", { maximumFractionDigits: 1 })}×`} />
            <Stat label="Average order" value={showMeasure(sales.average, "money", plan.currency)} />
            <Stat label="Quotations" value={showMeasure(actuals.quotes?.value ?? null, "count", plan.currency)} />
          </div>
          <p className="mt-3 text-sm text-[var(--color-ink-muted)]">Win rate {showMeasure(actuals.win_rate?.value ?? null, "percent", plan.currency)} · Activities {showMeasure(actuals.sales_activities?.value ?? null, "count", plan.currency)} · Quotation value {showMeasure(actuals.quote_value?.value ?? null, "money", plan.currency)}</p>
        </section>
      ) : null}

      {fields.length ? (
        <section>
          <h3 className="text-xl font-semibold">{plan.planType === "marketing" ? "Marketing brief" : "How the number is made"}</h3>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{plan.planType === "marketing" ? "The brief sits with the actions. The timeline is when each action runs." : "Write the territory, product, account and price detail the revenue figure does not hold on its own."}</p>
          <div className="mt-4 space-y-4">
            {fields.map(([key, label, hint]) => (
              <div key={key}>
                <p className="font-medium">{label}</p>
                {briefText(plan.brief, key) ? <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-ink-muted)]">{briefText(plan.brief, key)}</p> : <p className="mt-1 text-sm text-[var(--color-ink-faint)]">{hint}</p>}
              </div>
            ))}
          </div>
          {canEdit ? (
            <form action={savePlanBrief} className="mt-4 grid gap-3">
              <input type="hidden" name="planId" value={plan.id} />
              {fields.map(([key, label, hint]) => (
                <label key={key} className="text-sm">{label}<textarea name={key} defaultValue={briefText(plan.brief, key)} placeholder={hint} rows={3} className={field} /></label>
              ))}
              <button className={primary}>Save detail</button>
            </form>
          ) : null}
        </section>
      ) : null}

      <section id="goals">
        <h3 className="text-xl font-semibold">Goals</h3>
        <div className="mt-3 space-y-3">
          {plan.goals.map((goal) => (
            <article key={goal.id} className="rounded-2xl border border-slate-200 p-4 text-sm">
              <p className="font-medium">{goal.title}</p>
              <p className="mt-1 text-[var(--color-ink-muted)]">{goal.targetText}{goal.metricKey ? ` · ${metricByKey(goal.metricKey)?.name ?? goal.metricKey}` : ""} · {goal.ownerName}</p>
              {goal.detail ? <p className="mt-2 whitespace-pre-wrap">{goal.detail}</p> : null}
              <p className="mt-2 text-xs text-[var(--color-ink-faint)]">{when(goal.startsOn)}{goal.endsOn ? ` – ${when(goal.endsOn)}` : ""}</p>
              {goal.progressNote ? <p className="mt-2 rounded-xl bg-[var(--color-app-bg)] px-3 py-2">{goal.progressNote}</p> : null}
              {canEdit ? (
                <form action={saveGoalProgress} className="mt-3 flex gap-2">
                  <input type="hidden" name="planId" value={plan.id} />
                  <input type="hidden" name="goalId" value={goal.id} />
                  <input name="progress" defaultValue={goal.progressNote} placeholder="What changed" className={field} />
                  <button className={quiet}>Update</button>
                </form>
              ) : null}
            </article>
          ))}
          {!plan.goals.length ? <p className="text-sm text-[var(--color-ink-muted)]">No goals yet.</p> : null}
        </div>
        {canEdit ? (
          <form action={addGoal} className="mt-4 grid gap-2 sm:grid-cols-2">
            <input type="hidden" name="planId" value={plan.id} />
            <input name="title" placeholder="Goal" className={field} />
            <input name="target" placeholder="What done looks like" className={field} />
            <input name="owner" placeholder="Owner" className={field} />
            <input name="metric" placeholder="revenue" className={field} />
            <input type="date" name="start" className={field} />
            <input type="date" name="end" className={field} />
            <textarea name="detail" placeholder="The detail behind the goal" rows={3} className={`${field} sm:col-span-2`} />
            <button className={primary}>Add goal</button>
          </form>
        ) : null}
      </section>

      <section id="phases">
        <h3 className="text-xl font-semibold">Phases</h3>
        <div className="mt-3 space-y-3">
          {plan.initiatives.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 p-4 text-sm">
              <p className="font-medium">{item.title}</p>
              {item.detail ? <p className="mt-1 text-[var(--color-ink-muted)]">{item.detail}</p> : null}
              <p className="mt-2 text-xs text-[var(--color-ink-faint)]">{item.ownerName}{item.startsOn ? ` · ${when(item.startsOn)}` : ""}{item.endsOn ? ` – ${when(item.endsOn)}` : ""}</p>
              {item.projectId ? <Link href={`/projects/${item.projectId}`} className="mt-2 inline-block text-[var(--color-atlas-blue)]">Open the project</Link> : canEdit && session.capabilities.has("projects.manage") ? <form action={createProjectForInitiative} className="mt-2"><input type="hidden" name="planId" value={plan.id} /><input type="hidden" name="initiativeId" value={item.id} /><button className="text-[var(--color-atlas-blue)]">Open as a project</button></form> : null}
            </article>
          ))}
          {!plan.initiatives.length ? <p className="text-sm text-[var(--color-ink-muted)]">No phases yet. A sales or marketing plan starts with them.</p> : null}
        </div>
        {canEdit ? (
          <form action={addInitiative} className="mt-4 grid gap-2 sm:grid-cols-2">
            <input type="hidden" name="planId" value={plan.id} />
            <input name="title" placeholder="Phase" className={field} />
            <input name="owner" placeholder="Owner" className={field} />
            <input type="date" name="start" className={field} />
            <input type="date" name="end" className={field} />
            <textarea name="detail" placeholder="What this phase is for" rows={2} className={`${field} sm:col-span-2`} />
            <button className={primary}>Add phase</button>
          </form>
        ) : null}
      </section>

      <section id="actions">
        <h3 className="text-xl font-semibold">Actions</h3>
        <div className="mt-3 space-y-3">
          {plan.actions.map((action) => (
            <article key={action.id} className="rounded-2xl border border-slate-200 p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="font-medium">{action.title}</p>
                <span className="capitalize text-[var(--color-ink-muted)]">{action.status}</span>
              </div>
              {action.detail ? <p className="mt-1 whitespace-pre-wrap text-[var(--color-ink-muted)]">{action.detail}</p> : null}
              <p className="mt-2 text-xs text-[var(--color-ink-faint)]">{action.ownerName}{action.startsOn ? ` · ${when(action.startsOn)}` : ""}{action.dueOn ? ` – ${when(action.dueOn)}` : ""}</p>
              {action.status === "open" && canEdit ? (
                <form action={completeAction} className="mt-2"><input type="hidden" name="planId" value={plan.id} /><input type="hidden" name="actionId" value={action.id} /><button className="text-[var(--color-atlas-blue)]">Mark done</button></form>
              ) : null}
            </article>
          ))}
          {!plan.actions.length ? <p className="text-sm text-[var(--color-ink-muted)]">No actions yet.</p> : null}
        </div>
        {canEdit ? (
          <form action={addAction} className="mt-4 grid gap-2 sm:grid-cols-2">
            <input type="hidden" name="planId" value={plan.id} />
            <input name="title" placeholder="Action" className={field} />
            <input name="owner" placeholder="Owner" className={field} />
            <input type="date" name="start" className={field} />
            <input type="date" name="due" className={field} />
            <textarea name="detail" placeholder="What needs to happen" rows={3} className={`${field} sm:col-span-2`} />
            <button className={primary}>Add action</button>
          </form>
        ) : null}
      </section>

      <section id="notes">
        <h3 className="text-xl font-semibold">Notes</h3>
        <div className="mt-3 space-y-3">
          {plan.notes.map((note) => (
            <article key={note.id} className="rounded-2xl border border-slate-200 p-4 text-sm">
              <p className="font-medium">{note.title}</p>
              <p className="mt-2 whitespace-pre-wrap">{note.body}</p>
              <p className="mt-2 text-xs text-[var(--color-ink-faint)]">{note.authorName} · {stamp(note.createdAt)}</p>
            </article>
          ))}
          {plan.comments.map((note) => (
            <article key={note.id} className="rounded-2xl border border-slate-100 p-4 text-sm text-[var(--color-ink-muted)]">
              <p className="whitespace-pre-wrap">{note.body}</p>
              <p className="mt-2 text-xs">{note.authorName} · {stamp(note.createdAt)}</p>
            </article>
          ))}
          {!plan.notes.length && !plan.comments.length ? <p className="text-sm text-[var(--color-ink-muted)]">No notes yet. Use this for the account list, the offer, or anything the figures do not say.</p> : null}
        </div>
        {canEdit ? (
          <form action={addNote} className="mt-4 grid gap-2">
            <input type="hidden" name="planId" value={plan.id} />
            <input name="title" placeholder="Note title" className={field} />
            <textarea name="body" placeholder="The detail" rows={5} className={field} />
            <button className={primary}>Add note</button>
          </form>
        ) : null}
      </section>

      <section id="updates">
        <h3 className="text-xl font-semibold">Updates</h3>
        <div className="mt-3 space-y-3">
          {plan.updates.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 p-4 text-sm">
              <p className="font-medium capitalize">{item.tone.replaceAll("_", " ")}</p>
              <p className="mt-1">{item.summary}</p>
              {item.detail ? <p className="mt-2 whitespace-pre-wrap text-[var(--color-ink-muted)]">{item.detail}</p> : null}
              <p className="mt-2 text-xs text-[var(--color-ink-faint)]">{item.authorName} · {stamp(item.createdAt)}</p>
            </article>
          ))}
          {!plan.updates.length ? <p className="text-sm text-[var(--color-ink-muted)]">No updates yet.</p> : null}
        </div>
        {canEdit ? (
          <form action={addUpdate} className="mt-4 grid gap-2">
            <input type="hidden" name="planId" value={plan.id} />
            <select name="tone" className={field}><option value="on_track">On track</option><option value="watch">Watch</option><option value="at_risk">At risk</option></select>
            <input name="summary" placeholder="What changed, in one line" className={field} />
            <textarea name="detail" placeholder="The fuller update" rows={4} className={field} />
            <button className={primary}>Publish update</button>
          </form>
        ) : null}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-[var(--color-app-bg)] p-4"><p className="text-xs text-[var(--color-ink-muted)]">{label}</p><p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p></div>;
}
