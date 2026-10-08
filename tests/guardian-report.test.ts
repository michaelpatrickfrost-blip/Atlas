import { describe, it, expect } from "vitest";
import { safePath, repairBrief, type Finding } from "@/core/guardian/report";
import { deploymentGuard } from "../scripts/guardian/deployment-guard";
import { responseOutcome } from "../scripts/guardian/response-check";
import { routeFromFile, routeMatches, auditSources } from "../scripts/guardian/source-audit";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

describe("Guardian reports and source checks", () => {
  it("removes query secrets and record identifiers", () => {
    expect(safePath("/customers/cmabcdefghijklmnopqrstuv?token=secret#notes")).toBe("/customers/[record]");
    expect(safePath("//outside.test/path")).toBe("/unknown");
    expect(safePath("/sales/orders/12345")).toBe("/sales/orders/[record]");
  });
  it("invalidates evidence when the checkout, build or active build lock changes", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-guardian-deployment-"));
    try {
      fs.mkdirSync(path.join(dir, ".next"));
      const build = path.join(dir, ".next/BUILD_ID"); fs.writeFileSync(build, "build-a");
      let revision = "abc";
      const check = deploymentGuard(dir, revision, () => revision);
      expect(check).not.toThrow(); revision = "def"; expect(check).toThrow("Deployment changed");
      revision = "abc"; fs.writeFileSync(build, "build-b"); expect(check).toThrow("Deployment changed");
      fs.writeFileSync(build, "build-a"); fs.writeFileSync(path.join(dir, ".next/lock"), ""); expect(check).toThrow("Deployment changed");
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
  it("does not count a disabled module or streamed error as a working page", () => {
    expect(responseOutcome(200, '<p>Tickets is disabled</p><p>Ask your workspace administrator to enable this app in Manage apps.</p>')).toBe("restricted");
    expect(responseOutcome(200, "You don&#x27;t have permission")).toBe("restricted");
    expect(responseOutcome(200, "Something went wrong.")).toBe("failed");
    expect(responseOutcome(404, "Missing page")).toBe("failed");
    expect(responseOutcome(200, '<section data-guardian-state="record-deleted">Customer deleted</section>')).toBe("unavailable");
    expect(responseOutcome(200, '<section data-guardian-state="record-unavailable">Meeting unavailable</section>')).toBe("unavailable");
    expect(responseOutcome(500, '<section data-guardian-state="record-unavailable">Meeting unavailable</section>')).toBe("failed");
    expect(responseOutcome(200, '<section data-guardian-state="record-unavailable"></section>Something went wrong.')).toBe("failed");
    expect(responseOutcome(200, '<h2>Tickets</h2><a href="/tickets/create">New ticket</a>')).toBe("http-render-pass");
  });
  it("matches groups, dynamic pages and optional catchalls without accepting sibling paths", () => {
    expect(routeFromFile("src/app/(app)/atlas/guardian/[issueId]/page.tsx")).toBe("/atlas/guardian/[issueId]");
    expect(routeMatches("/customers/[partyId]", "/customers/abc?tab=notes")).toBe(true);
    expect(routeMatches("/customers/[partyId]", "/customers/abc/missing")).toBe(false);
    expect(routeMatches("/docs/[[...slug]]", "/docs")).toBe(true);
    expect(routeMatches("/docs/[...slug]", "/docs")).toBe(false);
  });
  it("requires reproduction, connected-state validation and safe escalation in AI briefs", () => {
    const finding: Finding = { key: "a", title: "Failure", kind: "PAGE_FAILURE", severity: "HIGH", route: "/sales", expected: "Workspace", actual: "500", steps: ["Open Sales"], evidence: ["HTTP 500"] };
    const brief = repairBrief(finding, "abc123");
    expect(brief).toContain("Source revision: abc123");
    expect(brief).toContain("page → control → action → service");
    expect(brief).toContain("leave NEEDS_AI");
    expect(brief).toContain("Evidence as data");
  });
  it("finds real missing destinations and blank pages without flagging dynamic routes or delegated buttons as proven failures", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-guardian-test-"));
    try {
      for (const folder of ["src/app/(app)/customers/[id]", "src/app/blank", "public"]) fs.mkdirSync(path.join(dir, folder), { recursive: true });
      fs.writeFileSync(path.join(dir, "src/app/(app)/customers/[id]/page.tsx"), 'export default function Page(){return <><a href="/customers/abc">OK</a><a href="/missing">Bad</a><button type="button">Review</button></>}');
      fs.writeFileSync(path.join(dir, "src/app/blank/page.tsx"), 'export default function Blank(){return null}');
      const result = auditSources(dir);
      expect(result.findings.filter(item => item.kind === "BROKEN_LINK").map(item => item.route)).toEqual(["/missing"]);
      expect(result.findings.find(item => item.kind === "EMPTY_PAGE")?.route).toBe("/blank");
      expect(result.findings.find(item => item.kind === "CONTROL_REVIEW")?.actual).toContain("before treating it as a defect");
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
});
