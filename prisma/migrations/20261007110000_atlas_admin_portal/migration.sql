-- Existing independent platform grants remain Owners. Customer roles grant no platform access.
ALTER TABLE "platform_administrators" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'OWNER';
ALTER TABLE "platform_administrators" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "platform_administrators" ADD CONSTRAINT "platform_administrators_role_check" CHECK ("role" IN ('OWNER', 'ADMIN', 'EMPLOYEE'));
ALTER TABLE "organisations" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'CUSTOMER';
ALTER TABLE "organisations" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "organisations" ADD COLUMN "archiveReason" TEXT;
ALTER TABLE "organisations" ADD CONSTRAINT "organisations_kind_check" CHECK ("kind" IN ('CUSTOMER', 'INTERNAL'));
ALTER TABLE "password_resets" ADD COLUMN "purpose" TEXT NOT NULL DEFAULT 'COMPANY';
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_purpose_check" CHECK ("purpose" IN ('COMPANY', 'PLATFORM'));

-- Give legacy owners an independent sign-in workspace. Customer grants stay unchanged.
INSERT INTO "organisations" ("id", "name", "slug", "kind", "status", "subscriptionStatus", "planName", "createdAt", "updatedAt")
VALUES ('atlas-internal-staff', 'Atlas team', 'atlas-internal-staff', 'INTERNAL', 'ACTIVE', 'ACTIVE', 'Internal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO "memberships" ("id", "organisationId", "userId", "createdAt")
SELECT 'atlas-staff-' || "userId", 'atlas-internal-staff', "userId", CURRENT_TIMESTAMP FROM "platform_administrators";
