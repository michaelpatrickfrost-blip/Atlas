-- Additive, private pre-authentication counters. No identity or business data.
CREATE TABLE "authentication_rate_limits" (
  "key" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "authentication_rate_limits_pkey" PRIMARY KEY ("key")
);
CREATE INDEX "authentication_rate_limits_expiresAt_idx" ON "authentication_rate_limits"("expiresAt");
