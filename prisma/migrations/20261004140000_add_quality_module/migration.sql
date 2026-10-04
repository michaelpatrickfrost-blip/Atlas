-- CreateEnum
CREATE TYPE "QualitySpecificationStatus" AS ENUM ('DRAFT', 'EFFECTIVE', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "QualityCheckMethod" AS ENUM ('MEASUREMENT', 'PASS_FAIL', 'VISUAL', 'CHECKLIST');

-- CreateEnum
CREATE TYPE "QualityControlTrigger" AS ENUM ('RECEIPT', 'PRODUCTION', 'FINAL', 'DISPATCH', 'RETURN', 'MANUAL');

-- CreateEnum
CREATE TYPE "QualityInspectionResult" AS ENUM ('PENDING', 'PASS', 'FAIL');

-- CreateEnum
CREATE TYPE "QualityHoldStatus" AS ENUM ('ACTIVE', 'RELEASED');

-- CreateEnum
CREATE TYPE "NonConformanceSource" AS ENUM ('INCOMING', 'MANUFACTURING', 'FINAL', 'WAREHOUSE', 'CUSTOMER', 'SUPPLIER', 'AUDIT', 'OTHER');

-- CreateEnum
CREATE TYPE "NonConformanceSeverity" AS ENUM ('MINOR', 'MAJOR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "NonConformanceStatus" AS ENUM ('OPEN', 'CONTAINED', 'INVESTIGATING', 'DISPOSITIONED', 'CLOSED');

-- CreateEnum
CREATE TYPE "NonConformanceDisposition" AS ENUM ('PENDING', 'USE_AS_IS', 'REWORK', 'SCRAP', 'RETURN_TO_SUPPLIER', 'CONCESSION', 'SORT');

-- CreateEnum
CREATE TYPE "NonConformanceActionStatus" AS ENUM ('OPEN', 'DONE', 'VERIFIED', 'INEFFECTIVE');

-- CreateTable
CREATE TABLE "quality_sequences" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quality_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_specifications" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "revision" TEXT NOT NULL,
    "status" "QualitySpecificationStatus" NOT NULL DEFAULT 'DRAFT',
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "changeReason" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_specifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_characteristics" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "specificationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "method" "QualityCheckMethod" NOT NULL DEFAULT 'PASS_FAIL',
    "unit" TEXT,
    "target" DECIMAL(18,6),
    "lowerLimit" DECIMAL(18,6),
    "upperLimit" DECIMAL(18,6),
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quality_characteristics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_control_points" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productId" TEXT,
    "operation" TEXT,
    "trigger" "QualityControlTrigger" NOT NULL DEFAULT 'MANUAL',
    "specificationId" TEXT,
    "sampleSize" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_control_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_inspections" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "controlPointId" TEXT NOT NULL,
    "specificationId" TEXT,
    "productId" TEXT NOT NULL,
    "lotCode" TEXT,
    "warehouseId" TEXT,
    "locationId" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "quantityInspected" INTEGER NOT NULL DEFAULT 1,
    "result" "QualityInspectionResult" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "inspectedByUserId" TEXT NOT NULL,
    "inspectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quality_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_measurements" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "characteristicId" TEXT,
    "sampleIndex" INTEGER NOT NULL DEFAULT 1,
    "valueText" TEXT,
    "valueNumber" DECIMAL(18,6),
    "pass" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "quality_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_holds" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "lotCode" TEXT,
    "warehouseId" TEXT,
    "locationId" TEXT,
    "quantity" INTEGER NOT NULL,
    "status" "QualityHoldStatus" NOT NULL DEFAULT 'ACTIVE',
    "reason" TEXT NOT NULL,
    "inspectionId" TEXT,
    "placedByUserId" TEXT NOT NULL,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedByUserId" TEXT,
    "releasedAt" TIMESTAMP(3),
    "releaseNote" TEXT,

    CONSTRAINT "quality_holds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "non_conformances" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" "NonConformanceSource" NOT NULL,
    "status" "NonConformanceStatus" NOT NULL DEFAULT 'OPEN',
    "severity" "NonConformanceSeverity" NOT NULL DEFAULT 'MINOR',
    "productId" TEXT,
    "partyId" TEXT,
    "specificationId" TEXT,
    "inspectionId" TEXT,
    "holdId" TEXT,
    "quantityAffected" INTEGER,
    "defect" TEXT NOT NULL,
    "containment" TEXT,
    "disposition" "NonConformanceDisposition" NOT NULL DEFAULT 'PENDING',
    "dispositionNote" TEXT,
    "rootCause" TEXT,
    "rootCauseConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "reportedByUserId" TEXT NOT NULL,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedByUserId" TEXT,
    "closedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "non_conformances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "non_conformance_actions" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "ncrId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "NonConformanceActionStatus" NOT NULL DEFAULT 'OPEN',
    "effectivenessCriterion" TEXT,
    "effectivenessReviewDate" TIMESTAMP(3),
    "effectivenessResult" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "non_conformance_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quality_sequences_organisationId_prefix_key" ON "quality_sequences"("organisationId", "prefix");

-- CreateIndex
CREATE INDEX "quality_specifications_organisationId_productId_status_idx" ON "quality_specifications"("organisationId", "productId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "quality_specifications_organisationId_productId_code_revisi_key" ON "quality_specifications"("organisationId", "productId", "code", "revision");

-- CreateIndex
CREATE INDEX "quality_characteristics_organisationId_specificationId_idx" ON "quality_characteristics"("organisationId", "specificationId");

-- CreateIndex
CREATE INDEX "quality_control_points_organisationId_productId_active_idx" ON "quality_control_points"("organisationId", "productId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "quality_control_points_organisationId_code_key" ON "quality_control_points"("organisationId", "code");

-- CreateIndex
CREATE INDEX "quality_inspections_organisationId_productId_result_idx" ON "quality_inspections"("organisationId", "productId", "result");

-- CreateIndex
CREATE INDEX "quality_inspections_organisationId_controlPointId_idx" ON "quality_inspections"("organisationId", "controlPointId");

-- CreateIndex
CREATE UNIQUE INDEX "quality_inspections_organisationId_number_key" ON "quality_inspections"("organisationId", "number");

-- CreateIndex
CREATE INDEX "quality_measurements_organisationId_inspectionId_idx" ON "quality_measurements"("organisationId", "inspectionId");

-- CreateIndex
CREATE INDEX "quality_holds_organisationId_productId_status_idx" ON "quality_holds"("organisationId", "productId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "quality_holds_organisationId_number_key" ON "quality_holds"("organisationId", "number");

-- CreateIndex
CREATE INDEX "non_conformances_organisationId_status_severity_idx" ON "non_conformances"("organisationId", "status", "severity");

-- CreateIndex
CREATE INDEX "non_conformances_organisationId_productId_idx" ON "non_conformances"("organisationId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "non_conformances_organisationId_number_key" ON "non_conformances"("organisationId", "number");

-- CreateIndex
CREATE INDEX "non_conformance_actions_organisationId_ncrId_idx" ON "non_conformance_actions"("organisationId", "ncrId");

-- RenameForeignKey
ALTER TABLE "finance_documents" RENAME CONSTRAINT "finance_documents_salesorderid_organisationid_fkey" TO "finance_documents_salesOrderId_organisationId_fkey";

-- AddForeignKey
ALTER TABLE "quality_sequences" ADD CONSTRAINT "quality_sequences_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_specifications" ADD CONSTRAINT "quality_specifications_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_specifications" ADD CONSTRAINT "quality_specifications_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_characteristics" ADD CONSTRAINT "quality_characteristics_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_characteristics" ADD CONSTRAINT "quality_characteristics_specificationId_fkey" FOREIGN KEY ("specificationId") REFERENCES "quality_specifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_control_points" ADD CONSTRAINT "quality_control_points_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_control_points" ADD CONSTRAINT "quality_control_points_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_control_points" ADD CONSTRAINT "quality_control_points_specificationId_fkey" FOREIGN KEY ("specificationId") REFERENCES "quality_specifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_controlPointId_fkey" FOREIGN KEY ("controlPointId") REFERENCES "quality_control_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_specificationId_fkey" FOREIGN KEY ("specificationId") REFERENCES "quality_specifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_inspections" ADD CONSTRAINT "quality_inspections_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_measurements" ADD CONSTRAINT "quality_measurements_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_measurements" ADD CONSTRAINT "quality_measurements_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "quality_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_measurements" ADD CONSTRAINT "quality_measurements_characteristicId_fkey" FOREIGN KEY ("characteristicId") REFERENCES "quality_characteristics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_holds" ADD CONSTRAINT "quality_holds_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_holds" ADD CONSTRAINT "quality_holds_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_holds" ADD CONSTRAINT "quality_holds_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "quality_inspections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "non_conformances" ADD CONSTRAINT "non_conformances_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "non_conformances" ADD CONSTRAINT "non_conformances_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "non_conformances" ADD CONSTRAINT "non_conformances_specificationId_fkey" FOREIGN KEY ("specificationId") REFERENCES "quality_specifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "non_conformances" ADD CONSTRAINT "non_conformances_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "quality_inspections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "non_conformances" ADD CONSTRAINT "non_conformances_holdId_fkey" FOREIGN KEY ("holdId") REFERENCES "quality_holds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "non_conformance_actions" ADD CONSTRAINT "non_conformance_actions_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "non_conformance_actions" ADD CONSTRAINT "non_conformance_actions_ncrId_fkey" FOREIGN KEY ("ncrId") REFERENCES "non_conformances"("id") ON DELETE CASCADE ON UPDATE CASCADE;