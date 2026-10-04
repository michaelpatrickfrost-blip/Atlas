-- Company channel plus direct conversations, read cursors, and chat cards for tasks and meetings.
CREATE TABLE "chat_conversations" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "directKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chat_conversations_kind_check" CHECK ("kind" IN ('COMPANY', 'DIRECT'))
);

CREATE UNIQUE INDEX "chat_conversations_organisationId_directKey_key" ON "chat_conversations"("organisationId", "directKey");
CREATE INDEX "chat_conversations_organisationId_updatedAt_idx" ON "chat_conversations"("organisationId", "updatedAt");

ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "chat_participants" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_participants_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chat_participants_conversation_user" UNIQUE ("conversationId", "userId")
);

CREATE INDEX "chat_participants_organisationId_userId_idx" ON "chat_participants"("organisationId", "userId");

ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "chat_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "chat_conversations" ("id", "organisationId", "kind", "directKey", "createdAt", "updatedAt")
SELECT 'chatco_' || o."id", o."id", 'COMPANY', 'company', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "organisations" o
WHERE EXISTS (SELECT 1 FROM "chat_messages" m WHERE m."organisationId" = o."id");

ALTER TABLE "chat_messages" ADD COLUMN "conversationId" TEXT;
ALTER TABLE "chat_messages" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'TEXT';
ALTER TABLE "chat_messages" ADD COLUMN "taskId" TEXT;
ALTER TABLE "chat_messages" ADD COLUMN "meetingId" TEXT;

UPDATE "chat_messages" SET "conversationId" = 'chatco_' || "organisationId" WHERE "conversationId" IS NULL;
ALTER TABLE "chat_messages" ALTER COLUMN "conversationId" SET NOT NULL;

ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_kind_check" CHECK ("kind" IN ('TEXT', 'NOTE', 'TASK', 'MEETING'));
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "chat_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "project_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "chat_messages_conversationId_createdAt_idx" ON "chat_messages"("conversationId", "createdAt");

INSERT INTO "chat_participants" ("id", "organisationId", "conversationId", "userId", "lastReadAt")
SELECT 'chatr_' || md5(c."id" || ':' || mb."userId"), c."organisationId", c."id", mb."userId", CURRENT_TIMESTAMP
FROM "chat_conversations" c
JOIN "memberships" mb ON mb."organisationId" = c."organisationId" AND mb."active" = true
WHERE c."kind" = 'COMPANY'
ON CONFLICT ON CONSTRAINT "chat_participants_conversation_user" DO NOTHING;
