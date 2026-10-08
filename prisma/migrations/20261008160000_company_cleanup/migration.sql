-- Add a durable platform cleanup record; no existing rows are deleted by migration.
CREATE TABLE "company_cleanup_runs" (
 "id" TEXT NOT NULL PRIMARY KEY, "version" INTEGER NOT NULL DEFAULT 0, "actorUserId" TEXT NOT NULL, "companies" JSONB NOT NULL,
 "remainingFileKeys" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], "removedFileCount" INTEGER NOT NULL DEFAULT 0,
 "status" TEXT NOT NULL DEFAULT 'REMOVING_FILES', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "company_cleanup_runs_status_createdAt_idx" ON "company_cleanup_runs"("status", "createdAt");

-- Preserve posted/verified production guards, permitting only explicit Test deletion.
CREATE OR REPLACE FUNCTION atlas_finance_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 -- Only DELETE of rows belonging to a Test company selected by the wipe transaction.
 IF TG_OP = 'DELETE' AND current_setting('atlas.test_wipe', true) = 'on'
    AND EXISTS (SELECT 1 FROM organisations WHERE id = OLD."organisationId" AND "isTest" AND kind = 'CUSTOMER') THEN
   RETURN OLD;
 END IF;
 IF TG_TABLE_NAME = 'finance_journals' AND OLD.status = 'POSTED' THEN RAISE EXCEPTION 'Posted journals are immutable; create a reversal'; END IF;
 IF TG_TABLE_NAME = 'finance_documents' AND OLD.status = 'POSTED' THEN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Posted documents cannot be deleted'; END IF;
  IF (to_jsonb(NEW) - ARRAY['settled','updatedAt']) IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['settled','updatedAt']) THEN RAISE EXCEPTION 'Posted documents are immutable except settlement'; END IF;
 END IF;
 IF TG_TABLE_NAME = 'finance_bank_versions' AND OLD.status IN ('VERIFIED','SUPERSEDED') THEN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Verified bank history cannot be deleted'; END IF;
  IF (to_jsonb(NEW) - 'status') IS DISTINCT FROM (to_jsonb(OLD) - 'status') OR NEW.status <> 'SUPERSEDED' THEN RAISE EXCEPTION 'Verified bank details are immutable'; END IF;
 END IF;
 IF TG_OP = 'DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION atlas_finance_line_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE parent_status text;
BEGIN
 -- Only DELETE of rows belonging to a Test company selected by the wipe transaction.
 IF TG_OP = 'DELETE' AND current_setting('atlas.test_wipe', true) = 'on'
    AND EXISTS (SELECT 1 FROM organisations WHERE id = OLD."organisationId" AND "isTest" AND kind = 'CUSTOMER') THEN
   RETURN OLD;
 END IF;
 IF TG_TABLE_NAME = 'finance_journal_lines' THEN
  IF TG_OP <> 'INSERT' THEN SELECT status INTO parent_status FROM finance_journals WHERE id = OLD."journalId"; IF parent_status = 'POSTED' THEN RAISE EXCEPTION 'Posted journal lines are immutable'; END IF; END IF;
  IF TG_OP <> 'DELETE' THEN SELECT status INTO parent_status FROM finance_journals WHERE id = NEW."journalId"; IF parent_status = 'POSTED' THEN RAISE EXCEPTION 'Cannot append to a posted journal'; END IF; END IF;
 ELSE
  IF TG_OP <> 'INSERT' THEN SELECT status INTO parent_status FROM finance_documents WHERE id = OLD."documentId"; IF parent_status NOT IN ('DRAFT','NEEDS_INFORMATION','REJECTED') THEN RAISE EXCEPTION 'Approved/submitted document lines are locked'; END IF; END IF;
  IF TG_OP <> 'DELETE' THEN SELECT status INTO parent_status FROM finance_documents WHERE id = NEW."documentId"; IF parent_status NOT IN ('DRAFT','NEEDS_INFORMATION','REJECTED') THEN RAISE EXCEPTION 'Cannot append to a locked document'; END IF; END IF;
 END IF;
 IF TG_OP = 'DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END; $$;

-- Strengthen the original wipe flag: append-only production history stays protected.
CREATE OR REPLACE FUNCTION atlas_finance_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP = 'DELETE' AND current_setting('atlas.test_wipe', true) = 'on'
    AND EXISTS (SELECT 1 FROM organisations WHERE id = OLD."organisationId" AND "isTest" AND kind = 'CUSTOMER') THEN
   RETURN OLD;
 END IF;
 RAISE EXCEPTION 'Financial timeline and settlements are append-only';
END; $$;
