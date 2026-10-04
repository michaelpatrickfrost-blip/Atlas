
-- AlterTable
ALTER TABLE "hr_one_to_ones" ADD COLUMN     "answers" JSONB,
ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "hr_one_to_one_templates" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "talkingPoints" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_one_to_one_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hr_one_to_one_templates_organisationId_name_key" ON "hr_one_to_one_templates"("organisationId", "name");

-- AddForeignKey
ALTER TABLE "hr_one_to_one_templates" ADD CONSTRAINT "hr_one_to_one_templates_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_one_to_ones" ADD CONSTRAINT "hr_one_to_ones_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "hr_one_to_one_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

