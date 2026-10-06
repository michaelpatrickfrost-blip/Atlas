ALTER TABLE "parties"
  ADD COLUMN "identityScrubbed" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "contacts"
  ADD COLUMN "identityScrubbed" BOOLEAN NOT NULL DEFAULT false;
