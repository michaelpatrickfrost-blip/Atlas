import { db } from "@/core/db/client";

let started = false;

/** Single in-process 60s heartbeat: delivers due email, resumes paused automations, fires due schedules,
 *  publishes due social posts. A DB lease keeps this to one worker even with several server processes. */
export function startTick() {
  if (started) return;
  started = true;
  const run = async () => {
    try { await runTick(); } catch (error) { console.error("[tick] failed", error); }
    setTimeout(run, 60_000);
  };
  setTimeout(run, 5_000);
}

async function haveLease(): Promise<boolean> {
  const id = "scheduler-tick";
  const now = new Date();
  try {
    const existing = await db.$queryRawUnsafe<Array<{ updatedAt: Date }>>(`SELECT "updatedAt" FROM marketing_settings WHERE id = $1`, id);
    if (!existing.length) {
      await db.$executeRawUnsafe(`INSERT INTO marketing_settings (id, "organisationId", settings, "updatedAt") VALUES ($1, 'platform', '{}', $2) ON CONFLICT (id) DO NOTHING`, id, now);
      return true;
    }
    if (now.getTime() - new Date(existing[0].updatedAt).getTime() < 50_000) return false;
    await db.$executeRawUnsafe(`UPDATE marketing_settings SET "updatedAt" = $2 WHERE id = $1`, id, now);
    return true;
  } catch {
    return true;
  }
}

export async function runTick() {
  if (!(await haveLease())) return;
  const { deliverDueEmails } = await import("@/core/email/send");
  const { processDueAutomations } = await import("@/modules/automations/engine/run");
  const { publishDueSocialPosts } = await import("@/modules/marketing/services/social-scheduler");
  const { syncDueInboxes } = await import("@/core/email/inbox");
  await Promise.allSettled([deliverDueEmails(25), processDueAutomations(25), publishDueSocialPosts(10), syncDueInboxes(3)]);
}
