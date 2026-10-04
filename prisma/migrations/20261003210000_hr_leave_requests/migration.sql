-- CreateEnum
CREATE TYPE "AbsenceRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "hr_absence_records" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approverUserId" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "status" "AbsenceRequestStatus" NOT NULL DEFAULT 'APPROVED';

