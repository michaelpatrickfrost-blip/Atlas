-- Handling unit types a company can add or retire, and the physical fields a package needs to be one.

CREATE TABLE "logistics_handling_unit_types" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "lengthMm" INTEGER NOT NULL,
  "widthMm" INTEGER NOT NULL,
  "heightMm" INTEGER NOT NULL,
  "tareWeightGrams" INTEGER NOT NULL DEFAULT 0,
  "canContain" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "logistics_handling_unit_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "logistics_handling_unit_types_organisationId_code_key" ON "logistics_handling_unit_types"("organisationId", "code");
CREATE INDEX "logistics_handling_unit_types_organisationId_active_idx" ON "logistics_handling_unit_types"("organisationId", "active");
ALTER TABLE "logistics_handling_unit_types" ADD CONSTRAINT "logistics_handling_unit_types_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "logistics_packages" ADD COLUMN "requirementId" TEXT;
ALTER TABLE "logistics_packages" ADD COLUMN "typeCode" TEXT;
ALTER TABLE "logistics_packages" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PACKED';
ALTER TABLE "logistics_packages" ADD COLUMN "barcode" TEXT;
ALTER TABLE "logistics_packages" ADD COLUMN "tareWeightGrams" INTEGER;
ALTER TABLE "logistics_packages" ADD COLUMN "locationCode" TEXT;
CREATE INDEX "logistics_packages_organisationId_requirementId_idx" ON "logistics_packages"("organisationId", "requirementId");
ALTER TABLE "logistics_packages" ADD CONSTRAINT "logistics_packages_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "logistics_fulfilments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
