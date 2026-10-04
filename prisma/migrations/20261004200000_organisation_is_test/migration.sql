-- Companies marked as Test can be wiped from the owner console.
ALTER TABLE organisations ADD COLUMN "isTest" boolean NOT NULL DEFAULT false;

-- Finance timeline/settlements/attachments stay append-only, except DELETE inside a
-- test-company wipe, which the application enables per transaction with
-- set_config('atlas.test_wipe','on',true) after checking organisations."isTest".
CREATE OR REPLACE FUNCTION atlas_finance_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' AND current_setting('atlas.test_wipe', true) = 'on' THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'Financial timeline and settlements are append-only';
END; $$;
