-- Harden the already-applied Marketing foundation without changing history.
CREATE UNIQUE INDEX IF NOT EXISTS "contacts_id_partyId_key" ON "contacts"("id","partyId");
CREATE UNIQUE INDEX IF NOT EXISTS "marketing_profiles_contactId_partyId_key" ON "marketing_profiles"("contactId","partyId");
ALTER TABLE "marketing_profiles" ADD CONSTRAINT "marketing_profiles_contactId_partyId_fkey" FOREIGN KEY ("contactId","partyId") REFERENCES "contacts"("id","partyId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "marketing_audience_members" ADD CONSTRAINT "marketing_audience_members_profileId_organisationId_fkey" FOREIGN KEY ("profileId","organisationId") REFERENCES "marketing_profiles"("id","organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "marketing_deliveries" ADD CONSTRAINT "marketing_deliveries_profileId_organisationId_fkey" FOREIGN KEY ("profileId","organisationId") REFERENCES "marketing_profiles"("id","organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "marketing_journey_enrolments" ADD CONSTRAINT "marketing_journey_enrolments_profileId_organisationId_fkey" FOREIGN KEY ("profileId","organisationId") REFERENCES "marketing_profiles"("id","organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "marketing_touches" ADD CONSTRAINT "marketing_touches_profileId_organisationId_fkey" FOREIGN KEY ("profileId","organisationId") REFERENCES "marketing_profiles"("id","organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "marketing_experiment_assignments" ADD CONSTRAINT "marketing_experiment_assignments_profileId_organisationId_fkey" FOREIGN KEY ("profileId","organisationId") REFERENCES "marketing_profiles"("id","organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Behaviour and permission facts are append-only for the non-administrative runtime.
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='atlas_runtime') THEN
  REVOKE UPDATE, DELETE ON marketing_events, marketing_permissions, marketing_suppressions,
   marketing_touches, marketing_journey_versions, marketing_experiment_assignments FROM atlas_runtime;
 END IF;
END $$;

-- A locked send's message is historical evidence, independent of UI controls.
CREATE FUNCTION marketing_locked_message_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.status <> 'DRAFT' AND
  (NEW.body, NEW.subject, NEW.channel, NEW.classification, NEW.purpose, NEW.brand, NEW.country, NEW."legalEntity", NEW."campaignId", NEW.version)
  IS DISTINCT FROM
  (OLD.body, OLD.subject, OLD.channel, OLD.classification, OLD.purpose, OLD.brand, OLD.country, OLD."legalEntity", OLD."campaignId", OLD.version)
 THEN RAISE EXCEPTION 'Locked marketing message cannot be edited'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER marketing_locked_message BEFORE UPDATE ON marketing_messages FOR EACH ROW EXECUTE FUNCTION marketing_locked_message_guard();
ALTER TABLE marketing_profiles ADD CONSTRAINT marketing_profile_score_range CHECK (score BETWEEN 0 AND 100);
ALTER TABLE marketing_campaigns ADD CONSTRAINT marketing_campaign_budget_positive CHECK ("budgetMinor">=0 AND "goalTarget">=0);
ALTER TABLE marketing_experiments ADD CONSTRAINT marketing_experiment_allocation CHECK (control>=0 AND variant>=0 AND holdout>=0 AND control+variant+holdout=100);
