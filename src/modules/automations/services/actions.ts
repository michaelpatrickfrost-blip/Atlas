"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/core/db/client";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { AUTOMATION_CAPABILITIES } from "@/core/permissions/capabilities";
import { writeAudit } from "@/core/audit/log";
import { TRIGGERS, SCHEDULE_TRIGGER } from "../engine/catalogue";
import { runManually } from "../engine/run";

const text = (f: FormData, k: string, max = 2000, required = false) => { const v = String(f.get(k) ?? "").trim(); if (v.length > max || (required && !v)) throw new Error(`Please enter ${k}.`); return v; };
const refresh = () => revalidatePath("/automations", "layout");

export async function saveAutomation(f: FormData) {
  const session = await requireSession();
  assertCapability(session, AUTOMATION_CAPABILITIES.manage);
  const id = text(f, "id", 60);
  const triggerType = ["EVENT", "SCHEDULE", "MANUAL"].includes(text(f, "triggerType", 20)) ? text(f, "triggerType", 20) : "EVENT";
  const triggerEvent = triggerType === "EVENT" ? text(f, "triggerEvent", 100, true) : triggerType === "SCHEDULE" ? SCHEDULE_TRIGGER.event : null;
  if (triggerType === "EVENT" && !TRIGGERS.some((t) => t.event === triggerEvent)) throw new Error("Choose a valid trigger.");
  let conditions: unknown, steps: unknown, schedule: unknown = {};
  try { conditions = JSON.parse(text(f, "conditions", 20000) || "[]"); } catch { throw new Error("Conditions are invalid."); }
  try { steps = JSON.parse(text(f, "steps", 50000, true)); } catch { throw new Error("Steps are invalid."); }
  if (!Array.isArray(steps) || !steps.length) throw new Error("Add at least one step.");
  if (triggerType === "SCHEDULE") schedule = { intervalHours: Math.max(1, Number(text(f, "intervalHours", 6)) || 24) };
  const data = { name: text(f, "name", 150, true), description: text(f, "description", 2000), triggerType, triggerEvent, schedule: schedule as never, conditions: conditions as never, steps: steps as never };
  let automationId = id;
  if (id) {
    const done = await db.automation.updateMany({ where: { id, organisationId: session.organisationId }, data: { ...data, version: { increment: 1 } } });
    if (!done.count) throw new Error("That automation no longer exists.");
  } else {
    const created = await db.automation.create({ data: { ...data, organisationId: session.organisationId, ownerUserId: session.userId, enabled: false } });
    automationId = created.id;
  }
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: id ? "automation.updated" : "automation.created", entityType: "Automation", entityId: automationId });
  refresh();
  if (!id) redirect(`/automations/${automationId}`);
}

export async function setAutomationEnabled(f: FormData) {
  const session = await requireSession();
  assertCapability(session, AUTOMATION_CAPABILITIES.manage);
  const id = text(f, "id", 60, true);
  const enabled = text(f, "enabled", 5) === "true";
  const automation = await db.automation.findFirst({ where: { id, organisationId: session.organisationId } });
  if (!automation) throw new Error("That automation no longer exists.");
  if (enabled && !(Array.isArray(automation.steps) && (automation.steps as unknown[]).length)) throw new Error("Add at least one step before turning this on.");
  await db.automation.update({ where: { id }, data: { enabled } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: enabled ? "automation.enabled" : "automation.disabled", entityType: "Automation", entityId: id });
  refresh();
}

export async function deleteAutomation(f: FormData) {
  const session = await requireSession();
  assertCapability(session, AUTOMATION_CAPABILITIES.manage);
  await db.automation.deleteMany({ where: { id: text(f, "id", 60, true), organisationId: session.organisationId } });
  refresh();
  redirect("/automations");
}

export async function testOnPastEvent(f: FormData) {
  const session = await requireSession();
  assertCapability(session, AUTOMATION_CAPABILITIES.run);
  const automationId = text(f, "id", 60, true);
  const automation = await db.automation.findFirst({ where: { id: automationId, organisationId: session.organisationId } });
  if (!automation) throw new Error("That automation no longer exists.");
  const eventId = text(f, "eventId", 60) || undefined;
  const run = await runManually(automationId, eventId ?? null, true);
  refresh();
  return run ? { runId: run.id } : { runId: null };
}

export async function runNow(f: FormData) {
  const session = await requireSession();
  assertCapability(session, AUTOMATION_CAPABILITIES.run);
  const automationId = text(f, "id", 60, true);
  const automation = await db.automation.findFirst({ where: { id: automationId, organisationId: session.organisationId } });
  if (!automation) throw new Error("That automation no longer exists.");
  if (automation.triggerType === "EVENT") throw new Error('This automation starts from an event; use "Test on a past event" instead.');
  await runManually(automationId, null, false);
  refresh();
}
