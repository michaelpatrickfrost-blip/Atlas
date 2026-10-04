-- Registered company profile for company administration. Existing organisations keep an empty object.
ALTER TABLE "organisations" ADD COLUMN "companyProfile" JSONB NOT NULL DEFAULT '{}';
