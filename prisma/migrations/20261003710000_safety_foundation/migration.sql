-- Atlas Safety foundation. Workplace risk, incidents, control of work and assurance.
-- Software does not make an organisation compliant.
CREATE TABLE "safety_profiles" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "operatingProfile" TEXT NOT NULL DEFAULT 'OFFICE',
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "jurisdiction" TEXT NOT NULL DEFAULT 'GB',
    "anonymousReports" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "safety_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_counters" (
    "organisationId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "safety_counters_pkey" PRIMARY KEY ("organisationId","kind")
);

-- CreateTable
CREATE TABLE "safety_places" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "parentId" TEXT,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,

    CONSTRAINT "safety_places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_matrices" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "safety_matrices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_risks" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "placeId" TEXT,
    "ownerUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "safety_risks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_assessments" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "hazard" TEXT NOT NULL,
    "whoHarmed" TEXT NOT NULL,
    "howHarmed" TEXT NOT NULL,
    "existingControls" TEXT NOT NULL DEFAULT '',
    "initialLikelihood" INTEGER,
    "initialSeverity" INTEGER,
    "initialRating" TEXT,
    "initialExplanation" TEXT,
    "residualLikelihood" INTEGER,
    "residualSeverity" INTEGER,
    "residualRating" TEXT,
    "residualExplanation" TEXT,
    "responsibleUserId" TEXT,
    "targetDate" TIMESTAMP(3),
    "reviewDate" TIMESTAMP(3),
    "authorUserId" TEXT NOT NULL,
    "reviewerUserId" TEXT,
    "approverUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "changeReason" TEXT,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "evidenceNote" TEXT,
    "matrixId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "safety_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_controls" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "hierarchy" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "inPlace" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "safety_controls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_actions" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "ownerUserId" TEXT,
    "dueDate" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "evidence" TEXT,
    "capaStage" TEXT,
    "verifiedByUserId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verificationNote" TEXT,
    "effectivenessDue" TIMESTAMP(3),
    "effectivenessNote" TEXT,
    "estimatedCostMinor" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "safety_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_incidents" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REPORTED',
    "summary" TEXT NOT NULL,
    "narrative" TEXT,
    "whereLabel" TEXT,
    "placeId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "reportedByUserId" TEXT,
    "involvedLabel" TEXT,
    "immediateDanger" BOOLEAN NOT NULL DEFAULT false,
    "anyoneStillAtRisk" BOOLEAN,
    "isolationRequired" BOOLEAN,
    "areaClosureRequired" BOOLEAN,
    "firstAidRequired" BOOLEAN,
    "emergencyServicesRequired" BOOLEAN,
    "managementNotified" BOOLEAN,
    "actualConsequence" TEXT NOT NULL DEFAULT 'NONE',
    "potentialConsequence" TEXT NOT NULL DEFAULT 'NONE',
    "evidenceNote" TEXT,
    "confidential" BOOLEAN NOT NULL DEFAULT false,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "commitment" TEXT NOT NULL DEFAULT 'COMMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "safety_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_investigations" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'SIMPLE',
    "timeline" TEXT,
    "immediateCauses" TEXT,
    "underlyingCauses" TEXT,
    "rootCause" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "leadUserId" TEXT,

    CONSTRAINT "safety_investigations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_causes" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "statement" TEXT NOT NULL,

    CONSTRAINT "safety_causes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_riddor_decisions" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "workRelated" BOOLEAN,
    "personClass" TEXT,
    "outcome" TEXT,
    "potentialCategory" TEXT,
    "decision" TEXT NOT NULL DEFAULT 'PENDING',
    "rationale" TEXT,
    "responsibleUserId" TEXT,
    "decidedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "reportDate" TIMESTAMP(3),
    "reportingMethod" TEXT,
    "submissionReference" TEXT,
    "reminderDue" TIMESTAMP(3),
    "ruleVersion" TEXT,
    "guidance" TEXT,

    CONSTRAINT "safety_riddor_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_review_requests" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "safety_review_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_inspection_templates" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cadence" TEXT NOT NULL DEFAULT 'WEEKLY',
    "questions" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "safety_inspection_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_inspections" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "placeId" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DUE',
    "inspectorUserId" TEXT,
    "responses" JSONB NOT NULL DEFAULT '[]',
    "commitment" TEXT NOT NULL DEFAULT 'COMMITTED',

    CONSTRAINT "safety_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_audits" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scope" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "auditorUserId" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,

    CONSTRAINT "safety_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_findings" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "statement" TEXT NOT NULL,

    CONSTRAINT "safety_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_permits" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "placeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "requestedByUserId" TEXT NOT NULL,
    "authorisedByUserId" TEXT,
    "contractorPartyId" TEXT,
    "hazards" TEXT,
    "controlsConfirmed" TEXT,
    "isolationRequired" BOOLEAN NOT NULL DEFAULT false,
    "extensionCount" INTEGER NOT NULL DEFAULT 0,
    "suspendedReason" TEXT,
    "handbackAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "conditionsChanged" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "safety_permits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_isolations" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "assetLabel" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "energyTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "permitId" TEXT,
    "appliedByUserId" TEXT,
    "verifiedByUserId" TEXT,
    "removedByUserId" TEXT,
    "appliedAt" TIMESTAMP(3),
    "clearedAt" TIMESTAMP(3),

    CONSTRAINT "safety_isolations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_isolation_locks" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "isolationId" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "appliedByUserId" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),
    "removedByUserId" TEXT,

    CONSTRAINT "safety_isolation_locks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_holds" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetLabel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "reason" TEXT NOT NULL,
    "placedByUserId" TEXT NOT NULL,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedByUserId" TEXT,
    "releasedAt" TIMESTAMP(3),
    "repairComplete" BOOLEAN NOT NULL DEFAULT false,
    "inspectionComplete" BOOLEAN NOT NULL DEFAULT false,
    "safetyVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationNote" TEXT,
    "overrideReason" TEXT,
    "overrideByUserId" TEXT,
    "overrideScope" TEXT,
    "overrideApprovedByUserId" TEXT,
    "overrideExpiresAt" TIMESTAMP(3),
    "maintenanceActionId" TEXT,

    CONSTRAINT "safety_holds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_statutory_checks" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "assetLabel" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "safeWorkingLoad" TEXT,
    "examiner" TEXT,
    "scheme" TEXT,
    "lastExaminedAt" TIMESTAMP(3),
    "nextDueAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'CURRENT',
    "seriousDefect" BOOLEAN NOT NULL DEFAULT false,
    "defectSummary" TEXT,
    "restriction" TEXT,
    "reportNote" TEXT,
    "overall" TEXT,
    "checklist" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "safety_statutory_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_substances" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "tradeName" TEXT NOT NULL,
    "manufacturer" TEXT,
    "useSummary" TEXT,
    "placeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "signalWord" TEXT,
    "hazardStatements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "precautionaryStatements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pictograms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "classifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "storageRequirements" TEXT,
    "ppe" TEXT,
    "emergencyResponse" TEXT,
    "disposalGuidance" TEXT,
    "exposureLimits" TEXT,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "safety_substances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_sds" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "substanceId" TEXT NOT NULL,
    "versionLabel" TEXT NOT NULL,
    "supplier" TEXT,
    "issueDate" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supersededAt" TIMESTAMP(3),
    "language" TEXT NOT NULL DEFAULT 'en',
    "note" TEXT,

    CONSTRAINT "safety_sds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_coshh_assessments" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "substanceId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "task" TEXT NOT NULL,
    "quantity" TEXT,
    "frequency" TEXT,
    "duration" TEXT,
    "route" TEXT,
    "peopleExposed" TEXT,
    "hazard" TEXT,
    "controls" TEXT,
    "engineeringControls" TEXT,
    "lev" TEXT,
    "ppe" TEXT,
    "storage" TEXT,
    "spillResponse" TEXT,
    "waste" TEXT,
    "emergencyAction" TEXT,
    "exposureLimits" TEXT,
    "healthSurveillance" BOOLEAN NOT NULL DEFAULT false,
    "residualRisk" TEXT,
    "canEliminate" BOOLEAN,
    "canSubstitute" BOOLEAN,
    "substitutionReason" TEXT,
    "reviewDate" TIMESTAMP(3),
    "authorUserId" TEXT NOT NULL,

    CONSTRAINT "safety_coshh_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_competences" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3),
    "evidenceNote" TEXT,

    CONSTRAINT "safety_competences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_documents" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "body" TEXT,
    "effectiveFrom" TIMESTAMP(3),
    "reviewDate" TIMESTAMP(3),
    "supersedesId" TEXT,
    "requiresAcknowledgement" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "safety_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_acknowledgements" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "safety_acknowledgements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_obligations" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "requirement" TEXT NOT NULL,
    "applicable" BOOLEAN NOT NULL DEFAULT true,
    "responsibleUserId" TEXT,
    "evidence" TEXT,
    "frequency" TEXT,
    "nextDue" TIMESTAMP(3),
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TO_CONFIRM',
    "ruleVersion" TEXT,

    CONSTRAINT "safety_obligations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_changes" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "impact" TEXT,
    "proposedByUserId" TEXT NOT NULL,
    "approvedByUserId" TEXT,
    "implementedAt" TIMESTAMP(3),
    "reviewDue" TIMESTAMP(3),

    CONSTRAINT "safety_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_links" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "label" TEXT,

    CONSTRAINT "safety_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_records" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "placeId" TEXT,
    "ownerUserId" TEXT,
    "dueAt" TIMESTAMP(3),
    "payload" JSONB NOT NULL DEFAULT '{}',
    "sensitive" BOOLEAN NOT NULL DEFAULT false,
    "commitment" TEXT NOT NULL DEFAULT 'COMMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "safety_records_pkey" PRIMARY KEY ("id")
);


CREATE UNIQUE INDEX "safety_profiles_organisationId_key" ON "safety_profiles"("organisationId");
CREATE INDEX "safety_places_organisationId_kind_idx" ON "safety_places"("organisationId", "kind");
CREATE INDEX "safety_matrices_organisationId_active_idx" ON "safety_matrices"("organisationId", "active");
CREATE INDEX "safety_risks_organisationId_status_idx" ON "safety_risks"("organisationId", "status");
CREATE UNIQUE INDEX "safety_risks_organisationId_reference_key" ON "safety_risks"("organisationId", "reference");
CREATE INDEX "safety_assessments_organisationId_status_reviewDate_idx" ON "safety_assessments"("organisationId", "status", "reviewDate");
CREATE UNIQUE INDEX "safety_assessments_riskId_revision_key" ON "safety_assessments"("riskId", "revision");
CREATE INDEX "safety_controls_organisationId_assessmentId_idx" ON "safety_controls"("organisationId", "assessmentId");
CREATE INDEX "safety_actions_organisationId_status_dueDate_idx" ON "safety_actions"("organisationId", "status", "dueDate");
CREATE INDEX "safety_actions_organisationId_sourceType_sourceId_idx" ON "safety_actions"("organisationId", "sourceType", "sourceId");
CREATE UNIQUE INDEX "safety_actions_organisationId_reference_key" ON "safety_actions"("organisationId", "reference");
CREATE INDEX "safety_incidents_organisationId_status_occurredAt_idx" ON "safety_incidents"("organisationId", "status", "occurredAt");
CREATE INDEX "safety_incidents_organisationId_confidential_idx" ON "safety_incidents"("organisationId", "confidential");
CREATE UNIQUE INDEX "safety_incidents_organisationId_reference_key" ON "safety_incidents"("organisationId", "reference");
CREATE UNIQUE INDEX "safety_investigations_incidentId_key" ON "safety_investigations"("incidentId");
CREATE INDEX "safety_causes_organisationId_investigationId_idx" ON "safety_causes"("organisationId", "investigationId");
CREATE UNIQUE INDEX "safety_riddor_decisions_incidentId_key" ON "safety_riddor_decisions"("incidentId");
CREATE INDEX "safety_review_requests_organisationId_status_idx" ON "safety_review_requests"("organisationId", "status");
CREATE INDEX "safety_inspection_templates_organisationId_active_idx" ON "safety_inspection_templates"("organisationId", "active");
CREATE INDEX "safety_inspections_organisationId_status_scheduledFor_idx" ON "safety_inspections"("organisationId", "status", "scheduledFor");
CREATE UNIQUE INDEX "safety_inspections_organisationId_reference_key" ON "safety_inspections"("organisationId", "reference");
CREATE INDEX "safety_audits_organisationId_status_idx" ON "safety_audits"("organisationId", "status");
CREATE UNIQUE INDEX "safety_audits_organisationId_reference_key" ON "safety_audits"("organisationId", "reference");
CREATE INDEX "safety_findings_organisationId_auditId_idx" ON "safety_findings"("organisationId", "auditId");
CREATE INDEX "safety_permits_organisationId_status_expiresAt_idx" ON "safety_permits"("organisationId", "status", "expiresAt");
CREATE UNIQUE INDEX "safety_permits_organisationId_reference_key" ON "safety_permits"("organisationId", "reference");
CREATE INDEX "safety_isolations_organisationId_status_idx" ON "safety_isolations"("organisationId", "status");
CREATE UNIQUE INDEX "safety_isolations_organisationId_reference_key" ON "safety_isolations"("organisationId", "reference");
CREATE INDEX "safety_isolation_locks_organisationId_isolationId_idx" ON "safety_isolation_locks"("organisationId", "isolationId");
CREATE INDEX "safety_holds_organisationId_status_targetType_targetId_idx" ON "safety_holds"("organisationId", "status", "targetType", "targetId");
CREATE UNIQUE INDEX "safety_holds_organisationId_reference_key" ON "safety_holds"("organisationId", "reference");
CREATE INDEX "safety_statutory_checks_organisationId_kind_nextDueAt_idx" ON "safety_statutory_checks"("organisationId", "kind", "nextDueAt");
CREATE UNIQUE INDEX "safety_statutory_checks_organisationId_reference_key" ON "safety_statutory_checks"("organisationId", "reference");
CREATE INDEX "safety_substances_organisationId_status_idx" ON "safety_substances"("organisationId", "status");
CREATE UNIQUE INDEX "safety_substances_organisationId_reference_key" ON "safety_substances"("organisationId", "reference");
CREATE INDEX "safety_sds_organisationId_substanceId_idx" ON "safety_sds"("organisationId", "substanceId");
CREATE INDEX "safety_coshh_assessments_organisationId_reviewDate_idx" ON "safety_coshh_assessments"("organisationId", "reviewDate");
CREATE UNIQUE INDEX "safety_coshh_assessments_substanceId_revision_key" ON "safety_coshh_assessments"("substanceId", "revision");
CREATE INDEX "safety_competences_organisationId_key_expiresAt_idx" ON "safety_competences"("organisationId", "key", "expiresAt");
CREATE UNIQUE INDEX "safety_competences_organisationId_employeeId_key_key" ON "safety_competences"("organisationId", "employeeId", "key");
CREATE INDEX "safety_documents_organisationId_status_idx" ON "safety_documents"("organisationId", "status");
CREATE UNIQUE INDEX "safety_documents_organisationId_reference_revision_key" ON "safety_documents"("organisationId", "reference", "revision");
CREATE UNIQUE INDEX "safety_acknowledgements_documentId_userId_key" ON "safety_acknowledgements"("documentId", "userId");
CREATE INDEX "safety_obligations_organisationId_status_nextDue_idx" ON "safety_obligations"("organisationId", "status", "nextDue");
CREATE INDEX "safety_changes_organisationId_status_idx" ON "safety_changes"("organisationId", "status");
CREATE UNIQUE INDEX "safety_changes_organisationId_reference_key" ON "safety_changes"("organisationId", "reference");
CREATE INDEX "safety_links_organisationId_sourceType_sourceId_idx" ON "safety_links"("organisationId", "sourceType", "sourceId");
CREATE INDEX "safety_links_organisationId_targetType_targetId_idx" ON "safety_links"("organisationId", "targetType", "targetId");
CREATE INDEX "safety_records_organisationId_kind_status_idx" ON "safety_records"("organisationId", "kind", "status");
CREATE INDEX "safety_records_organisationId_sensitive_idx" ON "safety_records"("organisationId", "sensitive");
CREATE UNIQUE INDEX "safety_records_organisationId_reference_key" ON "safety_records"("organisationId", "reference");

ALTER TABLE "safety_profiles" ADD CONSTRAINT "safety_profiles_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_counters" ADD CONSTRAINT "safety_counters_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_places" ADD CONSTRAINT "safety_places_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_places" ADD CONSTRAINT "safety_places_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "safety_places"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "safety_matrices" ADD CONSTRAINT "safety_matrices_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_risks" ADD CONSTRAINT "safety_risks_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_risks" ADD CONSTRAINT "safety_risks_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "safety_places"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "safety_assessments" ADD CONSTRAINT "safety_assessments_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_assessments" ADD CONSTRAINT "safety_assessments_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "safety_risks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_controls" ADD CONSTRAINT "safety_controls_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_controls" ADD CONSTRAINT "safety_controls_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "safety_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_actions" ADD CONSTRAINT "safety_actions_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_incidents" ADD CONSTRAINT "safety_incidents_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_incidents" ADD CONSTRAINT "safety_incidents_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "safety_places"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "safety_investigations" ADD CONSTRAINT "safety_investigations_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_investigations" ADD CONSTRAINT "safety_investigations_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "safety_incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_causes" ADD CONSTRAINT "safety_causes_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_causes" ADD CONSTRAINT "safety_causes_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "safety_investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_riddor_decisions" ADD CONSTRAINT "safety_riddor_decisions_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_riddor_decisions" ADD CONSTRAINT "safety_riddor_decisions_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "safety_incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_review_requests" ADD CONSTRAINT "safety_review_requests_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_review_requests" ADD CONSTRAINT "safety_review_requests_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "safety_risks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_inspection_templates" ADD CONSTRAINT "safety_inspection_templates_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_inspections" ADD CONSTRAINT "safety_inspections_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_inspections" ADD CONSTRAINT "safety_inspections_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "safety_inspection_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "safety_audits" ADD CONSTRAINT "safety_audits_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_findings" ADD CONSTRAINT "safety_findings_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_findings" ADD CONSTRAINT "safety_findings_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "safety_audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_permits" ADD CONSTRAINT "safety_permits_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_permits" ADD CONSTRAINT "safety_permits_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "safety_places"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "safety_isolations" ADD CONSTRAINT "safety_isolations_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_isolations" ADD CONSTRAINT "safety_isolations_permitId_fkey" FOREIGN KEY ("permitId") REFERENCES "safety_permits"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "safety_isolation_locks" ADD CONSTRAINT "safety_isolation_locks_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_isolation_locks" ADD CONSTRAINT "safety_isolation_locks_isolationId_fkey" FOREIGN KEY ("isolationId") REFERENCES "safety_isolations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_holds" ADD CONSTRAINT "safety_holds_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_statutory_checks" ADD CONSTRAINT "safety_statutory_checks_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_substances" ADD CONSTRAINT "safety_substances_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_substances" ADD CONSTRAINT "safety_substances_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "safety_places"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "safety_sds" ADD CONSTRAINT "safety_sds_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_sds" ADD CONSTRAINT "safety_sds_substanceId_fkey" FOREIGN KEY ("substanceId") REFERENCES "safety_substances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_coshh_assessments" ADD CONSTRAINT "safety_coshh_assessments_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_coshh_assessments" ADD CONSTRAINT "safety_coshh_assessments_substanceId_fkey" FOREIGN KEY ("substanceId") REFERENCES "safety_substances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_competences" ADD CONSTRAINT "safety_competences_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_documents" ADD CONSTRAINT "safety_documents_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_documents" ADD CONSTRAINT "safety_documents_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "safety_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "safety_acknowledgements" ADD CONSTRAINT "safety_acknowledgements_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_acknowledgements" ADD CONSTRAINT "safety_acknowledgements_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "safety_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_obligations" ADD CONSTRAINT "safety_obligations_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_changes" ADD CONSTRAINT "safety_changes_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_links" ADD CONSTRAINT "safety_links_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "safety_records" ADD CONSTRAINT "safety_records_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
