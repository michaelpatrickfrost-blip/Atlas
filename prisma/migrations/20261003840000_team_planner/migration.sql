CREATE TYPE "PlannerTaskStatus" AS ENUM ('OPEN', 'DOING', 'DONE');
CREATE TYPE "PlannerPlaceKind" AS ENUM ('OFFICE', 'HOME', 'SITE', 'TRAVEL');
CREATE TYPE "PlannerMomentKind" AS ENUM ('MEETING', 'DEADLINE', 'AWAY_DAY');

CREATE TABLE "planner_teams" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "planner_teams_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "planner_team_members" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "lead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "planner_team_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "planner_tasks" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "detail" TEXT,
  "assigneeEmployeeId" TEXT,
  "dueOn" DATE,
  "status" "PlannerTaskStatus" NOT NULL DEFAULT 'OPEN',
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "planner_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "planner_covers" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "coverEmployeeId" TEXT NOT NULL,
  "startsOn" DATE NOT NULL,
  "endsOn" DATE NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "planner_covers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "planner_handovers" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "startsOn" DATE NOT NULL,
  "endsOn" DATE NOT NULL,
  "note" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "planner_handovers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "planner_places" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "onDate" DATE NOT NULL,
  "kind" "PlannerPlaceKind" NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "planner_places_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "planner_moments" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "onDate" DATE NOT NULL,
  "kind" "PlannerMomentKind" NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "planner_moments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "planner_teams_organisationId_idx" ON "planner_teams"("organisationId");
CREATE INDEX "planner_team_members_organisationId_employeeId_idx" ON "planner_team_members"("organisationId", "employeeId");
CREATE UNIQUE INDEX "planner_team_members_teamId_employeeId_key" ON "planner_team_members"("teamId", "employeeId");
CREATE INDEX "planner_tasks_organisationId_teamId_status_idx" ON "planner_tasks"("organisationId", "teamId", "status");
CREATE INDEX "planner_tasks_organisationId_assigneeEmployeeId_idx" ON "planner_tasks"("organisationId", "assigneeEmployeeId");
CREATE INDEX "planner_covers_organisationId_teamId_startsOn_idx" ON "planner_covers"("organisationId", "teamId", "startsOn");
CREATE INDEX "planner_handovers_organisationId_teamId_startsOn_idx" ON "planner_handovers"("organisationId", "teamId", "startsOn");
CREATE INDEX "planner_places_organisationId_teamId_onDate_idx" ON "planner_places"("organisationId", "teamId", "onDate");
CREATE UNIQUE INDEX "planner_places_teamId_employeeId_onDate_key" ON "planner_places"("teamId", "employeeId", "onDate");
CREATE INDEX "planner_moments_organisationId_teamId_onDate_idx" ON "planner_moments"("organisationId", "teamId", "onDate");

ALTER TABLE "planner_teams" ADD CONSTRAINT "planner_teams_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "planner_team_members" ADD CONSTRAINT "planner_team_members_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "planner_team_members" ADD CONSTRAINT "planner_team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "planner_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "planner_team_members" ADD CONSTRAINT "planner_team_members_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "planner_tasks" ADD CONSTRAINT "planner_tasks_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "planner_tasks" ADD CONSTRAINT "planner_tasks_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "planner_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "planner_tasks" ADD CONSTRAINT "planner_tasks_assigneeEmployeeId_fkey" FOREIGN KEY ("assigneeEmployeeId") REFERENCES "hr_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "planner_covers" ADD CONSTRAINT "planner_covers_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "planner_covers" ADD CONSTRAINT "planner_covers_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "planner_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "planner_covers" ADD CONSTRAINT "planner_covers_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "planner_covers" ADD CONSTRAINT "planner_covers_coverEmployeeId_fkey" FOREIGN KEY ("coverEmployeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "planner_handovers" ADD CONSTRAINT "planner_handovers_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "planner_handovers" ADD CONSTRAINT "planner_handovers_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "planner_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "planner_handovers" ADD CONSTRAINT "planner_handovers_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "planner_places" ADD CONSTRAINT "planner_places_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "planner_places" ADD CONSTRAINT "planner_places_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "planner_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "planner_places" ADD CONSTRAINT "planner_places_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "planner_moments" ADD CONSTRAINT "planner_moments_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "planner_moments" ADD CONSTRAINT "planner_moments_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "planner_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
