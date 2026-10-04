-- Company manager level. Existing companies start with every app toggle off.
ALTER TABLE "organisations" ADD COLUMN "managerPolicy" JSONB NOT NULL DEFAULT '{}';

-- Customer service managers already hold queue management. Sign-off is a separate grant.
UPDATE "roles"
SET "capabilities" = (
  SELECT ARRAY(SELECT DISTINCT unnest("capabilities" || ARRAY['service.case.approve']::text[]))
)
WHERE 'service.queue.manage' = ANY("capabilities")
  AND NOT ('service.case.approve' = ANY("capabilities"));

-- Administrators can sign off a complaint even when their stored role predates queue management.
UPDATE "roles"
SET "capabilities" = (
  SELECT ARRAY(SELECT DISTINCT unnest("capabilities" || ARRAY['service.case.approve']::text[]))
)
WHERE "key" = 'admin'
  AND NOT ('service.case.approve' = ANY("capabilities"));

-- Finance managers and administrators can open a document and sign off a high value.
UPDATE "roles"
SET "capabilities" = (
  SELECT ARRAY(SELECT DISTINCT unnest("capabilities" || ARRAY['finance.overview.read', 'finance.approval.decide']::text[]))
)
WHERE "key" IN ('finance_manager', 'admin')
  AND NOT ('finance.approval.decide' = ANY("capabilities"));
