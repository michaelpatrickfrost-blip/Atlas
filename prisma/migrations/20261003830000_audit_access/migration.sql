-- Company switch and area grants for Audit. The recorded changes stay in audit_entries.
ALTER TABLE "organisations" ADD COLUMN "auditAccess" JSONB NOT NULL DEFAULT '{}';
