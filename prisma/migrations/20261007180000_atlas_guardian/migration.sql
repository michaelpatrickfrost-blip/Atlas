CREATE TABLE "guardian_issues" (
 "id" TEXT PRIMARY KEY, "fingerprint" TEXT NOT NULL UNIQUE, "title" TEXT NOT NULL,
 "kind" TEXT NOT NULL, "severity" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'OPEN',
 "route" TEXT NOT NULL, "source" TEXT, "expected" TEXT NOT NULL, "actual" TEXT NOT NULL,
 "steps" TEXT[] NOT NULL, "evidence" TEXT[] NOT NULL, "brief" TEXT NOT NULL,
 "revision" TEXT NOT NULL, "runId" TEXT, "occurrences" INTEGER NOT NULL DEFAULT 1,
 "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "resolution" TEXT, "verifiedRevision" TEXT, "reviewedBy" TEXT,
 CONSTRAINT guardian_issue_status CHECK (status IN ('OPEN','INVESTIGATING','NEEDS_AI','FIXED','IGNORED'))
);
CREATE INDEX "guardian_issues_status_lastSeenAt_idx" ON "guardian_issues"("status", "lastSeenAt");
CREATE TABLE "guardian_runs" (
 "id" TEXT PRIMARY KEY, "status" TEXT NOT NULL DEFAULT 'QUEUED', "requestedBy" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "startedAt" TIMESTAMP(3),
 "finishedAt" TIMESTAMP(3), "revision" TEXT, "summary" TEXT, "coverage" JSONB
);
CREATE INDEX "guardian_runs_status_createdAt_idx" ON "guardian_runs"("status", "createdAt");
CREATE TABLE "guardian_workers" ("id" TEXT PRIMARY KEY, "heartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "revision" TEXT NOT NULL);
CREATE TABLE "guardian_rate_limits" ("id" TEXT PRIMARY KEY, "count" INTEGER NOT NULL DEFAULT 1, "expiresAt" TIMESTAMP(3) NOT NULL);
