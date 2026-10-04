import { db } from "@/core/db/client";
import { sessionForUser } from "@/core/auth/session";
import { loadContext } from "./context";
import { evaluateConditions } from "./conditions";
import { runStep } from "./steps";
import type { Condition, Step } from "./catalogue";

const MAX_STEPS_PER_RUN = 25;

/** Runs every enabled automation whose trigger matches this event. One idempotent run per (automation, event). */
export async function dispatchEvent(eventId: string): Promise<void> {
  const event = await db.automationEvent.findUnique({ where: { id: eventId } });
  if (!event) return;
  const rules = await db.automation.findMany({ where: { organisationId: event.organisationId, enabled: true, triggerType: "EVENT", triggerEvent: event.name } });
  for (const rule of rules) await startRun(rule.id, event.id, false);
  await db.automationEvent.update({ where: { id: event.id }, data: { processedAt: new Date() } });
}

async function startRun(automationId: string, eventId: string | null, dryRun: boolean, resumeRunId?: string) {
  const automation = await db.automation.findUnique({ where: { id: automationId } });
  if (!automation) return null;
  const idempotencyKey = resumeRunId ? resumeRunId : eventId ? `${automationId}:${eventId}` : `${automationId}:manual:${Date.now()}`;
  let run = resumeRunId
    ? await db.automationRun.findUnique({ where: { id: resumeRunId } })
    : await db.automationRun.findUnique({ where: { organisationId_idempotencyKey: { organisationId: automation.organisationId, idempotencyKey } } });
  if (!run) {
    if (!automation.enabled && !dryRun) return null;
    const event = eventId ? await db.automationEvent.findUnique({ where: { id: eventId } }) : null;
    run = await db.automationRun.create({ data: { organisationId: automation.organisationId, automationId, eventId, idempotencyKey, dryRun, status: "RUNNING", context: (event?.payload as never) ?? {} } });
  }
  if (run.status === "SUCCEEDED" || run.status === "FAILED") return run;
  await continueRun(run.id);
  return db.automationRun.findUnique({ where: { id: run.id } });
}

/** Runs from where it left off (cursor). A "wait" step sets resumeAt and stops; the scheduler tick calls this again later. */
export async function continueRun(runId: string): Promise<void> {
  const run = await db.automationRun.findUnique({ where: { id: runId } });
  if (!run || run.status !== "RUNNING") return;
  const automation = await db.automation.findUnique({ where: { id: run.automationId } });
  if (!automation) return;
  const owner = await sessionForUser(automation.organisationId, automation.ownerUserId);
  if (!owner) {
    await db.automationRun.update({ where: { id: run.id }, data: { status: "FAILED", error: "The person who built this automation no longer has access.", finishedAt: new Date() } });
    return;
  }
  const payload = (run.context ?? {}) as Record<string, unknown>;
  const event = run.eventId ? await db.automationEvent.findUnique({ where: { id: run.eventId } }) : null;
  const ctx = await loadContext(automation.organisationId, automation.triggerEvent ?? "manual", event?.payload as Record<string, unknown> ?? payload);
  const conditions = (automation.conditions as unknown as Condition[]) ?? [];
  const steps = (automation.steps as unknown as Step[]) ?? [];
  const results = (run.results as unknown as Array<Record<string, unknown>>) ?? [];

  if (run.cursor === 0 && !evaluateConditions(conditions, ctx)) {
    await db.automationRun.update({ where: { id: run.id }, data: { status: "SUCCEEDED", results: [{ step: "conditions", type: "check", status: "STOP", detail: "Conditions not met." }] as never, finishedAt: new Date() } });
    return;
  }

  let cursor = run.cursor;
  let executed = 0;
  while (cursor < steps.length && executed < MAX_STEPS_PER_RUN) {
    const step = steps[cursor];
    if (step.type === "wait" && !run.dryRun) {
      const amount = Number(step.params.amount || 1), unit = step.params.unit || "days";
      const ms = unit === "minutes" ? amount * 60000 : unit === "hours" ? amount * 3600000 : amount * 86400000;
      let resumeAt = new Date(Date.now() + ms);
      if (step.params.untilHour) { resumeAt.setHours(Number(step.params.untilHour), 0, 0, 0); if (resumeAt.getTime() < Date.now()) resumeAt = new Date(resumeAt.getTime() + 86400000); }
      results.push({ step: step.id, type: "wait", status: "OK", detail: `Waiting until ${resumeAt.toLocaleString("en-GB")}.` });
      await db.automationRun.update({ where: { id: run.id }, data: { cursor: cursor + 1, resumeAt, results: results as never } });
      return;
    }
    const result = await runStep(automation.organisationId, owner, step, ctx, run.dryRun);
    results.push(result as unknown as Record<string, unknown>);
    executed += 1;
    cursor += 1;
    if (result.status === "FAILED" && !run.dryRun) {
      await db.automationRun.update({ where: { id: run.id }, data: { cursor, status: "FAILED", error: result.detail, results: results as never, finishedAt: new Date(), attempts: { increment: 1 } } });
      await db.automation.update({ where: { id: automation.id }, data: { failCount: { increment: 1 }, lastRunAt: new Date() } });
      return;
    }
    if (result.status === "STOP") break;
  }
  const done = cursor >= steps.length || results.some((r) => r.status === "STOP");
  await db.automationRun.update({ where: { id: run.id }, data: { cursor, results: results as never, status: done ? "SUCCEEDED" : "RUNNING", resumeAt: done ? null : new Date(), finishedAt: done ? new Date() : null } });
  if (done && !run.dryRun) await db.automation.update({ where: { id: automation.id }, data: { runCount: { increment: 1 }, lastRunAt: new Date() } });
}

/** Manual "Run now" or "Test on a past event" from the builder. */
export async function runManually(automationId: string, eventId: string | null, dryRun: boolean) {
  return startRun(automationId, eventId, dryRun);
}

/** Scheduler tick: resumes paused runs whose wait has elapsed, and fires due SCHEDULE automations. */
export async function processDueAutomations(limit = 20): Promise<number> {
  let processed = 0;
  const paused = await db.automationRun.findMany({ where: { status: "RUNNING", resumeAt: { lte: new Date() } }, take: limit, select: { id: true } });
  for (const row of paused) { await continueRun(row.id); processed += 1; }
  const due = await db.automation.findMany({ where: { enabled: true, triggerType: "SCHEDULE" }, take: limit });
  for (const automation of due) {
    const schedule = automation.schedule as { intervalHours?: number; nextRunAt?: string } | null;
    const nextRunAt = schedule?.nextRunAt ? new Date(schedule.nextRunAt) : automation.lastRunAt;
    if (nextRunAt && nextRunAt.getTime() > Date.now()) continue;
    const intervalHours = Math.max(1, schedule?.intervalHours ?? 24);
    await startRun(automation.id, null, false);
    await db.automation.update({ where: { id: automation.id }, data: { schedule: { ...schedule, nextRunAt: new Date(Date.now() + intervalHours * 3600000).toISOString() } as never } });
    processed += 1;
  }
  return processed;
}
