-- Create enums for sales projects
CREATE TYPE "SalesProjectStage" AS ENUM (
  'IDENTIFIED',
  'QUALIFIED',
  'SPECIFICATION',
  'ESTIMATING',
  'QUOTING',
  'NEGOTIATION',
  'PREFERRED',
  'AWARDED',
  'LIVE',
  'COMPLETED',
  'LOST',
  'CANCELLED',
  'DORMANT'
);

CREATE TYPE "SalesProjectOrganisationRole" AS ENUM (
  'END_CLIENT',
  'CONTRACTOR',
  'MERCHANT',
  'SPECIFIER',
  'DESIGN_CONSULTANT',
  'ENGINEER',
  'QUANTITY_SURVEYOR',
  'SITE_MANAGER',
  'PROCUREMENT_MANAGER',
  'ACCOUNTS_PAYABLE'
);

CREATE TYPE "SalesProjectStakeholderRole" AS ENUM (
  'DECISION_MAKER',
  'BUYER',
  'ESTIMATOR',
  'ENGINEER',
  'SPECIFIER',
  'COMMERCIAL_MANAGER',
  'QUANTITY_SURVEYOR',
  'SITE_MANAGER',
  'ACCOUNTS_PAYABLE',
  'INFLUENCER',
  'CHAMPION',
  'BLOCKER',
  'OTHER'
);

-- Create sales_projects table
CREATE TABLE "sales_projects" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "stage" "SalesProjectStage" NOT NULL DEFAULT 'IDENTIFIED',
  "stageEnteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ownerUserId" TEXT NOT NULL,
  "teamId" TEXT,
  "potentialValueAmount" INTEGER,
  "potentialValueCurrency" TEXT NOT NULL DEFAULT 'GBP',
  "quotedValueAmount" INTEGER,
  "quotedValueCurrency" TEXT NOT NULL DEFAULT 'GBP',
  "awardedValueAmount" INTEGER,
  "awardedValueCurrency" TEXT NOT NULL DEFAULT 'GBP',
  "orderedValueAmount" INTEGER,
  "orderedValueCurrency" TEXT NOT NULL DEFAULT 'GBP',
  "remainingValueAmount" INTEGER,
  "remainingValueCurrency" TEXT NOT NULL DEFAULT 'GBP',
  "probability" INTEGER,
  "expectedValueAmount" INTEGER,
  "targetAwardDate" TIMESTAMP(3),
  "expectedStartDate" TIMESTAMP(3),
  "expectedCompletionDate" TIMESTAMP(3),
  "nextActionNote" TEXT,
  "nextActionAt" TIMESTAMP(3),
  "industryId" TEXT,
  "tags" TEXT[],
  "notes" TEXT,
  "lastActivityAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sales_projects_pkey" PRIMARY KEY ("id")
);

-- Create sales_project_organisations table
CREATE TABLE "sales_project_organisations" (
  "id" TEXT NOT NULL,
  "salesProjectId" TEXT NOT NULL,
  "partyId" TEXT NOT NULL,
  "roles" "SalesProjectOrganisationRole"[],
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sales_project_organisations_pkey" PRIMARY KEY ("id")
);

-- Create sales_project_stakeholders table
CREATE TABLE "sales_project_stakeholders" (
  "id" TEXT NOT NULL,
  "salesProjectId" TEXT NOT NULL,
  "contactId" TEXT NOT NULL,
  "roles" "SalesProjectStakeholderRole"[],
  "influence" TEXT,
  "relationshipStrength" TEXT,
  "sentiment" TEXT,
  "lastContactAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sales_project_stakeholders_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "sales_projects"
  ADD CONSTRAINT "sales_projects_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sales_projects"
  ADD CONSTRAINT "sales_projects_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "sales_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sales_projects"
  ADD CONSTRAINT "sales_projects_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "crm_industries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sales_project_organisations"
  ADD CONSTRAINT "sales_project_organisations_salesProjectId_fkey" FOREIGN KEY ("salesProjectId") REFERENCES "sales_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sales_project_organisations"
  ADD CONSTRAINT "sales_project_organisations_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sales_project_stakeholders"
  ADD CONSTRAINT "sales_project_stakeholders_salesProjectId_fkey" FOREIGN KEY ("salesProjectId") REFERENCES "sales_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sales_project_stakeholders"
  ADD CONSTRAINT "sales_project_stakeholders_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add indexes
CREATE UNIQUE INDEX "sales_projects_organisationId_reference_key" ON "sales_projects"("organisationId", "reference");
CREATE INDEX "sales_projects_organisationId_stage_idx" ON "sales_projects"("organisationId", "stage");
CREATE INDEX "sales_projects_organisationId_ownerUserId_idx" ON "sales_projects"("organisationId", "ownerUserId");
CREATE INDEX "sales_projects_organisationId_targetAwardDate_idx" ON "sales_projects"("organisationId", "targetAwardDate");

CREATE UNIQUE INDEX "sales_project_organisations_salesProjectId_partyId_key" ON "sales_project_organisations"("salesProjectId", "partyId");
CREATE INDEX "sales_project_organisations_salesProjectId_idx" ON "sales_project_organisations"("salesProjectId");

CREATE UNIQUE INDEX "sales_project_stakeholders_salesProjectId_contactId_key" ON "sales_project_stakeholders"("salesProjectId", "contactId");
CREATE INDEX "sales_project_stakeholders_salesProjectId_idx" ON "sales_project_stakeholders"("salesProjectId");

-- Add salesProjectId to existing tables
ALTER TABLE "sales_quotes" ADD COLUMN "salesProjectId" TEXT;
ALTER TABLE "sales_quotes" ADD CONSTRAINT "sales_quotes_salesProjectId_fkey" FOREIGN KEY ("salesProjectId") REFERENCES "sales_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "sales_quotes_organisationId_salesProjectId_idx" ON "sales_quotes"("organisationId", "salesProjectId");

ALTER TABLE "sales_orders" ADD COLUMN "salesProjectId" TEXT;
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_salesProjectId_fkey" FOREIGN KEY ("salesProjectId") REFERENCES "sales_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "sales_orders_organisationId_salesProjectId_idx" ON "sales_orders"("organisationId", "salesProjectId");

-- Add salesProjectId to sales_activities if it doesn't exist
ALTER TABLE "sales_activities" ADD COLUMN "salesProjectId" TEXT;
ALTER TABLE "sales_activities" ADD CONSTRAINT "sales_activities_salesProjectId_fkey" FOREIGN KEY ("salesProjectId") REFERENCES "sales_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "sales_activities_salesProjectId_idx" ON "sales_activities"("salesProjectId");
