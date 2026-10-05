-- Additive: richer satisfaction surveys (reasons, low-score follow-up, scale labels, survey email).
ALTER TABLE "csat_surveys"
  ADD COLUMN IF NOT EXISTS "lowFollowUpQuestion" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "reasons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "lowLabel" TEXT NOT NULL DEFAULT 'Very unhappy',
  ADD COLUMN IF NOT EXISTS "highLabel" TEXT NOT NULL DEFAULT 'Very happy',
  ADD COLUMN IF NOT EXISTS "emailSubject" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "emailIntro" TEXT NOT NULL DEFAULT '';
ALTER TABLE "csat_responses" ADD COLUMN IF NOT EXISTS "reasons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
