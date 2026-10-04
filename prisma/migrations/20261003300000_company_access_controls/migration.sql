ALTER TABLE "organisations" ADD COLUMN "restrictedAccessAreas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
