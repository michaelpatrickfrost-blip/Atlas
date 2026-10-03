ALTER TABLE organisations ADD COLUMN "salesPolicy" JSONB NOT NULL DEFAULT '{}';
CREATE TABLE sales_order_revisions (id TEXT PRIMARY KEY, "orderId" TEXT NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE, revision INTEGER NOT NULL, snapshot JSONB NOT NULL, reason TEXT NOT NULL, "createdByUserId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE UNIQUE INDEX sales_order_revisions_order_revision_key ON sales_order_revisions("orderId",revision);
CREATE TABLE domain_outbox (id TEXT PRIMARY KEY, "organisationId" TEXT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE, "eventKey" TEXT NOT NULL UNIQUE, "eventName" TEXT NOT NULL, payload JSONB NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING', attempts INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "publishedAt" TIMESTAMP(3));
CREATE INDEX domain_outbox_status_created_idx ON domain_outbox(status,"createdAt");
