-- A customer contact can report to another contact in the same account group.
ALTER TABLE "contacts" ADD COLUMN "reportsToContactId" TEXT;

ALTER TABLE "contacts" ADD CONSTRAINT "contacts_reportsToContactId_fkey" FOREIGN KEY ("reportsToContactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

CREATE INDEX "contacts_reportsToContactId_idx" ON "contacts"("reportsToContactId");
