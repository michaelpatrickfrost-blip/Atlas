-- Manufacturing MRP planning runs + supply suggestions (§35-39, §156 of
-- docs/modules/MANUFACTURING_SOURCE_REQUIREMENTS.md). Written by hand against the
-- schema, scoped only to the two new tables, after `prisma migrate diff` produced
-- unrelated constraint-name drift noise for other modules' tables that is unsafe
-- to apply blind — see docs/modules/MANUFACTURING_COVERAGE.md.

-- CreateEnum
CREATE TYPE "ManufacturingSuggestionKind" AS ENUM ('MAKE', 'BUY', 'TRANSFER');

-- CreateEnum
CREATE TYPE "ManufacturingSuggestionStatus" AS ENUM ('PENDING', 'FIRMED', 'DISMISSED');

-- CreateTable
CREATE TABLE "manufacturing_planning_runs" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "triggeredByUserId" TEXT NOT NULL,
    "productCount" INTEGER NOT NULL DEFAULT 0,
    "suggestionCount" INTEGER NOT NULL DEFAULT 0,
    "warnings" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "manufacturing_planning_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturing_supply_suggestions" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "kind" "ManufacturingSuggestionKind" NOT NULL DEFAULT 'MAKE',
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "neededBy" TIMESTAMP(3),
    "status" "ManufacturingSuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "pegging" JSONB NOT NULL DEFAULT '[]',
    "resultingOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manufacturing_supply_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "manufacturing_planning_runs_organisationId_startedAt_idx" ON "manufacturing_planning_runs"("organisationId", "startedAt");

-- CreateIndex
CREATE INDEX "manufacturing_supply_suggestions_organisationId_status_needed_idx" ON "manufacturing_supply_suggestions"("organisationId", "status", "neededBy");

-- CreateIndex
CREATE INDEX "manufacturing_supply_suggestions_organisationId_productId_idx" ON "manufacturing_supply_suggestions"("organisationId", "productId");

-- AddForeignKey
ALTER TABLE "manufacturing_planning_runs" ADD CONSTRAINT "manufacturing_planning_runs_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_supply_suggestions" ADD CONSTRAINT "manufacturing_supply_suggestions_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_supply_suggestions" ADD CONSTRAINT "manufacturing_supply_suggestions_runId_fkey" FOREIGN KEY ("runId") REFERENCES "manufacturing_planning_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturing_supply_suggestions" ADD CONSTRAINT "manufacturing_supply_suggestions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
