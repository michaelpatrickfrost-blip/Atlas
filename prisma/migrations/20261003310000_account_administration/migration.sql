ALTER TABLE "users" ADD COLUMN "authVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "memberships" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "grantedCapabilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], ADD COLUMN "deniedCapabilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], ADD COLUMN "lastLoginAt" TIMESTAMP(3);
CREATE TABLE "password_resets" ("id" TEXT NOT NULL, "membershipId" TEXT NOT NULL, "tokenHash" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL, "usedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "password_resets_tokenHash_key" ON "password_resets"("tokenHash");
CREATE INDEX "password_resets_membershipId_createdAt_idx" ON "password_resets"("membershipId","createdAt");
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
