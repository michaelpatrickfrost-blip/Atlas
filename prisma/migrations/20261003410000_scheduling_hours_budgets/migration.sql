CREATE TABLE "scheduling_hours_budgets" (
 "id" TEXT PRIMARY KEY,
 "organisationId" TEXT NOT NULL REFERENCES "organisations"("id") ON DELETE CASCADE,
 "managerUserId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
 "weekStart" DATE NOT NULL,
 "department" TEXT NOT NULL DEFAULT '',
 "minutes" INTEGER NOT NULL CHECK ("minutes" >= 0 AND "minutes" <= 60000000 AND "minutes" % 15 = 0),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "scheduling_hours_budgets_scope_key"
 ON "scheduling_hours_budgets"("organisationId","managerUserId","weekStart","department");
