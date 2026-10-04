-- Group chats and record links. Company rows stay stored, and new company messages are no longer written.
ALTER TABLE "chat_conversations" DROP CONSTRAINT IF EXISTS "chat_conversations_kind_check";
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_kind_check" CHECK ("kind" IN ('COMPANY', 'DIRECT', 'GROUP'));

CREATE TABLE "chat_links" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_links_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chat_links_type_check" CHECK ("entityType" IN ('SALES_ORDER', 'QUOTE', 'CUSTOMER', 'PROJECT', 'PRODUCT'))
);

CREATE INDEX "chat_links_messageId_idx" ON "chat_links"("messageId");
CREATE INDEX "chat_links_organisationId_entityType_entityId_idx" ON "chat_links"("organisationId", "entityType", "entityId");

ALTER TABLE "chat_links" ADD CONSTRAINT "chat_links_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_links" ADD CONSTRAINT "chat_links_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chat_participants" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "chat_participants" ADD COLUMN "contactId" TEXT;
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_person_check" CHECK (("userId" IS NOT NULL AND "contactId" IS NULL) OR ("userId" IS NULL AND "contactId" IS NOT NULL));
CREATE UNIQUE INDEX "chat_participants_conversation_contact_key" ON "chat_participants"("conversationId", "contactId") WHERE "contactId" IS NOT NULL;
CREATE INDEX "chat_participants_contactId_idx" ON "chat_participants"("contactId");
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
