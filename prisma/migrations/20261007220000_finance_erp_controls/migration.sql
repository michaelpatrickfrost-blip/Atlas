-- AlterTable
ALTER TABLE "finance_entities" ADD COLUMN     "fiscalStartMonth" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "matchToleranceBps" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "registeredAddress" TEXT,
ADD COLUMN     "registrationNumber" TEXT;

-- AlterTable
ALTER TABLE "finance_accounts" ADD COLUMN     "currencyRestriction" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "dimensionRules" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "postingAllowed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "subType" TEXT;

-- AlterTable
ALTER TABLE "finance_periods" ADD COLUMN     "allowedSources" TEXT[] DEFAULT ARRAY['AP_INVOICE']::TEXT[];

-- AlterTable
ALTER TABLE "finance_journals" ADD COLUMN     "documentDate" TIMESTAMP(3),
ADD COLUMN     "exchangeRate" DECIMAL(24,12),
ADD COLUMN     "postingFingerprint" TEXT,
ADD COLUMN     "taxDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "finance_documents" ADD COLUMN     "accountingDate" TIMESTAMP(3),
ADD COLUMN     "taxDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "finance_settlements" ADD COLUMN     "bankAmount" BIGINT,
ADD COLUMN     "carryingAmount" BIGINT,
ADD COLUMN     "realisedFx" BIGINT;

-- CreateTable
CREATE TABLE "finance_dimension_values" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "finance_dimension_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_collection_activities" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "promisedAmount" BIGINT,
    "followUpAt" TIMESTAMP(3),
    "actorUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_collection_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "finance_dimension_values_organisationId_entityId_dimension__idx" ON "finance_dimension_values"("organisationId", "entityId", "dimension", "active");

-- CreateIndex
CREATE UNIQUE INDEX "finance_dimension_values_entityId_dimension_code_key" ON "finance_dimension_values"("entityId", "dimension", "code");

-- CreateIndex
CREATE INDEX "finance_collection_activities_organisationId_documentId_cre_idx" ON "finance_collection_activities"("organisationId", "documentId", "createdAt");

-- CreateIndex
CREATE INDEX "finance_bank_transactions_organisationId_bankId_status_date_idx" ON "finance_bank_transactions"("organisationId", "bankId", "status", "date");


-- New fields are nullable where historical provenance was not retained. No financial
-- amount, posted journal, source document or previous migration is rewritten.
ALTER TABLE finance_dimension_values ADD CONSTRAINT finance_dimension_entity_fkey
 FOREIGN KEY ("entityId","organisationId") REFERENCES finance_entities(id,"organisationId") ON DELETE RESTRICT;
ALTER TABLE finance_dimension_values ADD CONSTRAINT finance_dimension_kind CHECK (dimension IN ('department','costCentre'));
ALTER TABLE finance_collection_activities ADD CONSTRAINT finance_collection_document_fkey
 FOREIGN KEY ("documentId","organisationId") REFERENCES finance_documents(id,"organisationId") ON DELETE RESTRICT;
ALTER TABLE finance_collection_activities ADD CONSTRAINT finance_collection_kind CHECK
 (kind IN ('CALL','EMAIL','LETTER','PROMISE','DISPUTE','FOLLOW_UP','RESOLVED') AND
 (kind <> 'PROMISE' OR ("promisedAmount" > 0 AND "followUpAt" IS NOT NULL)));
CREATE TRIGGER finance_collection_append_only BEFORE UPDATE OR DELETE ON finance_collection_activities
 FOR EACH ROW EXECUTE FUNCTION atlas_finance_append_only();
ALTER TABLE finance_entities ADD CONSTRAINT finance_fiscal_start CHECK ("fiscalStartMonth" BETWEEN 1 AND 12);
CREATE UNIQUE INDEX finance_one_active_posting_profile ON finance_accounts("entityId",control)
 WHERE active AND control IS NOT NULL;
ALTER TABLE finance_accounts ADD CONSTRAINT finance_account_parent_fkey FOREIGN KEY("parentId","organisationId")
 REFERENCES finance_accounts(id,"organisationId") ON DELETE RESTRICT;

CREATE FUNCTION atlas_finance_period_overlap() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext('finance-period:' || NEW."entityId"));
 IF EXISTS (SELECT 1 FROM finance_periods p WHERE p."entityId"=NEW."entityId" AND p.id<>NEW.id
 AND p."startAt"<=NEW."endAt" AND p."endAt">=NEW."startAt") THEN
  RAISE EXCEPTION 'Financial periods cannot overlap';
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER finance_period_no_overlap BEFORE INSERT OR UPDATE OF "startAt","endAt","entityId" ON finance_periods
 FOR EACH ROW EXECUTE FUNCTION atlas_finance_period_overlap();

CREATE OR REPLACE FUNCTION atlas_finance_validate_posting() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE d numeric; c numeric; td numeric; tc numeric; n integer; period_state text; period_entity text;
 sources text[]; dimension text; base_currency text;
BEGIN
 IF NEW.status = 'POSTED' THEN
  SELECT SUM(debit),SUM(credit),SUM("transactionDebit"),SUM("transactionCredit"),COUNT(*) INTO d,c,td,tc,n
  FROM finance_journal_lines WHERE "journalId"=NEW.id AND "organisationId"=NEW."organisationId";
  IF n<2 OR d IS NULL OR d=0 OR d<>c OR td<>tc THEN RAISE EXCEPTION 'Posted journal must balance exactly in both currencies'; END IF;
  SELECT p.state,p."entityId",p."allowedSources" INTO period_state,period_entity,sources FROM finance_periods p
  WHERE p.id=NEW."periodId" AND p."organisationId"=NEW."organisationId"
  AND NEW."accountingDate" BETWEEN p."startAt" AND p."endAt" FOR SHARE;
  IF period_entity IS DISTINCT FROM NEW."entityId" OR NOT
   (period_state='OPEN' OR (period_state='SOFT_CLOSED' AND NEW."sourceType"=ANY(sources)))
   THEN RAISE EXCEPTION 'Posting outside permitted entity/period'; END IF;
  SELECT currency INTO base_currency FROM finance_entities WHERE id=NEW."entityId" AND "organisationId"=NEW."organisationId";
  IF NEW."exchangeRate" IS NOT NULL AND (NEW."exchangeRate"<=0 OR
   (NEW.currency=base_currency AND NEW."exchangeRate"<>1)) THEN RAISE EXCEPTION 'Invalid retained exchange rate'; END IF;
  IF EXISTS (SELECT 1 FROM finance_journal_lines l JOIN finance_accounts a ON a.id=l."accountId"
   WHERE l."journalId"=NEW.id AND (a."entityId"<>NEW."entityId" OR NOT a.active OR NOT a."postingAllowed"
    OR a."organisationId"<>NEW."organisationId" OR l."organisationId"<>NEW."organisationId"
    OR (a."currencyRestriction" IS NOT NULL AND a."currencyRestriction"<>NEW.currency)
    OR l."transactionDebit"<0 OR l."transactionCredit"<0 OR (l."transactionDebit">0 AND l."transactionCredit">0)))
   THEN RAISE EXCEPTION 'Posting account or transaction currency is invalid'; END IF;
  FOREACH dimension IN ARRAY ARRAY['department','costCentre','site','projectId'] LOOP
   IF EXISTS (SELECT 1 FROM finance_journal_lines l JOIN finance_accounts a ON a.id=l."accountId"
    WHERE l."journalId"=NEW.id AND (
      (a."dimensionRules"->>dimension='REQUIRED' AND COALESCE(to_jsonb(l)->>dimension,'')='') OR
      (a."dimensionRules"->>dimension='PROHIBITED' AND COALESCE(to_jsonb(l)->>dimension,'')<>'')))
    THEN RAISE EXCEPTION 'Posting violates account dimension rule: %', dimension; END IF;
  END LOOP;
 END IF;
 RETURN NULL;
END; $$;

ALTER TABLE finance_entities ADD CONSTRAINT finance_match_tolerance CHECK ("matchToleranceBps" BETWEEN 0 AND 10000);
