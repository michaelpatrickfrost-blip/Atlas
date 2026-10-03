-- AlterTable
ALTER TABLE "activities" ADD COLUMN     "partyId" TEXT;

-- CreateIndex
CREATE INDEX "activities_partyId_createdAt_idx" ON "activities"("partyId", "createdAt");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

