/** Operator-only CLI. Run on the server with its environment; never expose DB credentials to the client. */
import fs from "node:fs";
import { db } from "../../src/core/db/client";
import { recordFinding } from "../../src/core/guardian/store";
import { z } from "zod";

const [command = "list", id, revision, ...notes] = process.argv.slice(2);
async function main() {
  if (command === "list") {
    const [reports, worker, runs] = await Promise.all([
      db.guardianIssue.findMany({ where: { status: { notIn: ["FIXED", "IGNORED"] } }, orderBy: { lastSeenAt: "desc" }, take: 25, select: { id: true, title: true, status: true, severity: true, kind: true, lastSeenAt: true, resolution: true } }),
      db.guardianWorker.findUnique({ where: { id: "guardian" } }),
      db.guardianRun.findMany({ orderBy: { createdAt: "desc" }, take: 2, select: { id: true, status: true, revision: true, summary: true, createdAt: true } }),
    ]);
    console.log(JSON.stringify({ reports, worker, runs }, null, 2));
  } else if (command === "show") {
    console.log(JSON.stringify(await db.guardianIssue.findUniqueOrThrow({ where: { id: z.string().min(1).parse(id) } }), null, 2));
  } else if (command === "record") {
    const input = z.object({ key: z.string().max(240), title: z.string().max(240), kind: z.string().max(80), severity: z.enum(["CRITICAL", "HIGH", "MEDIUM"]), route: z.string().max(240), source: z.string().max(240).optional(), expected: z.string().max(2000), actual: z.string().max(2000), steps: z.array(z.string().max(2000)).max(20), evidence: z.array(z.string().max(2000)).max(20) }).parse(JSON.parse(fs.readFileSync(z.string().min(1).parse(id), "utf8")));
    console.log(await recordFinding(input, revision ?? "operator"));
  } else if (command === "needs-ai" || command === "fixed") {
    z.string().min(1).max(100).parse(id);
    const note = z.string().trim().min(10).max(4000).parse(notes.join(" "));
    const verified = z.string().trim().min(1).max(80).parse(revision);
    await db.guardianIssue.update({ where: { id }, data: { status: command === "fixed" ? "FIXED" : "NEEDS_AI", resolution: note, ...(command === "fixed" ? { verifiedRevision: verified } : {}), reviewedBy: "guardian-operator" } });
    console.log("Report updated.");
  } else throw new Error("Use list, record <file> <revision>, needs-ai <id> <revision> <blocker>, or fixed <id> <deployed-revision> <verification>.");
}
main().catch(() => { console.error("Guardian triage failed; check arguments and server configuration securely."); process.exitCode = 1; }).finally(() => db.$disconnect());
