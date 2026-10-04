-- CreateEnum
CREATE TYPE "PlanningBucket" AS ENUM ('DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR');

-- CreateTable
CREATE TABLE "work_teams" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_team_members" (
    "teamId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,

    CONSTRAINT "work_team_members_pkey" PRIMARY KEY ("teamId","membershipId")
);

-- CreateTable
CREATE TABLE "planning_plans" (
    "requestKey" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,
    "bucket" "PlanningBucket" NOT NULL DEFAULT 'WEEK',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planning_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planning_plan_lines" (
    "requestKey" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "unitOfMeasure" TEXT NOT NULL,
    "teamId" TEXT,
    "assignedMembershipId" TEXT,
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planning_plan_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_teams_organisationId_idx" ON "work_teams"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "work_teams_organisationId_code_key" ON "work_teams"("organisationId", "code");

-- CreateIndex
CREATE INDEX "work_team_members_membershipId_idx" ON "work_team_members"("membershipId");

-- CreateIndex
CREATE INDEX "planning_plans_organisationId_startsOn_idx" ON "planning_plans"("organisationId", "startsOn");

-- CreateIndex
CREATE UNIQUE INDEX "planning_plans_organisationId_requestKey_key" ON "planning_plans"("organisationId", "requestKey");

-- CreateIndex
CREATE INDEX "planning_plan_lines_organisationId_planId_startsOn_idx" ON "planning_plan_lines"("organisationId", "planId", "startsOn");

-- CreateIndex
CREATE INDEX "planning_plan_lines_organisationId_teamId_assignedMembershi_idx" ON "planning_plan_lines"("organisationId", "teamId", "assignedMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "planning_plan_lines_organisationId_requestKey_key" ON "planning_plan_lines"("organisationId", "requestKey");

-- AddForeignKey
ALTER TABLE "work_teams" ADD CONSTRAINT "work_teams_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_team_members" ADD CONSTRAINT "work_team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "work_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_team_members" ADD CONSTRAINT "work_team_members_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_plans" ADD CONSTRAINT "planning_plans_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_plan_lines" ADD CONSTRAINT "planning_plan_lines_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_plan_lines" ADD CONSTRAINT "planning_plan_lines_planId_fkey" FOREIGN KEY ("planId") REFERENCES "planning_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_plan_lines" ADD CONSTRAINT "planning_plan_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_plan_lines" ADD CONSTRAINT "planning_plan_lines_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "work_teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_plan_lines" ADD CONSTRAINT "planning_plan_lines_assignedMembershipId_fkey" FOREIGN KEY ("assignedMembershipId") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Planning intentions must have valid dates and positive quantities even outside the UI.
ALTER TABLE "planning_plans" ADD CONSTRAINT "planning_plans_dates_check" CHECK ("endsOn" >= "startsOn");
ALTER TABLE "planning_plan_lines" ADD CONSTRAINT "planning_lines_dates_check" CHECK ("endsOn" >= "startsOn"), ADD CONSTRAINT "planning_lines_quantity_check" CHECK ("quantity" > 0);
