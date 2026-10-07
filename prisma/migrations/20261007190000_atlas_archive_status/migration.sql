-- Expand the existing lifecycle constraint atomically. No records or columns change.
BEGIN;
ALTER TABLE "organisations" DROP CONSTRAINT "organisation_status";
ALTER TABLE "organisations" ADD CONSTRAINT "organisation_status"
  CHECK ("status" IN ('ACTIVE', 'SUSPENDED', 'ARCHIVED'));
COMMIT;
