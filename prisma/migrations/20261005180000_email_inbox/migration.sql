-- Additive: read replies over IMAP.
ALTER TABLE "email_accounts"
  ADD COLUMN IF NOT EXISTS "imapUser" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "imapEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "imapStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN IF NOT EXISTS "imapError" TEXT,
  ADD COLUMN IF NOT EXISTS "imapSyncedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "imapLastUid" INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS "email_inbound" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "uid" INTEGER NOT NULL,
  "messageId" TEXT,
  "inReplyTo" TEXT,
  "fromEmail" TEXT NOT NULL,
  "fromName" TEXT NOT NULL DEFAULT '',
  "subject" TEXT NOT NULL DEFAULT '',
  "text" TEXT NOT NULL DEFAULT '',
  "receivedAt" TIMESTAMP(3) NOT NULL,
  "partyId" TEXT,
  "contactId" TEXT,
  "replyToMessageId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_inbound_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "email_inbound_accountId_uid_key" ON "email_inbound"("accountId","uid");
CREATE INDEX IF NOT EXISTS "email_inbound_organisationId_receivedAt_idx" ON "email_inbound"("organisationId","receivedAt");
CREATE INDEX IF NOT EXISTS "email_inbound_organisationId_partyId_receivedAt_idx" ON "email_inbound"("organisationId","partyId","receivedAt");
