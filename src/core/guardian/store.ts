import { createHash } from "node:crypto";
import { db } from "@/core/db/client";
import { repairBrief, type Finding } from "./report";

export function workerIsOnline(worker: { heartbeatAt: Date } | null) {
  return !!worker && Date.now() - worker.heartbeatAt.getTime() < 15 * 60_000;
}

export async function recordFinding(finding: Finding, revision = process.env.ATLAS_RELEASE_REVISION ?? "runtime", runId?: string) {
  const fingerprint = createHash("sha256").update(finding.key).digest("hex");
  const data = {
    title: finding.title, kind: finding.kind, severity: finding.severity, route: finding.route,
    source: finding.source ?? null, expected: finding.expected, actual: finding.actual,
    steps: finding.steps, evidence: finding.evidence, brief: repairBrief(finding, revision), revision,
    lastSeenAt: new Date(), ...(runId ? { runId } : {}),
  };
  // A recurrence reopens a fixed report; repeated observations do not undo triage/ignore decisions.
  const issue = await db.guardianIssue.upsert({ where: { fingerprint }, create: { fingerprint, ...data }, update: { ...data, occurrences: { increment: 1 } } });
  if (issue.status === "FIXED") await db.guardianIssue.updateMany({ where: { id: issue.id, status: "FIXED" }, data: { status: "OPEN", resolution: "Failure observed again after verification." } });
  return issue.id;
}

export async function queueSweep(userId: string) {
  // Database advisory lock serializes concurrent clicks across server processes.
  return db.$transaction(async tx => {
    await tx.$executeRawUnsafe("SELECT pg_advisory_xact_lock(73411021)");
    const existing = await tx.guardianRun.findFirst({ where: { status: { in: ["QUEUED", "RUNNING"] } }, orderBy: { createdAt: "desc" } });
    if (existing) return existing.id;
    return (await tx.guardianRun.create({ data: { requestedBy: userId } })).id;
  });
}
