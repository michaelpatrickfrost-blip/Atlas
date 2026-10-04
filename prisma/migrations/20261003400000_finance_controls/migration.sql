-- Additive Finance/Core approvals only; unrelated concurrent changes excluded.

CREATE TABLE "finance_entities" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "country" TEXT NOT NULL DEFAULT 'GB',
    "vatNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_entities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_accounts" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "control" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "finance_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_periods" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'OPEN',
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "finance_periods_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_journals" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "accountingDate" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "creatorUserId" TEXT NOT NULL,
    "approverUserId" TEXT,
    "postedAt" TIMESTAMP(3),
    "reversalOfId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_journals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_journal_lines" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "debit" BIGINT NOT NULL DEFAULT 0,
    "credit" BIGINT NOT NULL DEFAULT 0,
    "transactionDebit" BIGINT NOT NULL DEFAULT 0,
    "transactionCredit" BIGINT NOT NULL DEFAULT 0,
    "department" TEXT,
    "costCentre" TEXT,
    "site" TEXT,
    "projectId" TEXT,
    "partyId" TEXT,
    "productId" TEXT,
    "taxCode" TEXT,

    CONSTRAINT "finance_journal_lines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_suppliers" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "paymentDays" INTEGER NOT NULL DEFAULT 30,
    "category" TEXT,
    "creatorUserId" TEXT NOT NULL,
    "approvedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_suppliers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_bank_versions" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "sortCode" TEXT,
    "iban" TEXT,
    "fingerprint" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requesterUserId" TEXT NOT NULL,
    "verifierUserId" TEXT,
    "evidence" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "finance_bank_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_documents" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "externalReference" TEXT,
    "duplicateKey" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "creatorUserId" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "approverUserId" TEXT,
    "partyId" TEXT,
    "projectId" TEXT,
    "sourceId" TEXT,
    "salesOrderId" TEXT,
    "journalId" TEXT,
    "bankVersionId" TEXT,
    "currency" TEXT NOT NULL,
    "exchangeRate" DECIMAL(24,12) NOT NULL DEFAULT 1,
    "documentDate" TIMESTAMP(3) NOT NULL,
    "dueAt" TIMESTAMP(3),
    "net" BIGINT NOT NULL DEFAULT 0,
    "tax" BIGINT NOT NULL DEFAULT 0,
    "gross" BIGINT NOT NULL DEFAULT 0,
    "settled" BIGINT NOT NULL DEFAULT 0,
    "department" TEXT,
    "costCentre" TEXT,
    "site" TEXT,
    "category" TEXT,
    "reason" TEXT,
    "capex" BOOLEAN NOT NULL DEFAULT false,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "risk" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_document_lines" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "productId" TEXT,
    "sourceLineId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(24,6) NOT NULL,
    "damagedQuantity" DECIMAL(24,6) NOT NULL DEFAULT 0,
    "unitPrice" BIGINT NOT NULL,
    "net" BIGINT NOT NULL,
    "tax" BIGINT NOT NULL,
    "taxCode" TEXT NOT NULL DEFAULT 'OUTSIDE_SCOPE',
    "taxRateBps" INTEGER NOT NULL DEFAULT 0,
    "accountId" TEXT,

    CONSTRAINT "finance_document_lines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_settlements" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "bankTransactionId" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_settlements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_banks" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "statementBalance" BIGINT NOT NULL DEFAULT 0,
    "statementDate" TIMESTAMP(3),

    CONSTRAINT "finance_banks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_bank_transactions" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reference" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "allocated" BIGINT NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'UNRECONCILED',

    CONSTRAINT "finance_bank_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_budgets" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "amount" BIGINT NOT NULL,
    "policy" TEXT NOT NULL DEFAULT 'WARN',

    CONSTRAINT "finance_budgets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_assets" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceDocumentId" TEXT,
    "acquiredAt" TIMESTAMP(3) NOT NULL,
    "cost" BIGINT NOT NULL,
    "residual" BIGINT NOT NULL DEFAULT 0,
    "lifeMonths" INTEGER NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'STRAIGHT_LINE',
    "accumulated" BIGINT NOT NULL DEFAULT 0,
    "department" TEXT,
    "location" TEXT,
    "serialNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "finance_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_contracts" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "partyId" TEXT,
    "name" TEXT NOT NULL,
    "annualAmount" BIGINT NOT NULL,
    "renewalAt" TIMESTAMP(3) NOT NULL,
    "noticeDays" INTEGER NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "finance_contracts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_scenarios" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assumptions" JSONB NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_scenarios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_close_tasks" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "dueAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "evidence" TEXT,

    CONSTRAINT "finance_close_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_timeline" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_timeline_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "approval_policies" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "minAmount" BIGINT NOT NULL DEFAULT 0,
    "maxAmount" BIGINT,
    "currency" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "stages" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "approval_policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "approval_instances" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "subjectVersion" INTEGER NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "policyVersion" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "currentStage" INTEGER NOT NULL DEFAULT 0,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_instances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "approval_steps" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "stage" INTEGER NOT NULL,
    "approverUserId" TEXT NOT NULL,
    "actedByUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "actedAt" TIMESTAMP(3),

    CONSTRAINT "approval_steps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "approval_delegations" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_delegations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_payment_runs" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "creatorUserId" TEXT NOT NULL,
    "approverUserId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "total" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_payment_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_payment_items" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "bankVersionId" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,

    CONSTRAINT "finance_payment_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "finance_entities_organisationId_code_key" ON "finance_entities"("organisationId", "code");

CREATE UNIQUE INDEX "finance_entities_id_organisationId_key" ON "finance_entities"("id", "organisationId");

CREATE UNIQUE INDEX "finance_accounts_entityId_code_key" ON "finance_accounts"("entityId", "code");

CREATE UNIQUE INDEX "finance_accounts_id_organisationId_key" ON "finance_accounts"("id", "organisationId");

CREATE UNIQUE INDEX "finance_periods_entityId_startAt_key" ON "finance_periods"("entityId", "startAt");

CREATE UNIQUE INDEX "finance_periods_id_organisationId_key" ON "finance_periods"("id", "organisationId");

CREATE UNIQUE INDEX "finance_journals_reversalOfId_key" ON "finance_journals"("reversalOfId");

CREATE INDEX "finance_journals_entityId_accountingDate_status_idx" ON "finance_journals"("entityId", "accountingDate", "status");

CREATE UNIQUE INDEX "finance_journals_organisationId_sourceKey_key" ON "finance_journals"("organisationId", "sourceKey");

CREATE UNIQUE INDEX "finance_journals_organisationId_reference_key" ON "finance_journals"("organisationId", "reference");

CREATE UNIQUE INDEX "finance_journals_id_organisationId_key" ON "finance_journals"("id", "organisationId");

CREATE INDEX "finance_journal_lines_organisationId_accountId_idx" ON "finance_journal_lines"("organisationId", "accountId");

CREATE UNIQUE INDEX "finance_suppliers_organisationId_partyId_key" ON "finance_suppliers"("organisationId", "partyId");

CREATE UNIQUE INDEX "finance_suppliers_id_organisationId_key" ON "finance_suppliers"("id", "organisationId");

CREATE INDEX "finance_bank_versions_organisationId_supplierId_status_idx" ON "finance_bank_versions"("organisationId", "supplierId", "status");

CREATE UNIQUE INDEX "finance_bank_versions_id_organisationId_key" ON "finance_bank_versions"("id", "organisationId");

CREATE INDEX "finance_documents_organisationId_kind_status_dueAt_idx" ON "finance_documents"("organisationId", "kind", "status", "dueAt");

CREATE UNIQUE INDEX "finance_documents_organisationId_reference_key" ON "finance_documents"("organisationId", "reference");

CREATE UNIQUE INDEX "finance_documents_organisationId_duplicateKey_key" ON "finance_documents"("organisationId", "duplicateKey");

CREATE UNIQUE INDEX "finance_documents_id_organisationId_key" ON "finance_documents"("id", "organisationId");

CREATE UNIQUE INDEX "finance_document_lines_documentId_number_key" ON "finance_document_lines"("documentId", "number");

CREATE UNIQUE INDEX "finance_settlements_documentId_bankTransactionId_key" ON "finance_settlements"("documentId", "bankTransactionId");

CREATE UNIQUE INDEX "finance_banks_id_organisationId_key" ON "finance_banks"("id", "organisationId");

CREATE UNIQUE INDEX "finance_bank_transactions_bankId_externalId_key" ON "finance_bank_transactions"("bankId", "externalId");

CREATE UNIQUE INDEX "finance_bank_transactions_id_organisationId_key" ON "finance_bank_transactions"("id", "organisationId");

CREATE INDEX "finance_budgets_organisationId_entityId_idx" ON "finance_budgets"("organisationId", "entityId");

CREATE UNIQUE INDEX "finance_close_tasks_periodId_name_key" ON "finance_close_tasks"("periodId", "name");

CREATE INDEX "finance_timeline_organisationId_documentId_createdAt_idx" ON "finance_timeline"("organisationId", "documentId", "createdAt");

CREATE INDEX "approval_policies_organisationId_subjectType_idx" ON "approval_policies"("organisationId", "subjectType");

CREATE UNIQUE INDEX "approval_instances_organisationId_subjectType_subjectId_sub_key" ON "approval_instances"("organisationId", "subjectType", "subjectId", "subjectVersion");

CREATE UNIQUE INDEX "approval_instances_id_organisationId_key" ON "approval_instances"("id", "organisationId");

CREATE UNIQUE INDEX "approval_steps_instanceId_stage_approverUserId_key" ON "approval_steps"("instanceId", "stage", "approverUserId");

CREATE INDEX "approval_delegations_organisationId_fromUserId_startAt_endA_idx" ON "approval_delegations"("organisationId", "fromUserId", "startAt", "endAt");

CREATE UNIQUE INDEX "finance_payment_runs_organisationId_reference_key" ON "finance_payment_runs"("organisationId", "reference");

CREATE UNIQUE INDEX "finance_payment_runs_id_organisationId_key" ON "finance_payment_runs"("id", "organisationId");

CREATE UNIQUE INDEX "finance_payment_items_runId_documentId_key" ON "finance_payment_items"("runId", "documentId");

ALTER TABLE "finance_accounts" ADD CONSTRAINT "finance_accounts_entityId_organisationId_fkey" FOREIGN KEY ("entityId", "organisationId") REFERENCES "finance_entities"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "finance_periods" ADD CONSTRAINT "finance_periods_entityId_organisationId_fkey" FOREIGN KEY ("entityId", "organisationId") REFERENCES "finance_entities"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "finance_journals" ADD CONSTRAINT "finance_journals_entityId_organisationId_fkey" FOREIGN KEY ("entityId", "organisationId") REFERENCES "finance_entities"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "finance_journals" ADD CONSTRAINT "finance_journals_periodId_organisationId_fkey" FOREIGN KEY ("periodId", "organisationId") REFERENCES "finance_periods"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "finance_journal_lines" ADD CONSTRAINT "finance_journal_lines_journalId_organisationId_fkey" FOREIGN KEY ("journalId", "organisationId") REFERENCES "finance_journals"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "finance_journal_lines" ADD CONSTRAINT "finance_journal_lines_accountId_organisationId_fkey" FOREIGN KEY ("accountId", "organisationId") REFERENCES "finance_accounts"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "finance_suppliers" ADD CONSTRAINT "finance_suppliers_partyId_organisationId_fkey" FOREIGN KEY ("partyId", "organisationId") REFERENCES "parties"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "finance_bank_versions" ADD CONSTRAINT "finance_bank_versions_supplierId_organisationId_fkey" FOREIGN KEY ("supplierId", "organisationId") REFERENCES "finance_suppliers"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "finance_documents" ADD CONSTRAINT "finance_documents_entityId_organisationId_fkey" FOREIGN KEY ("entityId", "organisationId") REFERENCES "finance_entities"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "finance_documents" ADD CONSTRAINT "finance_documents_partyId_organisationId_fkey" FOREIGN KEY ("partyId", "organisationId") REFERENCES "parties"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "finance_documents" ADD CONSTRAINT "finance_documents_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "finance_documents" ADD CONSTRAINT "finance_documents_journalId_organisationId_fkey" FOREIGN KEY ("journalId", "organisationId") REFERENCES "finance_journals"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "finance_documents" ADD CONSTRAINT "finance_documents_sourceId_organisationId_fkey" FOREIGN KEY ("sourceId", "organisationId") REFERENCES "finance_documents"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "finance_document_lines" ADD CONSTRAINT "finance_document_lines_documentId_organisationId_fkey" FOREIGN KEY ("documentId", "organisationId") REFERENCES "finance_documents"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "finance_document_lines" ADD CONSTRAINT "finance_document_lines_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "finance_settlements" ADD CONSTRAINT "finance_settlements_documentId_organisationId_fkey" FOREIGN KEY ("documentId", "organisationId") REFERENCES "finance_documents"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "finance_settlements" ADD CONSTRAINT "finance_settlements_bankTransactionId_organisationId_fkey" FOREIGN KEY ("bankTransactionId", "organisationId") REFERENCES "finance_bank_transactions"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "finance_banks" ADD CONSTRAINT "finance_banks_entityId_organisationId_fkey" FOREIGN KEY ("entityId", "organisationId") REFERENCES "finance_entities"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "finance_banks" ADD CONSTRAINT "finance_banks_accountId_organisationId_fkey" FOREIGN KEY ("accountId", "organisationId") REFERENCES "finance_accounts"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "finance_bank_transactions" ADD CONSTRAINT "finance_bank_transactions_bankId_organisationId_fkey" FOREIGN KEY ("bankId", "organisationId") REFERENCES "finance_banks"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "finance_budgets" ADD CONSTRAINT "finance_budgets_entityId_organisationId_fkey" FOREIGN KEY ("entityId", "organisationId") REFERENCES "finance_entities"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "finance_assets" ADD CONSTRAINT "finance_assets_entityId_organisationId_fkey" FOREIGN KEY ("entityId", "organisationId") REFERENCES "finance_entities"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "finance_contracts" ADD CONSTRAINT "finance_contracts_entityId_organisationId_fkey" FOREIGN KEY ("entityId", "organisationId") REFERENCES "finance_entities"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "finance_scenarios" ADD CONSTRAINT "finance_scenarios_entityId_organisationId_fkey" FOREIGN KEY ("entityId", "organisationId") REFERENCES "finance_entities"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "finance_close_tasks" ADD CONSTRAINT "finance_close_tasks_entityId_organisationId_fkey" FOREIGN KEY ("entityId", "organisationId") REFERENCES "finance_entities"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "finance_close_tasks" ADD CONSTRAINT "finance_close_tasks_periodId_organisationId_fkey" FOREIGN KEY ("periodId", "organisationId") REFERENCES "finance_periods"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "finance_timeline" ADD CONSTRAINT "finance_timeline_documentId_organisationId_fkey" FOREIGN KEY ("documentId", "organisationId") REFERENCES "finance_documents"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_instanceId_organisationId_fkey" FOREIGN KEY ("instanceId", "organisationId") REFERENCES "approval_instances"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "finance_payment_items" ADD CONSTRAINT "finance_payment_items_runId_organisationId_fkey" FOREIGN KEY ("runId", "organisationId") REFERENCES "finance_payment_runs"("id", "organisationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Financial history is immutable even for callers bypassing application commands.
ALTER TABLE finance_journal_lines ADD CONSTRAINT finance_line_amounts CHECK (debit >= 0 AND credit >= 0 AND NOT (debit > 0 AND credit > 0));
ALTER TABLE finance_documents ADD CONSTRAINT finance_document_amounts CHECK (net >= 0 AND tax >= 0 AND gross = net + tax AND settled >= 0 AND settled <= gross);
ALTER TABLE finance_document_lines ADD CONSTRAINT finance_document_line_amounts CHECK (quantity > 0 AND "damagedQuantity" >= 0 AND "damagedQuantity" <= quantity AND "unitPrice" >= 0 AND net >= 0 AND tax >= 0);
ALTER TABLE finance_periods ADD CONSTRAINT finance_period_dates CHECK ("startAt" < "endAt" AND state IN ('OPEN','SOFT_CLOSED','CLOSED','LOCKED'));
ALTER TABLE finance_assets ADD CONSTRAINT finance_asset_values CHECK (cost > 0 AND residual >= 0 AND residual < cost AND "lifeMonths" > 0 AND accumulated >= 0 AND accumulated <= cost - residual);
ALTER TABLE finance_bank_versions ADD CONSTRAINT finance_bank_independent_verification CHECK ("verifierUserId" IS NULL OR "verifierUserId" <> "requesterUserId");
ALTER TABLE finance_suppliers ADD CONSTRAINT finance_supplier_independent_approval CHECK ("approvedByUserId" IS NULL OR "approvedByUserId" <> "creatorUserId");
ALTER TABLE finance_payment_runs ADD CONSTRAINT finance_payment_independent_approval CHECK ("approverUserId" IS NULL OR "approverUserId" <> "creatorUserId");
ALTER TABLE finance_entities ADD CONSTRAINT finance_entity_organisation_fkey FOREIGN KEY ("organisationId") REFERENCES organisations(id) ON DELETE RESTRICT;
ALTER TABLE approval_instances ADD CONSTRAINT approval_instance_organisation_fkey FOREIGN KEY ("organisationId") REFERENCES organisations(id) ON DELETE RESTRICT;
ALTER TABLE approval_policies ADD CONSTRAINT approval_policy_organisation_fkey FOREIGN KEY ("organisationId") REFERENCES organisations(id) ON DELETE RESTRICT;
ALTER TABLE approval_delegations ADD CONSTRAINT approval_delegation_organisation_fkey FOREIGN KEY ("organisationId") REFERENCES organisations(id) ON DELETE RESTRICT;
CREATE FUNCTION atlas_finance_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
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
CREATE TRIGGER finance_journal_immutable BEFORE UPDATE OR DELETE ON finance_journals FOR EACH ROW EXECUTE FUNCTION atlas_finance_immutable();
CREATE TRIGGER finance_document_immutable BEFORE UPDATE OR DELETE ON finance_documents FOR EACH ROW EXECUTE FUNCTION atlas_finance_immutable();
CREATE TRIGGER finance_bank_version_immutable BEFORE UPDATE OR DELETE ON finance_bank_versions FOR EACH ROW EXECUTE FUNCTION atlas_finance_immutable();
CREATE FUNCTION atlas_finance_line_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE parent_status text;
BEGIN
 IF TG_TABLE_NAME = 'finance_journal_lines' THEN
  IF TG_OP <> 'INSERT' THEN SELECT status INTO parent_status FROM finance_journals WHERE id = OLD."journalId"; IF parent_status = 'POSTED' THEN RAISE EXCEPTION 'Posted journal lines are immutable'; END IF; END IF;
  IF TG_OP <> 'DELETE' THEN SELECT status INTO parent_status FROM finance_journals WHERE id = NEW."journalId"; IF parent_status = 'POSTED' THEN RAISE EXCEPTION 'Cannot append to a posted journal'; END IF; END IF;
 ELSE
  IF TG_OP <> 'INSERT' THEN SELECT status INTO parent_status FROM finance_documents WHERE id = OLD."documentId"; IF parent_status NOT IN ('DRAFT','NEEDS_INFORMATION','REJECTED') THEN RAISE EXCEPTION 'Approved/submitted document lines are locked'; END IF; END IF;
  IF TG_OP <> 'DELETE' THEN SELECT status INTO parent_status FROM finance_documents WHERE id = NEW."documentId"; IF parent_status NOT IN ('DRAFT','NEEDS_INFORMATION','REJECTED') THEN RAISE EXCEPTION 'Cannot append to a locked document'; END IF; END IF;
 END IF;
 IF TG_OP = 'DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END; $$;
CREATE TRIGGER finance_journal_lines_immutable BEFORE INSERT OR UPDATE OR DELETE ON finance_journal_lines FOR EACH ROW EXECUTE FUNCTION atlas_finance_line_immutable();
CREATE TRIGGER finance_document_lines_immutable BEFORE INSERT OR UPDATE OR DELETE ON finance_document_lines FOR EACH ROW EXECUTE FUNCTION atlas_finance_line_immutable();
CREATE FUNCTION atlas_finance_validate_posting() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE d bigint; c bigint; n integer; state text; period_entity text;
BEGIN
 IF NEW.status = 'POSTED' THEN
  SELECT SUM(debit), SUM(credit), COUNT(*) INTO d,c,n FROM finance_journal_lines WHERE "journalId"=NEW.id;
  IF n < 2 OR d IS NULL OR d = 0 OR d <> c THEN RAISE EXCEPTION 'Posted journal must balance exactly'; END IF;
  SELECT p.state,p."entityId" INTO state,period_entity FROM finance_periods p WHERE p.id=NEW."periodId" AND NEW."accountingDate" BETWEEN p."startAt" AND p."endAt";
  IF period_entity IS DISTINCT FROM NEW."entityId" OR NOT (state='OPEN' OR (state='SOFT_CLOSED' AND NEW."sourceType"='AP_INVOICE')) THEN RAISE EXCEPTION 'Posting outside permitted entity/period'; END IF;
  IF EXISTS (SELECT 1 FROM finance_journal_lines l JOIN finance_accounts a ON a.id=l."accountId" WHERE l."journalId"=NEW.id AND (a."entityId"<>NEW."entityId" OR NOT a.active)) THEN RAISE EXCEPTION 'Posting account entity is invalid'; END IF;
 END IF; RETURN NULL;
END; $$;
CREATE CONSTRAINT TRIGGER finance_journal_balanced AFTER INSERT OR UPDATE ON finance_journals DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION atlas_finance_validate_posting();
CREATE FUNCTION atlas_finance_append_only() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Financial timeline and settlements are append-only'; END; $$;
CREATE TRIGGER finance_timeline_append_only BEFORE UPDATE OR DELETE ON finance_timeline FOR EACH ROW EXECUTE FUNCTION atlas_finance_append_only();
CREATE TRIGGER finance_settlement_append_only BEFORE UPDATE OR DELETE ON finance_settlements FOR EACH ROW EXECUTE FUNCTION atlas_finance_append_only();

CREATE TABLE finance_attachments (
 id text PRIMARY KEY, "organisationId" text NOT NULL, "documentId" text NOT NULL,
 name text NOT NULL, "mimeType" text NOT NULL, checksum text NOT NULL,
 content bytea NOT NULL, "uploadedByUserId" text NOT NULL,
 "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT finance_attachment_document_fkey FOREIGN KEY("documentId","organisationId") REFERENCES finance_documents(id,"organisationId") ON DELETE RESTRICT,
 CONSTRAINT finance_attachment_size CHECK (octet_length(content) <= 2097152)
);
CREATE UNIQUE INDEX finance_attachments_documentId_checksum_key ON finance_attachments("documentId",checksum);
CREATE INDEX finance_attachments_organisationId_documentId_idx ON finance_attachments("organisationId","documentId");
CREATE TRIGGER finance_attachments_append_only BEFORE UPDATE OR DELETE ON finance_attachments FOR EACH ROW EXECUTE FUNCTION atlas_finance_append_only();
ALTER TABLE finance_documents ADD COLUMN "expenseClaimId" text;
CREATE UNIQUE INDEX finance_documents_organisationId_expenseClaimId_key ON finance_documents("organisationId","expenseClaimId");
