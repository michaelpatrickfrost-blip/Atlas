import { Client } from "pg";
import fs from "node:fs";
import jwt from "jsonwebtoken";
import { execFileSync } from "node:child_process";
import { db } from "../../src/core/db/client";
import { sessionForUser } from "../../src/core/auth/session";
import { getNavigableModules, getModuleNavigation } from "../../src/core/modules/runtime";
import { recordFinding } from "../../src/core/guardian/store";
import { safePath, type Finding } from "../../src/core/guardian/report";
import { auditSources, routeMatches } from "./source-audit";
import { responseOutcome } from "./response-check";
import { deploymentGuard } from "./deployment-guard";

async function main() {
  if (process.env.ATLAS_RUNTIME === "desktop") throw new Error("Guardian runs only against the central hosted service.");
  const revision = execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
  const lease = new Client({ connectionString: process.env.DATABASE_URL });
  await lease.connect();
  let runId: string | undefined;
  try {
    const acquired = await lease.query("SELECT pg_try_advisory_lock(73411022) AS acquired");
    if (!acquired.rows[0].acquired) return;
    await db.guardianWorker.upsert({ where: { id: "guardian" }, create: { id: "guardian", revision }, update: { heartbeatAt: new Date(), revision } });
    if (fs.existsSync(".next/lock")) { console.log("Guardian is waiting for the active deployment/build to finish."); return; }
    const assertStable = deploymentGuard(process.cwd(), revision);
    assertStable();
    await db.guardianRateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    await db.guardianRun.updateMany({ where: { status: "RUNNING", startedAt: { lt: new Date(Date.now() - 45 * 60_000) } }, data: { status: "FAILED", finishedAt: new Date(), summary: "Worker stopped before completing. Retry the sweep." } });
    let run = await db.guardianRun.findFirst({ where: { status: "QUEUED" }, orderBy: { createdAt: "asc" } });
    const latest = await db.guardianRun.findFirst({ where: { startedAt: { not: null }, status: { in: ["COMPLETED", "ISSUES_FOUND", "PARTIAL"] } }, orderBy: { startedAt: "desc" } });
    if (!run && latest?.startedAt && Date.now() - latest.startedAt.getTime() < 6 * 60 * 60_000 && !process.argv.includes("--now")) return;
    run ??= await db.guardianRun.create({ data: {} });
    runId = run.id;
    await db.guardianRun.update({ where: { id: run.id }, data: { status: "RUNNING", revision, startedAt: new Date() } });
    const audit = auditSources(process.cwd());
    const runtimeFindings: Finding[] = [];
    const observe = (finding: Finding) => { assertStable(); runtimeFindings.push(finding); };
    for (const finding of audit.findings) await recordFinding(finding, revision, run.id);
    const userId = process.env.ATLAS_GUARDIAN_USER_ID, organisationId = process.env.ATLAS_GUARDIAN_ORGANISATION_ID;
    if (!userId || !organisationId) throw new Error("Set the existing authorised QA profile in ATLAS_GUARDIAN_USER_ID and ATLAS_GUARDIAN_ORGANISATION_ID; no customer/profile is created or modified.");
    const session = await sessionForUser(organisationId, userId);
    if (!session) throw new Error("Configured QA profile is inactive or unavailable.");
    const membership = await db.membership.findUniqueOrThrow({ where: { organisationId_userId: { organisationId, userId } }, include: { user: true } });
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) throw new Error("A production session secret is required.");
    const token = jwt.sign({ userId, organisationId, authVersion: membership.user.authVersion, sessionVersion: membership.sessionVersion }, process.env.SESSION_SECRET, { algorithm: "HS256", expiresIn: "30m" });
    const base = new URL(process.env.ATLAS_GUARDIAN_URL ?? "http://127.0.0.1:3000");
    if (!['127.0.0.1', 'localhost'].includes(base.hostname) && base.protocol !== "https:") throw new Error("Use loopback or HTTPS for authenticated probes.");
    const modules = await getNavigableModules(session);
    const seeds = ["/home", "/apps", "/profile", ...modules.flatMap(module => [module.rootPath, ...getModuleNavigation(module, session).map(item => item.href)])];
    const queue = [...new Set(seeds)], checked = new Set<string>(), outcomes: Array<{ route: string; result: string }> = [];
    const pending = new Set(queue);
    let failures = audit.findings.length, skipped = 0;
    const findingForPage = (route: string, actual: string): Finding => ({ key: `page:${safePath(route)}`, title: `Page failed: ${safePath(route)}`, kind: "PAGE_FAILURE", severity: "HIGH", route: safePath(route), source: audit.routes.find(item => routeMatches(item.path, route))?.file, expected: "An advertised page renders its workspace without a missing-page or error boundary.", actual, steps: ["Use the configured QA profile with its existing permissions and enabled apps.", `Follow the navigation to ${safePath(route)}.`], evidence: [actual, `Revision ${revision}`, "Response content and record identifiers were not retained."] });
    while (queue.length && checked.size < 300) {
      assertStable();
      const route = queue.shift()!;
      if (checked.has(route)) continue;
      checked.add(route);
      await db.guardianWorker.update({ where: { id: "guardian" }, data: { heartbeatAt: new Date() } });
      try {
        const response = await fetch(new URL(route, base), { headers: { Cookie: `atlas_session=${token}` }, redirect: "manual", signal: AbortSignal.timeout(20_000) });
        if ([301,302,303,307,308].includes(response.status)) {
          const next = new URL(response.headers.get("location") ?? "/login", base);
          if (next.pathname === "/login") throw new Error("QA session redirected to sign-in; authenticated coverage is blocked.");
          if (next.origin === base.origin && next.pathname.startsWith("/") && !pending.has(next.pathname)) { queue.push(next.pathname); pending.add(next.pathname); }
          outcomes.push({ route: safePath(route), result: "redirect" }); continue;
        }
        const html = await response.text();
        assertStable();
        const outcome = responseOutcome(response.status, html);
        if (outcome === "failed") {
          failures++; observe(findingForPage(route, `HTTP ${response.status}; ${response.status === 200 ? "streamed error boundary found" : "unexpected response"}.`));
          outcomes.push({ route: safePath(route), result: "failed" }); continue;
        }
        // Access-denied/disabled workspaces are never counted as passing pages.
        if (outcome === "restricted") {
          skipped++; outcomes.push({ route: safePath(route), result: "restricted" }); continue;
        }
        outcomes.push({ route: safePath(route), result: "http-render-pass" });
        for (const match of html.matchAll(/href="([^"<>]+)"/g)) {
          const destination = match[1].replaceAll("&amp;", "&");
          if (!destination.startsWith("/") || destination.startsWith("//") || /[?#]/.test(destination) || /^\/(api|sign|share|login|logout|auth|atlas)(\/|$)/.test(destination)) continue;
          if (audit.routes.some(item => !item.api && routeMatches(item.path, destination)) && !pending.has(destination)) { pending.add(destination); queue.push(destination); }
        }
      } catch (error) {
        assertStable();
        if (error instanceof Error && error.message.startsWith("QA session")) throw new Error("QA profile session changed during page checks; refresh the authorised profile and rerun.");
        failures++; observe(findingForPage(route, "Page request failed or timed out (20 seconds)."));
        outcomes.push({ route: safePath(route), result: "failed" });
      }
    }
    let browserSummary = "Browser interaction checks not run.";
    let browserVerifiedRoutes: string[] = [];
    if (process.env.ATLAS_GUARDIAN_BROWSER === "1") {
      const { browserSweep } = await import("./browser-sweep");
      const result = await browserSweep(base, token, outcomes.filter(row => row.result === "http-render-pass").map(row => row.route).filter(route => !route.includes("[record]")), async finding => observe(finding), assertStable);
      failures += result.failures; browserSummary = result.summary; browserVerifiedRoutes = result.verifiedRoutes;
    }
    assertStable();
    for (const finding of runtimeFindings) await recordFinding(finding, revision, run.id);
    const summary = `${audit.coverage.sourceFiles} source files; ${audit.coverage.staticLinksChecked} static links; ${audit.coverage.controlsInventoried} controls inventoried. ${checked.size} page requests, ${skipped} restricted, ${queue.length} remaining after cap. ${failures} findings. ${browserSummary} Dynamic forms/writes still require fixture-based regression coverage; inventory is not a pass.`;
    await db.guardianRun.update({ where: { id: run.id }, data: { status: queue.length ? "PARTIAL" : failures ? "ISSUES_FOUND" : "COMPLETED", finishedAt: new Date(), summary, coverage: { ...audit.coverage, outcomes, remaining: queue.length, browserSummary, browserVerifiedRoutes } } });
    console.log(summary);
  } catch (error) {
    const message = error instanceof Error && /^(Set the existing|Configured QA|A production|Use loopback|QA profile session|Deployment changed)/.test(error.message) ? error.message : "Guardian worker failed. Inspect the service log securely and retry.";
    if (runId) await db.guardianRun.update({ where: { id: runId }, data: { status: "FAILED", finishedAt: new Date(), summary: message } });
    await recordFinding({ key: "worker:blocked", title: "Guardian sweep needs attention", kind: "WORKER_FAILURE", severity: "HIGH", route: "/atlas/guardian", expected: "The scheduled sweep completes with declared coverage.", actual: message, steps: ["Check systemctl status atlas-guardian.timer and atlas-guardian.service.", "Inspect the worker environment and authorised QA profile.", "Run the worker with --now and confirm a completed sweep."], evidence: [message] }, revision, runId);
    process.exitCode = 1;
  } finally { await lease.end(); await db.$disconnect(); }
}
main().catch(() => { console.error("[guardian] Worker could not start. Check database/service configuration."); process.exitCode = 1; });
