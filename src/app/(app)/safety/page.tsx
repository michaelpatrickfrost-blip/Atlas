import Link from "next/link";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { SAFETY_CAPABILITIES as C } from "@/core/permissions/capabilities";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { todayBoard } from "@/modules/safety/services/queries";
import { saveSafetyProfile } from "@/modules/safety/services/commands";
import { PROFILE_FEATURES } from "@/modules/safety/domain/work";
import { Eyebrow, Field, Panel, Quiet, Row, inputClass } from "./ui";

export default async function SafetyToday() {
  const session = await requireSession();
  assertCapability(session, C.todayRead);
  const board = await todayBoard(session);
  const date = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const office = !board.profile || board.profile.operatingProfile === "OFFICE";
  if (!board.profile && can(session, C.profileManage)) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <header>
          <p className="text-sm text-[var(--color-ink-muted)]">{date}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">What kind of workplace is this?</h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-muted)]">Atlas starts with the work you actually do. A small office stays simple. A factory can turn on permits, chemicals and equipment controls when they apply. This does not make the company compliant. That remains with the employer and the competent people.</p>
        </header>
        <ActionForm action={saveSafetyProfile} className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-white p-6">
          <Field label="Workplace">
            <select name="profile" className={inputClass} defaultValue="OFFICE">
              {Object.entries(PROFILE_FEATURES).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
            </select>
          </Field>
          <Field label="Jurisdiction for templates"><input name="jurisdiction" defaultValue="GB" className={inputClass} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="anonymousReports" /> Allow anonymous hazard reports</label>
          <Button type="submit" variant="primary">Set up Safety</Button>
        </ActionForm>
      </div>
    );
  }
  const attention = [
    ...board.records.filter(record => record.dueAt && record.dueAt < new Date(new Date().toISOString().slice(0, 10))).map(record => ({ href: `/safety/records/${record.id}`, title: record.title, meta: "Review overdue", tone: "attention" as const, detail: record.reference })),
    ...board.holds.map((hold) => ({ href: `/safety/control/holds/${hold.id}`, title: hold.targetLabel, meta: "Do not use", tone: "stop" as const, detail: hold.reason })),
    ...board.overdueActions.map((action) => ({ href: "/safety/assurance", title: action.title, meta: action.priority, tone: "stop" as const, detail: action.reference })),
    ...board.checks.map((check) => ({ href: `/safety/equipment/${check.id}`, title: check.assetLabel, meta: check.kind, tone: "attention" as const, detail: check.nextDueAt ? `Due ${check.nextDueAt.toLocaleDateString("en-GB", { weekday: "long" })}` : "Due" })),
    ...board.reviews.map((review) => ({ href: `/safety/risk/${review.riskId}`, title: review.risk.title, meta: "Review", tone: "attention" as const, detail: review.reason.replaceAll("_", " ").toLowerCase() })),
  ];
  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--color-ink-muted)]">{board.profile ? `${board.profile.operatingProfile === "OFFICE" ? "Office" : board.profile.operatingProfile === "WAREHOUSE" ? "Warehouse" : board.profile.operatingProfile === "FIELD" ? "Field" : "Plant"} · ${date}` : date}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">{office && attention.length === 0 ? "Everything looks in order." : "What needs attention?"}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/safety/report" className="rounded-full bg-[var(--color-atlas-blue)] px-4 py-2 text-sm font-medium text-white">Report something</Link>
          {can(session, C.riskCreate) && <Link href="/safety/risk" className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm">New risk</Link>}
        </div>
      </header>
      {!office && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["High-risk actions overdue", board.counts.highActions, "/safety/assurance"],
            ["Incidents under investigation", board.counts.investigations, "/safety/incidents"],
            ["Inspections due", board.counts.inspectionsDue, "/safety/assurance"],
            ["Checks due this week", board.counts.checksThisWeek, "/safety/assurance"],
          ].map(([label, value, href]) => (
            <Link key={String(label)} href={String(href)} className="rounded-3xl border border-[var(--color-border)] bg-white px-5 py-6 transition hover:border-[var(--color-atlas-blue)]">
              <p className="text-4xl font-semibold tabular-nums">{value}</p>
              <p className="mt-2 text-sm text-[var(--color-ink-muted)]">{label}</p>
            </Link>
          ))}
        </div>
      )}
      <section>
        <Eyebrow>Immediate attention</Eyebrow>
        <Panel>
          {attention.length === 0 && <Quiet>{office ? "Nothing is overdue." : "Nothing is held, overdue or waiting for review."}</Quiet>}
          {attention.map((item) => (
            <Link key={item.href + item.title} href={item.href} className="block px-5 py-4 hover:bg-[var(--color-surface-sunken)]">
              <span className="flex items-center justify-between gap-4 text-sm"><span className="font-medium">{item.title}</span><span className={item.tone === "stop" ? "text-rose-700" : "text-amber-700"}>{item.meta}</span></span>
              <span className="mt-1 block text-sm text-[var(--color-ink-muted)]">{item.detail}</span>
            </Link>
          ))}
        </Panel>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <Eyebrow>{office ? "Due soon" : "Work happening now"}</Eyebrow>
          <Panel>
            {office ? board.records.filter((record) => ["FIRE_DRILL", "FIRST_AID_KIT", "DSE_ASSESSMENT"].includes(record.kind)).slice(0, 6).map((record) => (
              <Row key={record.id} href={`/safety/records/${record.id}`} title={record.title} meta={record.dueAt ? record.dueAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : record.kind.replaceAll("_", " ").toLowerCase()} tone="attention" />
            )) : (
              <>
                <Row href="/safety/control" title="Permits active" meta={String(board.counts.permitsLive)} tone="active" />
                <Row href="/safety/control" title="Isolations active" meta={String(board.counts.isolations)} tone="active" />
              </>
            )}
            {office && board.records.filter((record) => ["FIRE_DRILL", "FIRST_AID_KIT", "DSE_ASSESSMENT"].includes(record.kind)).length === 0 && <Quiet>Fire, first aid and DSE dates will appear here once they are recorded.</Quiet>}
          </Panel>
        </div>
        <div>
          <Eyebrow>People</Eyebrow>
          <Panel>
            {board.competences.length === 0 && <Quiet>No certificates are due this month.</Quiet>}
            {board.competences.map((item) => <Row key={item.id} href="/safety/assurance" title={`${item.person} · ${item.label}`} meta={item.expiresAt ? item.expiresAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "No expiry"} tone="attention" />)}
            {board.firstAidGap && <p className="px-5 py-4 text-sm text-amber-800">{board.firstAidGap} Friday afternoon is the next coverage check from the rota. Atlas only knows about people who are scheduled here.</p>}
          </Panel>
        </div>
      </section>
    </div>
  );
}
