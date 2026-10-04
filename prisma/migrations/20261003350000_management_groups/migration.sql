ALTER TABLE "work_teams" ADD COLUMN "departments" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], ADD COLUMN "description" TEXT;
ALTER TABLE "work_team_members" ADD COLUMN "isManager" BOOLEAN NOT NULL DEFAULT false;
