-- Notes and mentions attached to a customer, order or sale.
CREATE TABLE "echo_notes" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "echo_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "echo_notes_organisationId_entityType_entityId_createdAt_idx" ON "echo_notes"("organisationId", "entityType", "entityId", "createdAt");

ALTER TABLE "echo_notes" ADD CONSTRAINT "echo_notes_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "echo_mentions" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "echo_mentions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "echo_mentions_noteId_userId_key" ON "echo_mentions"("noteId", "userId");
CREATE INDEX "echo_mentions_organisationId_userId_seenAt_idx" ON "echo_mentions"("organisationId", "userId", "seenAt");

ALTER TABLE "echo_mentions" ADD CONSTRAINT "echo_mentions_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "echo_mentions" ADD CONSTRAINT "echo_mentions_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "echo_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
