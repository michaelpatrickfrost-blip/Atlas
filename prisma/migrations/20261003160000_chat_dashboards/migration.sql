-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboards" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "widgets" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chat_messages_organisationId_createdAt_idx" ON "chat_messages"("organisationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "dashboards_organisationId_userId_name_key" ON "dashboards"("organisationId", "userId", "name");

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Upgrade platform administrator roles by capability, not by role name.
UPDATE "roles" SET "capabilities" = ARRAY(SELECT DISTINCT unnest("capabilities" || ARRAY['core.audit.read','core.chat.read','core.chat.write','projects.read','projects.manage'])) WHERE 'core.roles.manage' = ANY("capabilities");
UPDATE "roles" SET "capabilities" = ARRAY(SELECT DISTINCT unnest("capabilities" || ARRAY['core.chat.read','core.chat.write'])) WHERE 'sales.opportunity.read' = ANY("capabilities");
